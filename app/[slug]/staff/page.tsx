'use client'
import { useState, useEffect, useCallback, use } from 'react'
import { supabase } from '@/lib/supabase'

const STAFF_PIN = '1234'

type OrderItem = { id: string; name: string; price: number; emoji: string; guest: string }
type Order = { id: string; table_number: number; items: OrderItem[]; total: number; done: boolean; created_at: string }
type WaiterCall = { id: string; table_number: number; guest_name: string; created_at: string; resolved: boolean }

export default function StaffPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(paramsPromise)

  const [authenticated, setAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [tab, setTab] = useState<'orders'|'waiter'>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([])
  const [filterDone, setFilterDone] = useState(false)

  const loadOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders_rt')
      .select('*')
      .eq('restaurant_slug', slug)
      .order('created_at', { ascending: false })
    if (data) setOrders(data as Order[])
  }, [slug])

  const loadWaiterCalls = useCallback(async () => {
    const { data } = await supabase
      .from('waiter_calls_rt')
      .select('*')
      .eq('restaurant_slug', slug)
      .eq('resolved', false)
      .order('created_at', { ascending: false })
    if (data) setWaiterCalls(data as WaiterCall[])
  }, [slug])

  useEffect(() => {
    if (!authenticated) return
    loadOrders()
    loadWaiterCalls()

    const ordersChannel = supabase
      .channel(`staff_orders_${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders_rt', filter: `restaurant_slug=eq.${slug}` },
        () => loadOrders())
      .subscribe()

    const waiterChannel = supabase
      .channel(`staff_waiter_${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waiter_calls_rt', filter: `restaurant_slug=eq.${slug}` },
        () => loadWaiterCalls())
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(waiterChannel)
    }
  }, [authenticated, loadOrders, loadWaiterCalls, slug])

  const tryPin = () => {
    if (pinInput === STAFF_PIN) {
      setAuthenticated(true)
    } else {
      setPinError(true)
      setPinInput('')
      setTimeout(() => setPinError(false), 1500)
    }
  }

  const markDone = async (orderId: string) => {
    await supabase.from('orders_rt').update({ done: true }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? {...o, done: true} : o))
  }

  const dismissWaiter = async (callId: string) => {
    await supabase.from('waiter_calls_rt').update({ resolved: true }).eq('id', callId)
    setWaiterCalls(prev => prev.filter(c => c.id !== callId))
  }

  const pendingOrders = orders.filter(o => !o.done)
  const doneOrders = orders.filter(o => o.done)
  const displayOrders = filterDone ? doneOrders : pendingOrders
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#1C1A18] flex items-center justify-center px-6">
        <div className="w-full max-w-xs text-center">
          <div className="w-16 h-16 bg-[#C17F3B] rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">R</div>
          <div className="text-white font-bold text-xl mb-1" style={{fontFamily:'Playfair Display,serif'}}>RSTGO</div>
          <div className="text-white/40 text-xs uppercase tracking-widest mb-8">Панель персоналу</div>
          <div className="text-white/70 text-sm mb-5">Введіть PIN-код персоналу</div>
          <div className={`flex justify-center gap-4 mb-6 transition-all ${pinError ? 'translate-x-1' : ''}`}>
            {[0,1,2,3].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i < pinInput.length ? 'bg-[#C17F3B] border-[#C17F3B] scale-110' : 'border-white/30'}`} />
            ))}
          </div>
          {pinError && <p className="text-red-400 text-sm mb-4 animate-pulse">Невірний PIN — спробуйте ще</p>}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} onClick={() => { if (pinInput.length < 6) setPinInput(p => p + n) }}
                className="h-14 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xl rounded-2xl transition-all">{n}</button>
            ))}
            <div />
            <button onClick={() => { if (pinInput.length < 6) setPinInput(p => p + '0') }}
              className="h-14 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xl rounded-2xl transition-all">0</button>
            <button onClick={() => setPinInput(p => p.slice(0, -1))}
              className="h-14 bg-white/10 hover:bg-white/20 active:scale-95 text-white/60 text-2xl rounded-2xl transition-all flex items-center justify-center">⌫</button>
          </div>
          <button onClick={tryPin} disabled={pinInput.length < 4}
            className="w-full py-3.5 bg-[#C17F3B] hover:bg-[#9A6328] text-white font-semibold rounded-xl transition-colors disabled:opacity-40">
            Увійти
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#141210]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap'); body{font-family:'DM Sans',sans-serif;}`}</style>
      <div className="bg-[#1C1A18] border-b border-white/10 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <div className="w-8 h-8 bg-[#C17F3B] rounded-lg flex items-center justify-center text-white font-bold text-sm">R</div>
        <div className="flex-1">
          <div className="text-white font-semibold text-sm" style={{fontFamily:'Playfair Display,serif'}}>RSTGO</div>
          <div className="text-white/40 text-xs">Панель персоналу · {slug}</div>
        </div>
        <div className="flex items-center gap-1.5 bg-[#3A7D58]/20 text-[#6FCF97] rounded-full px-3 py-1 text-xs font-semibold">
          <span className="w-1.5 h-1.5 bg-[#6FCF97] rounded-full animate-pulse" />LIVE
        </div>
        <button onClick={() => setAuthenticated(false)} className="text-white/30 hover:text-white/60 text-sm ml-1">Вийти</button>
      </div>

      <div className="flex gap-2 px-4 py-3">
        <button onClick={() => setTab('orders')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab==='orders' ? 'bg-[#C17F3B] text-white' : 'bg-white/8 text-white/50'}`}>
          📋 Замовлення {pendingOrders.length > 0 && <span className="ml-2 bg-white/25 px-1.5 py-0.5 rounded-full text-xs">{pendingOrders.length}</span>}
        </button>
        <button onClick={() => setTab('waiter')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab==='waiter' ? 'bg-[#C17F3B] text-white' : 'bg-white/8 text-white/50'}`}>
          🔔 Виклики {waiterCalls.length > 0 && <span className="ml-2 bg-red-500/70 px-1.5 py-0.5 rounded-full text-xs">{waiterCalls.length}</span>}
        </button>
      </div>

      <div className="px-4 pb-10">
        {tab === 'orders' && (
          <>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setFilterDone(false)} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${!filterDone ? 'bg-[#C17F3B] text-white' : 'bg-white/8 text-white/50'}`}>Активні ({pendingOrders.length})</button>
              <button onClick={() => setFilterDone(true)} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filterDone ? 'bg-[#C17F3B] text-white' : 'bg-white/8 text-white/50'}`}>Виконані ({doneOrders.length})</button>
            </div>
            {displayOrders.length === 0 ? (
              <div className="text-center py-16 text-white/30"><div className="text-5xl mb-3">🍽</div><p className="text-sm">{filterDone ? 'Виконаних замовлень немає' : 'Нових замовлень немає'}</p><p className="text-xs mt-1 text-white/20">Оновлюється автоматично</p></div>
            ) : (
              <div className="space-y-3">
                {displayOrders.map(order => {
                  const grouped: Record<string, OrderItem & {qty:number}> = {}
                  order.items.forEach(item => {
                    const key = `${item.guest}__${item.id}`
                    if (!grouped[key]) grouped[key] = {...item, qty: 0}
                    grouped[key].qty++
                  })
                  return (
                    <div key={order.id} className={`bg-[#2A2826] border rounded-2xl p-4 ${order.done ? 'border-white/5 opacity-40' : 'border-white/10'}`}>
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="bg-[#C17F3B]/15 text-[#C17F3B] font-bold text-sm px-3 py-1 rounded-lg">🪑 Стіл №{order.table_number}</span>
                        <span className="text-white/40 text-xs">⏰ {formatTime(order.created_at)}</span>
                        <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${order.done ? 'bg-white/10 text-white/40' : 'bg-[#3A7D58] text-white'}`}>{order.done ? '✓ Виконано' : '● НОВЕ'}</span>
                      </div>
                      <div className="space-y-2 mb-3">
                        {Object.values(grouped).map((item, i) => (
                          <div key={i} className="flex items-start justify-between gap-2">
                            <div><div className="text-white/40 text-xs mb-0.5">👤 {item.guest}</div><div className="text-white text-sm">{item.emoji} {item.name} ×{item.qty}</div></div>
                            <div className="text-[#C17F3B] font-semibold text-sm shrink-0">{item.price * item.qty} ₴</div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-white/8 pt-3 flex justify-between mb-3">
                        <span className="text-white/40 text-xs">Сума</span>
                        <span className="text-white font-bold">{order.total} ₴</span>
                      </div>
                      {!order.done && (
                        <button onClick={() => markDone(order.id)}
                          className="w-full py-2.5 bg-[#3A7D58]/20 hover:bg-[#3A7D58]/35 text-[#6FCF97] border border-[#3A7D58]/30 rounded-xl text-sm font-semibold transition-colors">
                          ✅ Страви подано — позначити виконаним
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === 'waiter' && (
          waiterCalls.length === 0 ? (
            <div className="text-center py-16 text-white/30"><div className="text-5xl mb-3">🔕</div><p className="text-sm">Активних викликів немає</p></div>
          ) : (
            <div className="space-y-3">
              {waiterCalls.map(call => (
                <div key={call.id} className="bg-[#C0392B]/10 border border-[#C0392B]/25 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔔</span>
                    <div>
                      <div className="text-[#F5A89E] font-semibold">Стіл №{call.table_number}</div>
                      <div className="text-[#F5A89E]/60 text-xs">{call.guest_name} · о {formatTime(call.created_at)}</div>
                    </div>
                  </div>
                  <button onClick={() => dismissWaiter(call.id)}
                    className="shrink-0 bg-[#C0392B]/20 hover:bg-[#C0392B]/35 text-[#F5A89E] border border-[#C0392B]/30 rounded-xl px-3 py-1.5 text-xs font-bold">
                    Виконано ✓
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
