'use client'
import { useState, useEffect, useCallback } from 'react'

const STAFF_PIN = '1234' // In production: fetch from DB by slug

type OrderItem = { id: string; name: string; price: number; emoji: string; guest: string }
type Order = { id: number; table: string; time: string; items: OrderItem[]; done: boolean }

export default function StaffPage({ params }: { params: { slug: string } }) {
  const ORDERS_KEY = `rstgo_${params.slug}_orders`
  const [pinInput, setPinInput] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [tab, setTab] = useState<'orders'|'waiter'>('orders')
  const [waiterCalls, setWaiterCalls] = useState<{table:string;time:string;by:string;key:string;idx:number}[]>([])
  const [filterDone, setFilterDone] = useState(false)

  const loadOrders = useCallback(() => {
    const raw = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]') as Order[]
    setOrders(raw)
  }, [ORDERS_KEY])

  const loadWaiterCalls = useCallback(() => {
    const all: {table:string;time:string;by:string;key:string;idx:number}[] = []
    for (let i = 1; i <= 50; i++) {
      const key = `rstgo_${params.slug}_waiter_${i}`
      const calls = JSON.parse(localStorage.getItem(key) || '[]')
      calls.forEach((c: {table:string;time:string;by:string}, ci: number) => all.push({...c, table: String(i), key, idx: ci}))
    }
    setWaiterCalls(all)
  }, [params.slug])

  useEffect(() => {
    if (!authenticated) return
    loadOrders()
    loadWaiterCalls()
    const interval = setInterval(() => { loadOrders(); loadWaiterCalls() }, 4000)
    return () => clearInterval(interval)
  }, [authenticated, loadOrders, loadWaiterCalls])

  const tryPin = () => {
    if (pinInput === STAFF_PIN) {
      setAuthenticated(true)
    } else {
      setPinError(true)
      setPinInput('')
      setTimeout(() => setPinError(false), 1500)
    }
  }

  const markDone = (orderId: number) => {
    const raw = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]') as Order[]
    const updated = raw.map(o => o.id === orderId ? {...o, done: true} : o)
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated))
    loadOrders()
  }

  const dismissWaiter = (key: string, idx: number) => {
    const calls = JSON.parse(localStorage.getItem(key) || '[]')
    calls.splice(idx, 1)
    localStorage.setItem(key, JSON.stringify(calls))
    loadWaiterCalls()
  }

  const pendingOrders = orders.filter(o => !o.done)
  const doneOrders = orders.filter(o => o.done)
  const displayOrders = filterDone ? doneOrders : pendingOrders

  // ── PIN SCREEN ──
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#1C1A18] flex items-center justify-center px-6">
        <div className="w-full max-w-xs text-center">
          <div className="w-16 h-16 bg-[#C17F3B] rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">R</div>
          <div className="text-white font-bold text-xl mb-1" style={{fontFamily:'Playfair Display,serif'}}>RSTGO</div>
          <div className="text-white/40 text-xs uppercase tracking-widest mb-8">Панель персоналу</div>

          <div className="text-white/70 text-sm mb-4">Введіть PIN-код персоналу</div>

          <div className={`flex justify-center gap-3 mb-6 transition-transform ${pinError ? 'translate-x-2' : ''}`}>
            {[0,1,2,3].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 transition-colors ${i < pinInput.length ? 'bg-[#C17F3B] border-[#C17F3B]' : 'border-white/30'}`} />
            ))}
          </div>

          {pinError && <p className="text-red-400 text-sm mb-4 animate-pulse">Невірний PIN</p>}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} onClick={() => { if (pinInput.length < 6) setPinInput(p => p + n) }}
                className="h-14 bg-white/10 hover:bg-white/20 text-white font-semibold text-xl rounded-2xl transition-colors active:scale-95">
                {n}
              </button>
            ))}
            <div /> {/* spacer */}
            <button onClick={() => { if (pinInput.length < 6) setPinInput(p => p + '0') }}
              className="h-14 bg-white/10 hover:bg-white/20 text-white font-semibold text-xl rounded-2xl transition-colors active:scale-95">
              0
            </button>
            <button onClick={() => setPinInput(p => p.slice(0,-1))}
              className="h-14 bg-white/10 hover:bg-white/20 text-white/60 rounded-2xl transition-colors text-2xl flex items-center justify-center active:scale-95">
              ⌫
            </button>
          </div>

          <button onClick={tryPin} disabled={pinInput.length < 4}
            className="w-full py-3.5 bg-[#C17F3B] hover:bg-[#9A6328] text-white font-semibold rounded-xl transition-colors disabled:opacity-40">
            Увійти
          </button>
        </div>
      </div>
    )
  }

  // ── STAFF PANEL ──
  return (
    <div className="min-h-screen bg-[#141210]" style={{fontFamily:'DM Sans,sans-serif'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* Header */}
      <div className="bg-[#1C1A18] border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#C17F3B] rounded-lg flex items-center justify-center text-white font-bold text-sm">R</div>
        <div className="flex-1">
          <div className="text-white font-semibold text-sm" style={{fontFamily:'Playfair Display,serif'}}>RSTGO</div>
          <div className="text-white/40 text-xs">Панель персоналу</div>
        </div>
        <div className="flex items-center gap-1.5 bg-[#3A7D58]/20 text-[#6FCF97] rounded-full px-3 py-1 text-xs font-semibold">
          <span className="w-1.5 h-1.5 bg-[#6FCF97] rounded-full animate-pulse" />LIVE
        </div>
        <button onClick={() => setAuthenticated(false)}
          className="text-white/30 hover:text-white/60 text-sm transition-colors ml-2">Вийти</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3">
        <button onClick={() => setTab('orders')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab==='orders' ? 'bg-[#C17F3B] text-white' : 'bg-white/8 text-white/50 hover:bg-white/12'}`}>
          📋 Замовлення {pendingOrders.length > 0 && <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{pendingOrders.length}</span>}
        </button>
        <button onClick={() => setTab('waiter')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab==='waiter' ? 'bg-[#C17F3B] text-white' : 'bg-white/8 text-white/50 hover:bg-white/12'}`}>
          🔔 Виклики {waiterCalls.length > 0 && <span className="ml-1 bg-red-500/60 px-1.5 py-0.5 rounded-full text-xs">{waiterCalls.length}</span>}
        </button>
      </div>

      <div className="px-4 pb-8">

        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setFilterDone(false)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${!filterDone ? 'bg-[#C17F3B] text-white' : 'bg-white/8 text-white/50'}`}>
                Активні ({pendingOrders.length})
              </button>
              <button onClick={() => setFilterDone(true)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterDone ? 'bg-[#C17F3B] text-white' : 'bg-white/8 text-white/50'}`}>
                Виконані ({doneOrders.length})
              </button>
            </div>

            {displayOrders.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <div className="text-4xl mb-3">🍽</div>
                <p className="text-sm">{filterDone ? 'Виконаних замовлень немає' : 'Активних замовлень немає'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...displayOrders].reverse().map(order => {
                  const grouped: Record<string, OrderItem & {qty:number}> = {}
                  order.items.forEach(item => {
                    const key = `${item.guest}__${item.id}`
                    if (!grouped[key]) grouped[key] = {...item, qty: 0}
                    grouped[key].qty++
                  })
                  const total = Object.values(grouped).reduce((s,i) => s + i.price*i.qty, 0)
                  return (
                    <div key={order.id} className={`bg-[#2A2826] border rounded-2xl p-4 transition-opacity ${order.done ? 'border-white/5 opacity-50' : 'border-white/10'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-[#C17F3B]/15 text-[#C17F3B] font-bold text-sm px-3 py-1 rounded-lg">🪑 Стіл №{order.table}</div>
                        <span className="text-white/40 text-xs">⏰ {order.time}</span>
                        <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${order.done ? 'bg-white/10 text-white/40' : 'bg-[#3A7D58] text-white'}`}>
                          {order.done ? '✓ Виконано' : '● НОВЕ'}
                        </span>
                      </div>

                      <div className="space-y-1.5 mb-3">
                        {Object.values(grouped).map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div>
                              <div className="text-white/40 text-xs">{item.guest}</div>
                              <div className="text-white text-sm">{item.emoji} {item.name} ×{item.qty}</div>
                            </div>
                            <div className="text-[#C17F3B] font-semibold text-sm">{item.price*item.qty} ₴</div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-white/8 pt-3 flex items-center justify-between">
                        <span className="text-white/40 text-xs">Разом</span>
                        <span className="text-white font-bold">{total} ₴</span>
                      </div>

                      {!order.done && (
                        <button onClick={() => markDone(order.id)}
                          className="w-full mt-3 py-2.5 bg-[#3A7D58]/20 hover:bg-[#3A7D58]/35 text-[#6FCF97] border border-[#3A7D58]/30 rounded-xl text-sm font-semibold transition-colors">
                          ✅ Позначити виконаним
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* WAITER TAB */}
        {tab === 'waiter' && (
          <>
            {waiterCalls.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <div className="text-4xl mb-3">🔕</div>
                <p className="text-sm">Активних викликів немає</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...waiterCalls].reverse().map((call, i) => (
                  <div key={i} className="bg-[#C0392B]/10 border border-[#C0392B]/25 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔔</span>
                      <div>
                        <div className="text-[#F5A89E] font-semibold text-sm">Стіл №{call.table}</div>
                        <div className="text-[#F5A89E]/60 text-xs">о {call.time} · {call.by}</div>
                      </div>
                    </div>
                    <button onClick={() => dismissWaiter(call.key, call.idx)}
                      className="shrink-0 bg-[#C0392B]/20 hover:bg-[#C0392B]/35 text-[#F5A89E] border border-[#C0392B]/30 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors">
                      Виконано ✓
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
