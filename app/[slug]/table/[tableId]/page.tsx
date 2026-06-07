'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'

const MENU = [
  { cat: 'Салати', emoji: '🥗', items: [
    { id: 's1', name: 'Грецький салат', desc: 'Томати, огірок, маслини, фета', price: 149 },
    { id: 's2', name: 'Цезар з куркою', desc: 'Листя айсберг, гриль, пармезан', price: 179 },
    { id: 's3', name: 'Теплий салат', desc: 'Індичка, гриби, томати черрі', price: 189 },
  ]},
  { cat: 'Супи', emoji: '🍲', items: [
    { id: 'p1', name: 'Борщ', desc: 'Традиційний зі сметаною та пампушками', price: 129 },
    { id: 'p2', name: 'Крем-суп', desc: 'Гарбуз, імбир, вершки', price: 119 },
  ]},
  { cat: 'Основні', emoji: '🍽', items: [
    { id: 'm1', name: 'Стейк свинина', desc: '350г, картопля фрі, соус', price: 289 },
    { id: 'm2', name: 'Куряче філе', desc: 'Гриль, рис, сезонні овочі', price: 239 },
    { id: 'm3', name: 'Лосось', desc: 'Запечений, пюре, лимонний соус', price: 349 },
    { id: 'm4', name: 'Вареники', desc: 'З картоплею, смажена цибуля', price: 149 },
  ]},
  { cat: 'Піца', emoji: '🍕', items: [
    { id: 'z1', name: 'Маргарита', desc: 'Томат, моцарела, базилік', price: 229 },
    { id: 'z2', name: 'Пепероні', desc: 'Гостра ковбаска, моцарела', price: 259 },
  ]},
  { cat: 'Напої', emoji: '🥤', items: [
    { id: 'n1', name: 'Свіжовичавлений', desc: 'Апельсин, яблуко або морква', price: 89 },
    { id: 'n2', name: 'Кава', desc: 'Американо, латте або капучіно', price: 79 },
    { id: 'n3', name: 'Лимонад', desc: "М'ята або ягідний", price: 99 },
    { id: 'n4', name: 'Вода', desc: 'Негазована або газована 500мл', price: 39 },
  ]},
  { cat: 'Десерти', emoji: '🍰', items: [
    { id: 'd1', name: 'Медовик', desc: 'Класичний торт зі сметанним кремом', price: 119 },
    { id: 'd2', name: 'Тірамісу', desc: 'Маскарпоне, кава, какао', price: 139 },
  ]},
]

const COLORS = [
  {bg:'#FFF3E0',fg:'#E65100'},{bg:'#E8F5E9',fg:'#2E7D32'},
  {bg:'#E3F2FD',fg:'#1565C0'},{bg:'#F3E5F5',fg:'#6A1B9A'},
  {bg:'#E0F7FA',fg:'#006064'},{bg:'#FCE4EC',fg:'#AD1457'},
  {bg:'#FBE9E7',fg:'#BF360C'},{bg:'#F9FBE7',fg:'#558B2F'},
]
function gColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % COLORS.length
  return COLORS[h]
}
function ini(n: string) { return n.trim().charAt(0).toUpperCase() }

type CartItem = { id: string; name: string; price: number; emoji: string }
type GuestSession = { guest_name: string; cart: CartItem[] }

