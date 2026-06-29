'use client'
import { useState, useEffect, use, useRef } from 'react'
import {
  subscribeTableSessions, upsertTableSession, deleteTableSession,
  createOrder, createWaiterCall, subscribeMenu,
} from '@/lib/supabase'
import type { MenuCategoryDoc } from '@/lib/supabase'

// ─── Sent order batch (items already sent to kitchen, stays visible) ───
type SentBatch = {
  id: string
  items: Array<CartItem & { qty: number }>
  total: number
  sentAt: string
}

const DEFAULT_MENU: MenuCategoryDoc[] = [
  { id: 'c1', name: 'Салати', emoji: '🥗', items: [
    { id: 's1', name: 'Грецький салат', desc: 'Томати, огірок, маслини, фета', price: 149, available: true },
    { id: 's2', name: 'Цезар з куркою', desc: 'Листя айсберг, гриль, пармезан', price: 179, available: true },
    { id: 's3', name: 'Теплий салат', desc: 'Індичка, гриби, томати черрі', price: 189, available: true },
  ]},
  { id: 'c2', name: 'Супи', emoji: '🍲', items: [
    { id: 'p1', name: 'Борщ', desc: 'Традиційний зі сметаною та пампушками', price: 129, available: true },
    { id: 'p2', name: 'Крем-суп', desc: 'Гарбуз, імбир, вершки', price: 119, available: true },
  ]},
  { id: 'c3', name: 'Основні', emoji: '🍽', items: [
    { id: 'm1', name: 'Стейк свинина', desc: '350г, картопля фрі, соус', price: 289, available: true },
    { id: 'm2', name: 'Куряче філе', desc: 'Гриль, рис, сезонні овочі', price: 239, available: true },
    { id: 'm3', name: 'Лосось', desc: 'Запечений, пюре, лимонний соус', price: 349, available: true },
    { id: 'm4', name: 'Вареники', desc: 'З картоплею, смажена цибуля', price: 149, available: true },
  ]},
  { id: 'c4', name: 'Піца', emoji: '🍕', items: [
    { id: 'z1', name: 'Маргарита', desc: 'Томат, моцарела, базилік', price: 229, available: true },
    { id: 'z2', name: 'Пепероні', desc: 'Гостра ковбаска, моцарела', price: 259, available: true },
  ]},
  { id: 'c5', name: 'Напої', emoji: '🥤', items: [
    { id: 'n1', name: 'Свіжовичавлений', desc: 'Апельсин, яблуко або морква', price: 89, available: true },
    { id: 'n2', name: 'Кава', desc: 'Американо, латте або капучіно', price: 79, available: true },
    { id: 'n3', name: 'Лимонад', desc: "М'ята або ягідний", price: 99, available: true },
    { id: 'n4', name: 'Вода', desc: 'Негазована або газована 500мл', price: 39, available: true },
  ]},
  { id: 'c6', name: 'Десерти', emoji: '🍰', items: [
    { id: 'd1', name: 'Медовик', desc: 'Класичний торт зі сметанним кремом', price: 119, available: true },
    { id: 'd2', name: 'Тірамісу', desc: 'Маскарпоне, кава, какао', price: 139, available: true },
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
type Toast = { id: number; message: string; emoji: string; color: string }

export default function CustomerPage({ params: paramsPromise }: { params: Promise<{ slug: string; tableId: string }> }) {
  const { slug, tableId } = use(paramsPromise)
  const tableNum = parseInt(tableId)

  const [menu, setMenu] = useState<MenuCategoryDoc[]>(DEFAULT_MENU)
  const [screen, setScreen] = useState<'name'|'menu'>('name')
  const [currentUser, setCurrentUser] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [sessions, setSessions] = useState<GuestSession[]>([])
  const [activeCat, setActiveCat] = useState(DEFAULT_MENU[0].id)
  const [showWaiterModal, setShowWaiterModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [expandedItem, setExpandedItem] = useState<string|null>(null)
  const [cartBump, setCartBump] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [waiterSent, setWaiterSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Cart popup
  const [cartOpen, setCartOpen] = useState(false)
  // Sent batches: items already sent to kitchen (stay visible)
  const [sentBatches, setSentBatches] = useState<SentBatch[]>([])
  // Checkout modal
  const [showCheckout, setShowCheckout] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const catRefs = useRef<Record<string, HTMLDivElement|null>>({})
  const toastId = useRef(0)

  useEffect(() => {
    const unsub = subscribeTableSessions(slug, tableNum, (data) => {
      setSessions(data.map(s => ({ guest_name: s.guest_name, cart: s.cart })))
    })
    return () => unsub()
  }, [slug, tableNum])

  useEffect(() => {
    const unsub = subscribeMenu(slug, (cats) => {
      if (cats && cats.length > 0) {
        setMenu(cats)
        setActiveCat(prev => cats.some(c => c.id === prev) ? prev : cats[0].id)
      }
    })
    return () => unsub()
  }, [slug])

  useEffect(() => {
    if (showSearch) searchRef.current?.focus()
  }, [showSearch])

  const showToast = (message: string, emoji: string, color = '#3A7D58') => {
    const id = ++toastId.current
    setToasts(prev => [...prev, { id, message, emoji, color }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  const allItems = () => menu.flatMap(c => c.items)
  const findItem = (itemId: string) => {
    const item = allItems().find(i => i.id === itemId)!
    const cat = menu.find(c => c.items.some(i => i.id === itemId))!
    return { item, cat }
  }

  const myCart: CartItem[] = sessions.find(s => s.guest_name === currentUser)?.cart || []
  const getQty = (id: string) => myCart.filter(i => i.id === id).length
  const myCartCount = myCart.length
  const myCartTotal = myCart.reduce((s, i) => s + i.price, 0)

  const saveCart = async (cart: CartItem[]) => {
    setSaving(true)
    await upsertTableSession(slug, tableNum, currentUser, cart)
    setSaving(false)
  }

  const enterMenu = async () => {
    if (!nameInput.trim()) return
    const user = nameInput.trim()
    setCurrentUser(user)
    await upsertTableSession(slug, tableNum, user, [])
    setScreen('menu')
  }

  const addToCart = async (itemId: string) => {
    const { item, cat } = findItem(itemId)
    const newCart = [...myCart, { id: item.id, name: item.name, price: item.price, emoji: cat.emoji }]
    setSessions(prev => prev.map(s => s.guest_name === currentUser ? {...s, cart: newCart} : s))
    setCartBump(true); setTimeout(() => setCartBump(false), 300)
    await saveCart(newCart)
  }

  const changeQty = async (itemId: string, delta: number) => {
    let newCart = [...myCart]
    if (delta === 1) {
      const { item, cat } = findItem(itemId)
      newCart.push({ id: item.id, name: item.name, price: item.price, emoji: cat.emoji })
      setCartBump(true); setTimeout(() => setCartBump(false), 300)
    } else {
      const idx = newCart.map(i => i.id).lastIndexOf(itemId)
      if (idx !== -1) newCart.splice(idx, 1)
    }
    setSessions(prev => prev.map(s => s.guest_name === currentUser ? {...s, cart: newCart} : s))
    await saveCart(newCart)
  }

  const removeGuest = async (name: string) => {
    await deleteTableSession(slug, tableNum, name)
    setSessions(prev => prev.filter(s => s.guest_name !== name))
    setShowRemoveModal(null)
  }

  const leaveTable = async () => {
    await deleteTableSession(slug, tableNum, currentUser)
    setSessions(prev => prev.filter(s => s.guest_name !== currentUser))
    setCurrentUser(''); setNameInput(''); setShowLeaveModal(false); setScreen('name')
    setSentBatches([]); setCartOpen(false); setShowCheckout(false)
  }

  const callWaiter = async () => {
    setShowWaiterModal(false)
    setWaiterSent(true)
    try {
      await createWaiterCall(slug, tableNum, currentUser || 'Гість')
      showToast(`Офіціант йде до столу №${tableId}!`, '🔔', '#C17F3B')
    } catch (e) {
      console.error('waiter call failed', e)
      showToast('Помилка. Спробуйте ще раз.', '❌', '#C0392B')
      setWaiterSent(false)
    } finally {
      setTimeout(() => setWaiterSent(false), 5000)
    }
  }

  // Send only MY current cart to kitchen; items stay visible as a "sent batch"
  const sendToKitchen = async () => {
    if (!myCart.length || submitting) return
    setSubmitting(true)
    try {
      // Build grouped items for the batch display
      const grouped: Record<string, CartItem & { qty: number }> = {}
      myCart.forEach(item => {
        if (!grouped[item.id]) grouped[item.id] = { ...item, qty: 0 }
        grouped[item.id].qty++
      })
      const groupedItems = Object.values(grouped)
      const batchTotal = myCart.reduce((s, i) => s + i.price, 0)

      // Create order in DB
      const orderItems = myCart.map(item => ({ ...item, guest: currentUser }))
      await createOrder(slug, tableNum, orderItems, batchTotal)

      // Clear cart in DB
      await upsertTableSession(slug, tableNum, currentUser, [])
      setSessions(prev => prev.map(s => s.guest_name === currentUser ? { ...s, cart: [] } : s))

      // Add to local sent batches (stays in popup)
      const batch: SentBatch = {
        id: Date.now().toString(),
        items: groupedItems,
        total: batchTotal,
        sentAt: new Date().toISOString(),
      }
      setSentBatches(prev => [...prev, batch])
      showToast('Замовлення на кухні! 🍳', '✅', '#3A7D58')
    } catch (e) {
      console.error('order failed', e)
      showToast('Помилка відправки. Спробуйте ще раз.', '❌', '#C0392B')
    } finally {
      setSubmitting(false)
    }
  }

  // Total of everything sent so far + current cart
  const totalSent = sentBatches.reduce((s, b) => s + b.total, 0)
  const grandTotal = totalSent + myCartTotal

  const scrollToCategory = (catId: string) => {
    setActiveCat(catId)
    setSearch('')
    setShowSearch(false)
    catRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const searchResults = search.trim()
    ? menu.flatMap(cat => cat.items
        .filter(i => i.available && (
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.desc.toLowerCase().includes(search.toLowerCase())
        ))
        .map(i => ({ ...i, catEmoji: cat.emoji, catName: cat.name, catId: cat.id }))
      )
    : []

  const otherGuests = sessions.filter(s => s.guest_name !== currentUser)

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        body { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { display: none; }
        * { -webkit-tap-highlight-color: transparent; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .slide-up { animation: slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
      `}</style>

      {/* TOASTS */}
      <div className="fixed top-4 left-0 right-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} style={{background: t.color}}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-white font-semibold text-sm max-w-sm w-full">
            <span className="text-xl">{t.emoji}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* NAME SCREEN */}
      {screen === 'name' && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
          <div className="w-full max-w-sm text-center">
            <div className="w-20 h-20 bg-[#C17F3B] rounded-3xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-lg shadow-[#C17F3B]/30">R</div>
            <div className="text-2xl font-bold mb-1" style={{fontFamily:'Playfair Display,serif'}}>RSTGO</div>
            <div className="inline-flex items-center gap-1.5 bg-[#F5E9D8] text-[#9A6328] rounded-full px-4 py-1.5 text-sm font-semibold mb-8">🪑 Стіл №{tableId}</div>
            <div style={{fontFamily:'Playfair Display,serif'}} className="text-3xl font-bold mb-2">Як вас звати?</div>
            <p className="text-[#6B6560] text-sm mb-6">Введіть ім'я щоб почати замовляти — без реєстрації</p>
            <input value={nameInput} onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enterMenu()}
              className="w-full px-5 py-4 border-2 border-[#E8E0D4] rounded-2xl text-center text-xl focus:border-[#C17F3B] focus:outline-none mb-3 font-medium"
              placeholder="Ваше ім'я..." maxLength={24} autoFocus />
            <button onClick={enterMenu} disabled={!nameInput.trim()}
              className="w-full py-4 bg-[#C17F3B] hover:bg-[#9A6328] text-white font-bold rounded-2xl transition-all text-lg shadow-lg shadow-[#C17F3B]/25 disabled:opacity-40">
              Відкрити меню →
            </button>
            {otherGuests.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[#E8E0D4]">
                <p className="text-xs text-[#9A9490] uppercase tracking-wider mb-3">Вже за столом</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {otherGuests.map(s => {
                    const c = gColor(s.guest_name)
                    return (
                      <span key={s.guest_name} style={{background:c.bg,color:c.fg}}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{background:c.fg,color:'white'}}>{ini(s.guest_name)}</span>
                        {s.guest_name}
                        {s.cart.length > 0 && <span className="opacity-60 text-xs">· {s.cart.length} страв</span>}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MENU SCREEN */}
      {screen === 'menu' && (
        <div className="flex flex-col min-h-screen">
          <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E8E0D4]">
            <div className="px-4 pt-3 pb-2 flex items-center gap-3">
              <div style={{background:gColor(currentUser).fg}} className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">{ini(currentUser)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm leading-tight">{currentUser} {saving && <span className="text-[#C17F3B] text-xs">●</span>}</div>
                <div className="text-xs text-[#9A9490]">Стіл №{tableId} · {sessions.length} {sessions.length === 1 ? 'гість' : sessions.length < 5 ? 'гості' : 'гостей'}</div>
              </div>
              <button onClick={() => { setShowSearch(!showSearch); setSearch('') }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all ${showSearch ? 'bg-[#C17F3B] border-[#C17F3B] text-white' : 'bg-[#F5F3EF] border-[#E8E0D4]'}`}>
                🔍
              </button>
              <button onClick={() => setShowWaiterModal(true)} disabled={waiterSent}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all ${waiterSent ? 'bg-[#E6F4ED] border-[#B8DEC9]' : 'bg-[#FDECEA] border-[#F5C6C2]'}`}>
                {waiterSent ? '✅' : '🔔'}
              </button>
            </div>
            {showSearch && (
              <div className="px-4 pb-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9490]">🔍</span>
                  <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 bg-[#F5F3EF] border border-[#E8E0D4] rounded-xl text-sm focus:border-[#C17F3B] focus:outline-none"
                    placeholder="Пошук по меню..." />
                  {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9490]">✕</button>}
                </div>
              </div>
            )}
            {!showSearch && (
              <div className="flex gap-2 px-4 pb-2.5 overflow-x-auto" style={{scrollbarWidth:'none'}}>
                {menu.map(c => (
                  <button key={c.id} onClick={() => scrollToCategory(c.id)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCat === c.id ? 'bg-[#C17F3B] text-white' : 'bg-[#F5F3EF] text-[#6B6560]'}`}>
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {showSearch && search && (
            <div className="flex-1 px-4 py-4 pb-32">
              {searchResults.length === 0 ? (
                <div className="text-center py-16 text-[#9A9490]">
                  <div className="text-5xl mb-3">🔍</div>
                  <p className="font-medium">Нічого не знайдено</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-[#9A9490] mb-3">Знайдено {searchResults.length} страв</p>
                  <div className="space-y-2">
                    {searchResults.map(item => {
                      const qty = getQty(item.id)
                      return (
                        <div key={item.id} className={`bg-white rounded-2xl border flex items-center gap-3 p-3 ${qty > 0 ? 'border-[#C17F3B]' : 'border-[#E8E0D4]'}`}>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-[#F5F3EF] flex items-center justify-center text-2xl shrink-0">{item.catEmoji}</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-[#9A9490] mb-0.5">{item.catEmoji} {item.catName}</div>
                            <div className="font-semibold text-sm">{item.name}</div>
                            <div className="text-xs text-[#9A9490] truncate">{item.desc}</div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="font-bold text-[#C17F3B] mb-1.5">{item.price} ₴</div>
                            {qty === 0 ? (
                              <button onClick={() => addToCart(item.id)} className="w-8 h-8 rounded-full bg-[#C17F3B] text-white flex items-center justify-center font-bold">+</button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 rounded-full bg-[#F5F3EF] border border-[#E8E0D4] flex items-center justify-center font-bold">−</button>
                                <span className="w-4 text-center text-sm font-bold">{qty}</span>
                                <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 rounded-full bg-[#C17F3B] text-white flex items-center justify-center font-bold">+</button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {(!showSearch || !search) && (
            <div className="flex-1 px-4 py-4 pb-32 space-y-8">
              {menu.map(cat => (
                <div key={cat.id} ref={el => { catRefs.current[cat.id] = el }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{cat.emoji}</span>
                    <h2 style={{fontFamily:'Playfair Display,serif'}} className="text-xl font-bold">{cat.name}</h2>
                    <span className="text-xs text-[#9A9490] bg-[#F5F3EF] px-2 py-0.5 rounded-full">{cat.items.filter(i=>i.available).length}</span>
                  </div>
                  <div className="space-y-2">
                    {cat.items.filter(i => i.available).map(item => {
                      const qty = getQty(item.id)
                      const isExpanded = expandedItem === item.id
                      return (
                        <div key={item.id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${qty > 0 ? 'border-[#C17F3B] shadow-sm' : 'border-[#E8E0D4]'}`}>
                          <div className="flex gap-3 p-3">
                            <button onClick={() => setExpandedItem(isExpanded ? null : item.id)} className="shrink-0">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                              ) : (
                                <div className="w-20 h-20 rounded-xl bg-[#F5F3EF] flex items-center justify-center text-4xl">{cat.emoji}</div>
                              )}
                            </button>
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="font-semibold text-sm leading-tight mb-1">{item.name}</div>
                                <div className={`text-xs text-[#9A9490] leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>{item.desc}</div>
                                {item.desc && item.desc.length > 60 && (
                                  <button onClick={() => setExpandedItem(isExpanded ? null : item.id)} className="text-xs text-[#C17F3B] font-medium mt-0.5">
                                    {isExpanded ? 'Згорнути ▲' : 'Детальніше ▼'}
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-[#C17F3B]">{item.price} ₴</span>
                                {qty === 0 ? (
                                  <button onClick={() => addToCart(item.id)} className="flex items-center gap-1 bg-[#C17F3B] text-white px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all">
                                    + Додати
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-2 bg-[#F5F3EF] rounded-xl p-1">
                                    <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-white border border-[#E8E0D4] flex items-center justify-center font-bold text-sm">−</button>
                                    <span className="w-5 text-center font-bold text-sm">{qty}</span>
                                    <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-[#C17F3B] text-white flex items-center justify-center font-bold text-sm">+</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div className="h-4" />
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-2 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5]/95 to-transparent">
            <button onClick={() => setCartOpen(true)}
              className={`w-full h-14 rounded-2xl flex items-center justify-between px-5 transition-all duration-200 ${(myCartCount > 0 || sentBatches.length > 0) ? `bg-[#1C1A18] text-white shadow-xl ${cartBump ? 'scale-105' : ''}` : 'bg-[#E8E0D4] text-[#9A9490]'}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">🛒</span>
                <span className="font-semibold">
                  {myCartCount > 0 ? `${myCartCount} ${myCartCount === 1 ? 'страва' : myCartCount < 5 ? 'страви' : 'страв'}` : sentBatches.length > 0 ? 'Мої замовлення' : 'Кошик порожній'}
                </span>
              </div>
              {(myCartCount > 0 || sentBatches.length > 0) && (
                <div className="flex items-center gap-2">
                  {myCartCount > 0 && <span className="font-bold text-[#C17F3B]">{myCartTotal} ₴</span>}
                  {sentBatches.length > 0 && <span className="bg-[#3A7D58] text-white text-xs font-bold px-2 py-0.5 rounded-full">{sentBatches.length} ✓</span>}
                  {myCartCount > 0 && <span className="bg-[#C17F3B] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{myCartCount}</span>}
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {/* CART POPUP DRAWER */}
      {cartOpen && (
        <div className="fixed inset-0 z-[150]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          {/* Drawer */}
          <div className="slide-up absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col">
            {/* Handle */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#E8E0D4]">
              <div>
                <div className="w-10 h-1 bg-[#E8E0D4] rounded-full mx-auto mb-3" />
                <span style={{fontFamily:'Playfair Display,serif'}} className="text-lg font-bold">Мої замовлення</span>
              </div>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-full bg-[#F5F3EF] flex items-center justify-center text-[#6B6560]">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

              {/* CURRENT CART — items not yet sent */}
              {myCartCount > 0 && (() => {
                const grouped: Record<string, CartItem & {qty:number}> = {}
                myCart.forEach(item => { if (!grouped[item.id]) grouped[item.id] = {...item, qty:0}; grouped[item.id].qty++ })
                return (
                  <div className="bg-[#FFFDF9] border-2 border-[#C17F3B] rounded-2xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-[#FBF0E0] flex items-center gap-2">
                      <span className="text-sm">🛒</span>
                      <span className="font-semibold text-sm text-[#9A6328]">Ще не відправлено</span>
                      <span className="ml-auto font-bold text-[#C17F3B]">{myCartTotal} ₴</span>
                    </div>
                    <div className="px-4 py-2">
                      {Object.values(grouped).map(item => (
                        <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-[#F5F3EF] last:border-0">
                          <span className="text-xl shrink-0">{item.emoji}</span>
                          <div className="flex-1"><div className="font-medium text-sm">{item.name}</div><div className="text-xs text-[#9A9490]">{item.price} ₴</div></div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-[#F5F3EF] border border-[#E8E0D4] flex items-center justify-center font-bold text-sm">−</button>
                            <span className="w-5 text-center font-bold text-sm">{item.qty}</span>
                            <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-[#C17F3B] text-white flex items-center justify-center font-bold text-sm">+</button>
                          </div>
                          <span className="text-sm font-semibold text-[#C17F3B] ml-1">{item.price * item.qty} ₴</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* SENT BATCHES — already on kitchen, stays visible */}
              {sentBatches.map((batch, bIdx) => (
                <div key={batch.id} className="bg-[#F6FBF8] border border-[#B8DEC9] rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-[#E6F4ED] flex items-center gap-2">
                    <span className="text-sm">✅</span>
                    <span className="font-semibold text-sm text-[#3A7D58]">Відправлено на кухню</span>
                    <span className="text-xs text-[#3A7D58]/60 ml-1">{new Date(batch.sentAt).toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'})}</span>
                    <span className="ml-auto font-bold text-[#3A7D58]">{batch.total} ₴</span>
                  </div>
                  <div className="px-4 py-2">
                    {batch.items.map(item => (
                      <div key={`${batch.id}-${item.id}`} className="flex items-center gap-3 py-2 border-b border-[#E6F4ED] last:border-0">
                        <span className="text-lg shrink-0">{item.emoji}</span>
                        <div className="flex-1"><div className="text-sm text-[#3A7D58]">{item.name}{item.qty > 1 ? ` ×${item.qty}` : ''}</div></div>
                        <span className="text-sm font-medium text-[#3A7D58]">{item.price * item.qty} ₴</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {myCartCount === 0 && sentBatches.length === 0 && (
                <div className="text-center py-12 text-[#9A9490]">
                  <div className="text-5xl mb-3">🛒</div>
                  <p className="font-medium">Тут з'являться ваші страви</p>
                  <button onClick={() => setCartOpen(false)} className="mt-4 px-5 py-2.5 bg-[#C17F3B] text-white rounded-xl text-sm font-semibold">← Меню</button>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-4 pb-6 pt-3 border-t border-[#E8E0D4] space-y-2.5">
              {/* Grand total */}
              {(myCartCount > 0 || sentBatches.length > 0) && (
                <div className="flex justify-between items-center px-1 mb-1">
                  <span className="text-sm text-[#6B6560]">
                    {sentBatches.length > 0 ? 'Всього замовлено' : 'До відправки'}
                  </span>
                  <span className="font-bold text-[#1C1A18]">{grandTotal} ₴</span>
                </div>
              )}
              {/* Send to kitchen */}
              {myCartCount > 0 && (
                <button onClick={sendToKitchen} disabled={submitting}
                  className="w-full h-13 py-3.5 bg-[#3A7D58] hover:bg-[#2d6444] text-white font-bold rounded-2xl text-base shadow-lg disabled:opacity-60">
                  {submitting ? 'Відправляємо...' : `🍳 Відправити на кухню · ${myCartTotal} ₴`}
                </button>
              )}
              {/* Checkout — only show if something has been sent */}
              {sentBatches.length > 0 && (
                <button onClick={() => { setCartOpen(false); setShowCheckout(true) }}
                  className="w-full py-3.5 border-2 border-[#1C1A18] text-[#1C1A18] font-bold rounded-2xl text-sm">
                  💳 Оплатити та вийти · {grandTotal} ₴
                </button>
              )}
              {/* Leave if nothing ordered */}
              {myCartCount === 0 && sentBatches.length === 0 && (
                <button onClick={() => { setCartOpen(false); setShowLeaveModal(true) }}
                  className="w-full py-3 border border-[#E8E0D4] text-[#9A9490] font-semibold rounded-2xl text-sm">
                  🚪 Покинути стіл
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 z-[160]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCheckout(false)} />
          <div className="slide-up absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#E8E0D4]">
              <div>
                <div className="w-10 h-1 bg-[#E8E0D4] rounded-full mx-auto mb-3" />
                <span style={{fontFamily:'Playfair Display,serif'}} className="text-xl font-bold">Ваш рахунок</span>
              </div>
              <button onClick={() => setShowCheckout(false)} className="w-8 h-8 rounded-full bg-[#F5F3EF] flex items-center justify-center text-[#6B6560]">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              <div className="bg-[#E6F4ED] border border-[#B8DEC9] rounded-2xl p-4 text-center mb-2">
                <div className="text-3xl mb-1">🎉</div>
                <div style={{fontFamily:'Playfair Display,serif'}} className="text-lg font-bold text-[#2E7D54]">Дякуємо! Все вже на кухні</div>
                <p className="text-[#3A7D58] text-xs mt-1">Стіл №{tableId}</p>
              </div>
              {sentBatches.map((batch, i) => (
                <div key={batch.id} className="bg-white border border-[#E8E0D4] rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-[#FAF8F5] border-b border-[#F0EAE2] flex items-center gap-2">
                    <span className="text-xs text-[#9A9490]">Замовлення {i + 1} · {new Date(batch.sentAt).toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'})}</span>
                    <span className="ml-auto font-semibold text-sm text-[#C17F3B]">{batch.total} ₴</span>
                  </div>
                  <div className="px-4 py-2">
                    {batch.items.map(item => (
                      <div key={`co-${batch.id}-${item.id}`} className="flex justify-between text-sm py-1.5 border-b border-[#F5F3EF] last:border-0">
                        <span className="text-[#6B6560]">{item.emoji} {item.name}{item.qty > 1 ? ` ×${item.qty}` : ''}</span>
                        <span className="font-medium">{item.price * item.qty} ₴</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {myCartCount > 0 && (
                <div className="bg-[#FBF0E0] border border-[#E8C88A] rounded-2xl p-3 text-sm text-[#9A6328]">
                  ⚠️ У вас є {myCartCount} страв у кошику, які ще не відправлено на кухню.
                </div>
              )}
            </div>
            <div className="px-4 pb-8 pt-3 border-t border-[#E8E0D4]">
              <div className="bg-[#1C1A18] rounded-2xl p-4 flex justify-between items-center mb-3">
                <span className="text-white/70 text-sm">Разом до сплати</span>
                <span style={{fontFamily:'Playfair Display,serif'}} className="text-2xl font-bold text-[#C17F3B]">{totalSent} ₴</span>
              </div>
              <button onClick={() => setShowWaiterModal(true)} disabled={waiterSent}
                className={`w-full py-3.5 font-bold rounded-2xl border-2 text-base mb-2 ${
                  waiterSent ? 'bg-[#E6F4ED] text-[#3A7D58] border-[#B8DEC9]' : 'bg-[#FDECEA] text-[#C0392B] border-[#F5C6C2]'
                }`}>
                {waiterSent ? '✅ Офіціанта викликано' : '🔔 Викликати офіціанта для оплати'}
              </button>
              <button onClick={() => { setShowCheckout(false); setShowLeaveModal(true) }}
                className="w-full py-3 text-sm text-[#9A9490] border border-[#E8E0D4] rounded-2xl">
                🚪 Покинути стіл
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showWaiterModal && (
        <div className="fixed inset-0 bg-black/50 z-[170] flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center">
            <div className="w-10 h-1 bg-[#E8E0D4] rounded-full mx-auto mb-5" />
            <div className="text-5xl mb-3">🔔</div>
            <div style={{fontFamily:'Playfair Display,serif'}} className="text-xl font-bold mb-2">Викликати офіціанта?</div>
            <p className="text-[#6B6560] text-sm mb-6">Офіціант підійде до столу №{tableId} протягом хвилини.</p>
            <button onClick={callWaiter} className="w-full py-3.5 bg-[#C17F3B] text-white font-bold rounded-2xl mb-2">Так, викликати 🔔</button>
            <button onClick={() => setShowWaiterModal(false)} className="w-full py-3.5 border border-[#E8E0D4] rounded-2xl text-sm">Скасувати</button>
          </div>
        </div>
      )}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 z-[170] flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center">
            <div className="w-10 h-1 bg-[#E8E0D4] rounded-full mx-auto mb-5" />
            <div className="text-5xl mb-3">🚪</div>
            <div style={{fontFamily:'Playfair Display,serif'}} className="text-xl font-bold mb-2">Покинути стіл?</div>
            <p className="text-[#6B6560] text-sm mb-6">Ваш кошик буде очищено. Вже відправлені страви залишаться.</p>
            <button onClick={leaveTable} className="w-full py-3.5 bg-[#C0392B] text-white font-bold rounded-2xl mb-2">Так, покинути</button>
            <button onClick={() => setShowLeaveModal(false)} className="w-full py-3.5 border border-[#E8E0D4] rounded-2xl text-sm">Залишитись</button>
          </div>
        </div>
      )}
    </div>
  )
}