export default function CustomerPage({ params: paramsPromise }: { params: Promise<{ slug: string; tableId: string }> }) {
  const { slug, tableId } = use(paramsPromise)
  const tableNum = parseInt(tableId)

  const [screen, setScreen] = useState<'name'|'menu'|'cart'|'success'>('name')
  const [currentUser, setCurrentUser] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [sessions, setSessions] = useState<GuestSession[]>([])
  const [activeCat, setActiveCat] = useState(MENU[0].cat)
  const [cartTab, setCartTab] = useState<'cart'|'split'>('cart')
  const [showWaiterModal, setShowWaiterModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState<string|null>(null)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSessions = async () => {
      const { data } = await supabase
        .from('table_sessions')
        .select('guest_name, cart')
        .eq('restaurant_slug', slug)
        .eq('table_number', tableNum)
      if (data) setSessions(data as GuestSession[])
    }

    fetchSessions()

    const channel = supabase
      .channel(`table_${slug}_${tableNum}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'table_sessions',
        filter: `restaurant_slug=eq.${slug}`,
      }, () => fetchSessions())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [slug, tableNum])

  const myCart: CartItem[] = sessions.find(s => s.guest_name === currentUser)?.cart || []
  const getQty = (id: string) => myCart.filter(i => i.id === id).length
  const totalCount = () => sessions.reduce((s, g) => s + (g.cart?.length || 0), 0)

  const saveCart = async (cart: CartItem[]) => {
    setSaving(true)
    await supabase.from('table_sessions').upsert({
      restaurant_slug: slug, table_number: tableNum, guest_name: currentUser,
      cart, updated_at: new Date().toISOString(),
    }, { onConflict: 'restaurant_slug,table_number,guest_name' })
    setSaving(false)
  }

  const enterMenu = async () => {
    if (!nameInput.trim()) return
    const user = nameInput.trim()
    setCurrentUser(user)
    await supabase.from('table_sessions').upsert({
      restaurant_slug: slug, table_number: tableNum, guest_name: user,
      cart: [], updated_at: new Date().toISOString(),
    }, { onConflict: 'restaurant_slug,table_number,guest_name' })
    setScreen('menu')
  }

  const addToCart = async (itemId: string) => {
    const item = MENU.flatMap(c => c.items).find(i => i.id === itemId)!
    const cat = MENU.find(c => c.items.some(i => i.id === itemId))!
    const newCart = [...myCart, { id: item.id, name: item.name, price: item.price, emoji: cat.emoji }]
    setSessions(prev => prev.map(s => s.guest_name === currentUser ? {...s, cart: newCart} : s))
    await saveCart(newCart)
  }

  const changeQty = async (itemId: string, delta: number) => {
    let newCart = [...myCart]
    if (delta === 1) {
      const item = MENU.flatMap(c => c.items).find(i => i.id === itemId)!
      const cat = MENU.find(c => c.items.some(i => i.id === itemId))!
      newCart.push({ id: item.id, name: item.name, price: item.price, emoji: cat.emoji })
    } else {
      const idx = newCart.findLastIndex(i => i.id === itemId)
      if (idx !== -1) newCart.splice(idx, 1)
    }
    setSessions(prev => prev.map(s => s.guest_name === currentUser ? {...s, cart: newCart} : s))
    await saveCart(newCart)
  }

  const removeGuest = async (name: string) => {
    await supabase.from('table_sessions').delete()
      .eq('restaurant_slug', slug).eq('table_number', tableNum).eq('guest_name', name)
    setSessions(prev => prev.filter(s => s.guest_name !== name))
    setShowRemoveModal(null)
  }

  const leaveTable = async () => {
    await supabase.from('table_sessions').delete()
      .eq('restaurant_slug', slug).eq('table_number', tableNum).eq('guest_name', currentUser)
    setSessions(prev => prev.filter(s => s.guest_name !== currentUser))
    setCurrentUser(''); setNameInput(''); setShowLeaveModal(false); setScreen('name')
  }

  const callWaiter = async () => {
    await supabase.from('waiter_calls_rt').insert({
      restaurant_slug: slug, table_number: tableNum, guest_name: currentUser || 'Гість',
    })
    setShowWaiterModal(false)
    alert(`✅ Офіціант повідомлений! Очікуйте біля столу №${tableId}`)
  }

  const submitOrder = async () => {
    const activeGuests = sessions.filter(s => s.cart.length > 0)
    if (!activeGuests.length) return
    const allItems = activeGuests.flatMap(s => s.cart.map(item => ({ ...item, guest: s.guest_name })))
    const total = allItems.reduce((s, i) => s + i.price, 0)
    await supabase.from('orders_rt').insert({
      restaurant_slug: slug, table_number: tableNum, items: allItems, total, done: false,
    })
    await supabase.from('table_sessions')
      .update({ cart: [], updated_at: new Date().toISOString() })
      .eq('restaurant_slug', slug).eq('table_number', tableNum)
    setSessions(prev => prev.map(s => ({...s, cart: []})))
    setScreen('success')
  }

  const otherGuests = sessions.filter(s => s.guest_name !== currentUser)

  return (
    <div className="min-h-screen bg-[#FAF8F5] font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap'); body{font-family:'DM Sans',sans-serif;}`}</style>

      {screen === 'name' && (
        <div className="min-h-screen flex items-center justify-center px-6 bg-white">
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-[#C17F3B] rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">R</div>
            <div className="text-xl font-bold mb-1" style={{fontFamily:'Playfair Display,serif'}}>RSTGO</div>
            <div className="text-xs text-[#9A9490] uppercase tracking-widest mb-6">Ресторан · Стіл №{tableId}</div>
            <div className="inline-flex items-center gap-2 bg-[#F5E9D8] text-[#9A6328] rounded-full px-4 py-2 text-sm font-semibold mb-8">🪑 Стіл №{tableId}</div>
            <div style={{fontFamily:'Playfair Display,serif'}} className="text-2xl font-bold mb-2">Як вас звати?</div>
            <p className="text-[#6B6560] text-sm mb-6">Введіть ім&apos;я — без реєстрації</p>
            <input value={nameInput} onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enterMenu()}
              className="w-full px-4 py-3.5 border-2 border-[#E8E0D4] rounded-2xl text-center text-lg focus:border-[#C17F3B] focus:outline-none mb-3"
              placeholder="Ваше ім'я..." maxLength={24} />
            <button onClick={enterMenu}
              className="w-full py-3.5 bg-[#C17F3B] hover:bg-[#9A6328] text-white font-semibold rounded-2xl transition-colors">
              Переглянути меню →
            </button>
            {otherGuests.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[#E8E0D4]">
                <p className="text-xs text-[#9A9490] uppercase tracking-wider mb-3">Вже за столом</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {otherGuests.map(s => {
                    const c = gColor(s.guest_name)
                    return <span key={s.guest_name} style={{background:c.bg,color:c.fg}} className="px-3 py-1 rounded-full text-sm font-semibold">👤 {s.guest_name}</span>
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {screen === 'menu' && (
        <div className="flex flex-col min-h-screen">
          <div className="sticky top-0 z-40 bg-white border-b border-[#E8E0D4] px-4 py-3 flex items-center gap-3">
            <div style={{background:gColor(currentUser).fg}} className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">{ini(currentUser)}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{currentUser} {saving && <span className="text-xs text-[#C17F3B]">●</span>}</div>
              <div className="text-xs text-[#9A9490]">Стіл №{tableId} · {sessions.length} {sessions.length === 1 ? 'гість' : 'гостей'}</div>
            </div>
          </div>
          <div className="sticky top-[61px] z-30 bg-white border-b border-[#E8E0D4]">
            <div className="flex gap-2 px-4 py-2.5 overflow-x-auto" style={{scrollbarWidth:'none'}}>
              {MENU.map(c => (
                <button key={c.cat} onClick={() => setActiveCat(c.cat)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCat === c.cat ? 'bg-[#C17F3B] text-white' : 'bg-[#F5F3EF] text-[#6B6560]'}`}>
                  {c.emoji} {c.cat}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 p-4 pb-28">
            {MENU.filter(c => c.cat === activeCat).map(cat => (
              <div key={cat.cat}>
                <div style={{fontFamily:'Playfair Display,serif'}} className="text-lg font-bold mb-3">{cat.emoji} {cat.cat}</div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {cat.items.map(item => {
                    const qty = getQty(item.id)
                    return (
                      <div key={item.id} className={`bg-white rounded-2xl p-3 border relative ${qty > 0 ? 'border-[#C17F3B] shadow-sm' : 'border-[#E8E0D4]'}`}>
                        {qty > 0 && <div className="absolute top-2 right-2 w-5 h-5 bg-[#3A7D58] rounded-full text-white text-xs flex items-center justify-center font-bold">{qty}</div>}
                        <div className="text-3xl mb-2">{cat.emoji}</div>
                        <div className="font-semibold text-xs mb-1 leading-tight">{item.name}</div>
                        <div className="text-[10px] text-[#9A9490] mb-2 leading-tight">{item.desc}</div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[#C17F3B]">{item.price} ₴</span>
                          <button onClick={() => addToCart(item.id)} className="w-7 h-7 rounded-full bg-[#C17F3B] text-white flex items-center justify-center hover:bg-[#9A6328]">+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          {totalCount() > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E8E0D4] px-4 py-3 flex gap-2">
              <button onClick={() => setShowWaiterModal(true)} className="w-12 h-12 rounded-2xl bg-[#FDECEA] text-[#C0392B] text-xl flex items-center justify-center border border-[#F5C6C2] shrink-0">🔔</button>
              <button onClick={() => { setCartTab('cart'); setScreen('cart') }}
                className="flex-1 bg-[#1C1A18] text-white font-semibold rounded-2xl flex items-center justify-between px-4 py-2.5">
                <span>Кошик</span>
                <span className="bg-[#C17F3B] text-white text-xs font-bold px-2.5 py-1 rounded-full">{totalCount()}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {screen === 'cart' && (
        <div className="flex flex-col min-h-screen">
          <div className="sticky top-0 z-40 bg-white border-b border-[#E8E0D4] px-4 py-3 flex items-center gap-3">
            <button onClick={() => setScreen('menu')} className="w-9 h-9 rounded-xl bg-[#F5F3EF] border border-[#E8E0D4] flex items-center justify-center text-lg">←</button>
            <span style={{fontFamily:'Playfair Display,serif'}} className="text-lg font-bold flex-1">Замовлення столу</span>
            <button onClick={() => setShowWaiterModal(true)} className="px-3 py-1.5 bg-[#FDECEA] text-[#C0392B] rounded-xl text-xs font-semibold border border-[#F5C6C2]">🔔 Офіціант</button>
          </div>
          <div className="flex gap-2 p-4 pb-0">
            <button onClick={() => setCartTab('cart')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${cartTab==='cart' ? 'bg-[#1C1A18] text-white' : 'bg-white border border-[#E8E0D4] text-[#6B6560]'}`}>🛒 Кошик</button>
            <button onClick={() => setCartTab('split')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${cartTab==='split' ? 'bg-[#1C1A18] text-white' : 'bg-white border border-[#E8E0D4] text-[#6B6560]'}`}>💳 Розрахунок</button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto pb-8">
            {cartTab === 'cart' && (() => {
              const activeGuests = sessions.filter(s => s.cart.length > 0)
              if (!activeGuests.length) return <div className="text-center py-16 text-[#9A9490]"><div className="text-5xl mb-3">🛒</div><p>Кошик порожній</p></div>
              let allTotal = 0
              return (
                <>
                  {activeGuests.map(session => {
                    const isMe = session.guest_name === currentUser
                    const c = gColor(session.guest_name)
                    const grouped: Record<string, CartItem & {qty:number}> = {}
                    session.cart.forEach(item => {
                      if (!grouped[item.id]) grouped[item.id] = {...item, qty: 0}
                      grouped[item.id].qty++
                    })
                    return (
                      <div key={session.guest_name} className="mb-5">
                        <div className="flex items-center gap-2 mb-2">
                          <div style={{background:c.bg,color:c.fg}} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">{ini(session.guest_name)}</div>
                          <span className="font-semibold text-sm flex-1">{session.guest_name}</span>
                          {isMe && <span className="text-xs bg-[#F5E9D8] text-[#9A6328] px-2 py-0.5 rounded-full">це ви</span>}
                          {isMe
                            ? <button onClick={() => setShowLeaveModal(true)} className="text-xs text-[#C0392B] bg-[#FDECEA] px-2.5 py-1 rounded-lg border border-[#F5C6C2]">🚪 Покинути</button>
                            : <button onClick={() => setShowRemoveModal(session.guest_name)} className="text-xs text-[#C0392B] bg-[#FDECEA] px-2.5 py-1 rounded-lg border border-[#F5C6C2]">✕ Видалити</button>
                          }
                        </div>
                        {Object.values(grouped).map(item => {
                          const lt = item.price * item.qty; allTotal += lt
                          return (
                            <div key={item.id} className="bg-white border border-[#E8E0D4] rounded-xl px-3 py-2.5 mb-1.5 flex items-center gap-3">
                              <span className="text-xl">{item.emoji}</span>
                              <div className="flex-1"><div className="font-medium text-sm">{item.name}</div><div className="text-xs text-[#9A9490]">{item.price} ₴ × {item.qty} = {lt} ₴</div></div>
                              {isMe && (
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-[#F5F3EF] border border-[#E8E0D4] text-sm font-bold flex items-center justify-center">−</button>
                                  <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                                  <button onClick={() => changeQty(item.id, 1)} className="w-6 h-6 rounded-lg bg-[#F5F3EF] border border-[#E8E0D4] text-sm font-bold flex items-center justify-center">+</button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                  <div className="border-t border-[#E8E0D4] pt-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[#6B6560] text-sm">Разом по столу</span>
                      <span style={{fontFamily:'Playfair Display,serif'}} className="text-2xl font-bold">{allTotal} <span className="text-[#C17F3B]">₴</span></span>
                    </div>
                  </div>
                  <button onClick={submitOrder} className="w-full py-4 bg-[#3A7D58] text-white font-semibold rounded-2xl hover:bg-[#2d6444]">✅ Відправити замовлення на кухню</button>
                </>
              )
            })()}
            {cartTab === 'split' && (() => {
              const activeGuests = sessions.filter(s => s.cart.length > 0)
              if (!activeGuests.length) return <div className="text-center py-16 text-[#9A9490]"><div className="text-5xl mb-3">💳</div><p>Немає страв для розрахунку</p></div>
              let grandTotal = 0
              return (
                <>
                  <p className="text-sm text-[#6B6560] mb-4">Хто скільки платить:</p>
                  {activeGuests.map(session => {
                    const c = gColor(session.guest_name)
                    const isMe = session.guest_name === currentUser
                    const grouped: Record<string, CartItem & {qty:number}> = {}
                    session.cart.forEach(i => { if (!grouped[i.id]) grouped[i.id] = {...i, qty: 0}; grouped[i.id].qty++ })
                    const gTotal = Object.values(grouped).reduce((s,i) => s + i.price*i.qty, 0)
                    grandTotal += gTotal
                    return (
                      <div key={session.guest_name} className="bg-white border border-[#E8E0D4] rounded-2xl p-4 mb-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div style={{background:c.bg,color:c.fg}} className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">{ini(session.guest_name)}</div>
                          <span className="font-semibold flex-1">{session.guest_name}{isMe ? ' (ви)' : ''}</span>
                          <span style={{fontFamily:'Playfair Display,serif'}} className="text-xl font-bold text-[#C17F3B]">{gTotal} ₴</span>
                        </div>
                        {Object.values(grouped).map(item => (
                          <div key={item.id} className="flex justify-between text-sm py-1 border-b border-[#F0EAE2] last:border-0">
                            <span>{item.emoji} {item.name}{item.qty > 1 ? ` ×${item.qty}` : ''}</span>
                            <span className="font-medium text-[#6B6560]">{item.price*item.qty} ₴</span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                  <div className="bg-[#F5F3EF] rounded-2xl p-4 mt-2">
                    <div className="flex justify-between font-bold"><span>Загальний рахунок</span><span className="text-[#C17F3B]">{grandTotal} ₴</span></div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {screen === 'success' && (
        <div className="min-h-screen flex items-center justify-center px-6 bg-white text-center">
          <div>
            <div className="w-20 h-20 bg-[#E6F4ED] rounded-full flex items-center justify-center text-4xl mx-auto mb-5">✅</div>
            <div style={{fontFamily:'Playfair Display,serif'}} className="text-3xl font-bold mb-3">Замовлення прийнято!</div>
            <p className="text-[#6B6560] mb-6">Ваше замовлення вже на кухні.<br />Очікуйте — персонал принесе все до столу №{tableId}.</p>
            <div className="inline-flex items-center gap-2 bg-[#F5E9D8] text-[#9A6328] rounded-full px-5 py-2.5 font-semibold mb-8">🪑 Стіл №{tableId}</div>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <button onClick={() => setScreen('menu')} className="w-full py-3.5 bg-[#C17F3B] text-white font-semibold rounded-2xl">Додати ще щось</button>
              <button onClick={() => setShowWaiterModal(true)} className="w-full py-3.5 bg-[#FDECEA] text-[#C0392B] font-semibold rounded-2xl border border-[#F5C6C2]">🔔 Викликати офіціанта</button>
            </div>
          </div>
        </div>
      )}

      {showWaiterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-sm text-center">
            <div className="w-10 h-1 bg-[#E8E0D4] rounded-full mx-auto mb-5" />
            <div className="text-4xl mb-3">🔔</div>
            <div style={{fontFamily:'Playfair Display,serif'}} className="text-xl font-bold mb-2">Викликати офіціанта?</div>
            <p className="text-[#6B6560] text-sm mb-6">Офіціант підійде до столу №{tableId}.</p>
            <button onClick={callWaiter} className="w-full py-3.5 bg-[#C17F3B] text-white font-semibold rounded-xl mb-2">Так, викликати</button>
            <button onClick={() => setShowWaiterModal(false)} className="w-full py-3.5 border border-[#E8E0D4] rounded-xl text-sm">Скасувати</button>
          </div>
        </div>
      )}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-sm text-center">
            <div className="w-10 h-1 bg-[#E8E0D4] rounded-full mx-auto mb-5" />
            <div className="text-4xl mb-3">👤</div>
            <div style={{fontFamily:'Playfair Display,serif'}} className="text-xl font-bold mb-2">Видалити «{showRemoveModal}»?</div>
            <p className="text-[#6B6560] text-sm mb-6">Усі страви цього гостя будуть видалені.</p>
            <button onClick={() => removeGuest(showRemoveModal)} className="w-full py-3.5 bg-[#C0392B] text-white font-semibold rounded-xl mb-2">Так, видалити</button>
            <button onClick={() => setShowRemoveModal(null)} className="w-full py-3.5 border border-[#E8E0D4] rounded-xl text-sm">Скасувати</button>
          </div>
        </div>
      )}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-sm text-center">
            <div className="w-10 h-1 bg-[#E8E0D4] rounded-full mx-auto mb-5" />
            <div className="text-4xl mb-3">🚪</div>
            <div style={{fontFamily:'Playfair Display,serif'}} className="text-xl font-bold mb-2">Покинути стіл?</div>
            <p className="text-[#6B6560] text-sm mb-6">Ваші страви будуть видалені. Замовлення інших збережеться.</p>
            <button onClick={leaveTable} className="w-full py-3.5 bg-[#C0392B] text-white font-semibold rounded-xl mb-2">Так, покинути стіл</button>
            <button onClick={() => setShowLeaveModal(false)} className="w-full py-3.5 border border-[#E8E0D4] rounded-xl text-sm">Скасувати</button>
          </div>
        </div>
      )}
    </div>
  )
}
