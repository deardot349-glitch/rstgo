'use client'
import { useState, useRef, useEffect } from 'react'
import { uploadMenuItemImage, deleteMenuItemImage } from '@/lib/supabaseStorage'
import { saveMenu, subscribeMenu } from '@/lib/firestore'

type MenuItem = { id: string; name: string; desc: string; price: number; available: boolean; imageUrl?: string }
type Category = { id: string; name: string; emoji: string; items: MenuItem[] }

const DEFAULT_MENU: Category[] = [
  {
    id: 'c1', name: 'Салати', emoji: '🥗',
    items: [
      { id: 'i1', name: 'Грецький салат', desc: 'Томати, огірок, маслини, фета', price: 149, available: true },
      { id: 'i2', name: 'Цезар з куркою', desc: 'Листя айсберг, гриль, пармезан', price: 179, available: true },
    ]
  },
  {
    id: 'c2', name: 'Основні', emoji: '🍽',
    items: [
      { id: 'i3', name: 'Стейк свинина', desc: '350г, картопля фрі, соус', price: 289, available: true },
      { id: 'i4', name: 'Куряче філе', desc: 'Гриль, рис, сезонні овочі', price: 239, available: false },
    ]
  },
  { id: 'c3', name: 'Напої', emoji: '🥤', items: [
    { id: 'i5', name: 'Лимонад', desc: "М'ята або ягідний", price: 99, available: true },
  ]},
]

const EMOJIS = ['🥗','🍲','🍽','🍕','🥤','🍰','🥩','🍣','🍜','🧆','🥘','🫕']

// Must match the slug in the table URL e.g. /vatra-restaurant/table/1
const RESTAURANT_ID = 'vatra-restaurant'

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_MENU)
  const [activeCategory, setActiveCategory] = useState(DEFAULT_MENU[0].id)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showAddCat, setShowAddCat] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', desc: '', price: '', imageUrl: '' })
  const [newCat, setNewCat] = useState({ name: '', emoji: '🍽' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingNew, setUploadingNew] = useState(false)
  const [uploadingEdit, setUploadingEdit] = useState(false)
  const [loading, setLoading] = useState(true)

  const newImageInputRef = useRef<HTMLInputElement>(null)
  const editImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsubscribe = subscribeMenu(RESTAURANT_ID, (firestoreMenu) => {
      if (firestoreMenu && firestoreMenu.length > 0) {
        setCategories(firestoreMenu as Category[])
        setActiveCategory(prev =>
          firestoreMenu.some(c => c.id === prev) ? prev : firestoreMenu[0].id
        )
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const activeCat = categories.find(c => c.id === activeCategory) || categories[0]

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveMenu(RESTAURANT_ID, categories as any)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Save failed', err)
      alert('Помилка збереження. Перевірте підключення.')
    } finally {
      setSaving(false)
    }
  }

  const saveItem = () => {
    if (!editingItem) return
    setCategories(cats => cats.map(c => ({
      ...c,
      items: c.items.map(i => i.id === editingItem.id ? editingItem : i)
    })))
    setEditingItem(null)
  }

  const addItem = () => {
    if (!newItem.name || !newItem.price) return
    const item: MenuItem = {
      id: 'i' + Date.now(), name: newItem.name,
      desc: newItem.desc, price: Number(newItem.price), available: true,
      imageUrl: newItem.imageUrl || undefined,
    }
    setCategories(cats => cats.map(c =>
      c.id === activeCategory ? {...c, items: [...c.items, item]} : c
    ))
    setNewItem({ name: '', desc: '', price: '', imageUrl: '' })
    setShowAddItem(false)
  }

  const deleteItem = (catId: string, itemId: string) => {
    const item = categories.find(c => c.id === catId)?.items.find(i => i.id === itemId)
    if (item?.imageUrl) deleteMenuItemImage(item.imageUrl)
    setCategories(cats => cats.map(c =>
      c.id === catId ? {...c, items: c.items.filter(i => i.id !== itemId)} : c
    ))
  }

  const toggleAvailable = (catId: string, itemId: string) => {
    setCategories(cats => cats.map(c =>
      c.id === catId ? {...c, items: c.items.map(i =>
        i.id === itemId ? {...i, available: !i.available} : i
      )} : c
    ))
  }

  const addCategory = () => {
    if (!newCat.name) return
    const cat: Category = { id: 'c' + Date.now(), name: newCat.name, emoji: newCat.emoji, items: [] }
    setCategories(cats => [...cats, cat])
    setActiveCategory(cat.id)
    setNewCat({ name: '', emoji: '🍽' })
    setShowAddCat(false)
  }

  const handleNewImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingNew(true)
    try {
      const url = await uploadMenuItemImage(RESTAURANT_ID, file)
      setNewItem(prev => ({ ...prev, imageUrl: url }))
    } catch (err) {
      console.error('Upload failed', err)
      alert('Не вдалося завантажити фото.')
    } finally {
      setUploadingNew(false)
    }
  }

  const handleEditImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingItem) return
    setUploadingEdit(true)
    try {
      if (editingItem.imageUrl) deleteMenuItemImage(editingItem.imageUrl)
      const url = await uploadMenuItemImage(RESTAURANT_ID, file)
      setEditingItem({ ...editingItem, imageUrl: url })
    } catch (err) {
      console.error('Upload failed', err)
      alert('Не вдалося завантажити фото.')
    } finally {
      setUploadingEdit(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#9A9490] text-sm">Завантаження меню...</div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Меню</h1>
          <p className="text-[#6B6560] text-sm">{categories.reduce((s,c) => s + c.items.length, 0)} позицій у {categories.length} категоріях</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 ${saved ? 'bg-[#3A7D58] text-white' : 'bg-[#C17F3B] hover:bg-[#9A6328] text-white'}`}>
          {saving ? 'Збереження...' : saved ? '✓ Збережено' : 'Зберегти'}
        </button>
      </div>

      <div className="flex gap-6">
        <div className="w-52 shrink-0">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-3 space-y-1">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  activeCategory === cat.id ? 'bg-[#C17F3B] text-white' : 'text-[#1C1A18] hover:bg-[#FAF8F5]'
                }`}>
                <span>{cat.emoji}</span>
                <span className="flex-1 truncate">{cat.name}</span>
                <span className={`text-xs ${activeCategory === cat.id ? 'text-white/70' : 'text-[#9A9490]'}`}>{cat.items.length}</span>
              </button>
            ))}
            <button onClick={() => setShowAddCat(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#C17F3B] hover:bg-[#FDF6EE] transition-colors mt-2 border border-dashed border-[#C17F3B]/40">
              + Категорія
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">{activeCat.emoji} {activeCat.name}</h2>
            <button onClick={() => setShowAddItem(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#C17F3B] text-white rounded-xl text-sm font-semibold hover:bg-[#9A6328] transition-colors">
              + Додати страву
            </button>
          </div>

          {activeCat.items.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-[#E8E0D4] rounded-2xl p-12 text-center">
              <div className="text-4xl mb-3">🍽</div>
              <p className="text-[#6B6560] mb-4">Ще немає страв у цій категорії</p>
              <button onClick={() => setShowAddItem(true)}
                className="px-6 py-2.5 bg-[#C17F3B] text-white rounded-xl text-sm font-semibold">Додати першу страву</button>
            </div>
          ) : (
            <div className="space-y-2">
              {activeCat.items.map(item => (
                <div key={item.id}
                  className={`bg-white border rounded-2xl p-4 flex items-center gap-4 ${item.available ? 'border-[#E8E0D4]' : 'border-[#E8E0D4] opacity-60'}`}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-[#FAF8F5] rounded-xl flex items-center justify-center text-2xl shrink-0">{activeCat.emoji}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm">{item.name}</span>
                      {!item.available && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Недоступно</span>}
                    </div>
                    <div className="text-xs text-[#9A9490] truncate">{item.desc}</div>
                  </div>
                  <div className="font-bold text-[#C17F3B] shrink-0">{item.price} ₴</div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleAvailable(activeCat.id, item.id)}
                      className={`w-8 h-8 rounded-lg text-sm transition-colors ${item.available ? 'bg-[#E6F4ED] text-[#3A7D58]' : 'bg-gray-100 text-gray-400'}`}>
                      {item.available ? '✓' : '✗'}
                    </button>
                    <button onClick={() => setEditingItem(item)}
                      className="w-8 h-8 rounded-lg bg-[#F5E9D8] text-[#C17F3B] text-sm hover:bg-[#EDD5B3] transition-colors">✏</button>
                    <button onClick={() => deleteItem(activeCat.id, item.id)}
                      className="w-8 h-8 rounded-lg bg-[#FDECEA] text-red-500 text-sm hover:bg-[#FACBC8] transition-colors">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ADD ITEM MODAL */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-display text-xl font-bold mb-5">Нова страва</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Фото страви</label>
                <input ref={newImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleNewImageSelect} />
                {newItem.imageUrl ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-[#E8E0D4]">
                    <img src={newItem.imageUrl} alt="Прев'ю" className="w-full h-full object-cover" />
                    <button onClick={() => setNewItem(p => ({...p, imageUrl: ''}))}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white text-sm flex items-center justify-center">✕</button>
                  </div>
                ) : (
                  <button onClick={() => newImageInputRef.current?.click()} disabled={uploadingNew}
                    className="w-full h-36 border-2 border-dashed border-[#E8E0D4] rounded-xl flex flex-col items-center justify-center gap-2 text-[#9A9490] hover:border-[#C17F3B] hover:text-[#C17F3B] transition-colors disabled:opacity-60">
                    {uploadingNew ? <span className="text-sm">Завантаження...</span> : <><span className="text-2xl">📷</span><span className="text-sm font-medium">Завантажити фото</span></>}
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Назва *</label>
                <input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})}
                  className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none text-sm"
                  placeholder="Борщ з пампушками" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Опис</label>
                <input value={newItem.desc} onChange={e => setNewItem({...newItem, desc: e.target.value})}
                  className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none text-sm"
                  placeholder="Короткий опис інгредієнтів" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Ціна (₴) *</label>
                <input type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})}
                  className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none text-sm"
                  placeholder="149" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowAddItem(false); setNewItem({ name: '', desc: '', price: '', imageUrl: '' }) }}
                  className="flex-1 py-3 border border-[#E8E0D4] rounded-xl text-sm font-medium">Скасувати</button>
                <button onClick={addItem}
                  className="flex-1 py-3 bg-[#C17F3B] text-white rounded-xl text-sm font-semibold">Додати</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-display text-xl font-bold mb-5">Редагувати страву</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Фото страви</label>
                <input ref={editImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleEditImageSelect} />
                {editingItem.imageUrl ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-[#E8E0D4]">
                    <img src={editingItem.imageUrl} alt="Прев'ю" className="w-full h-full object-cover" />
                    <button onClick={() => { deleteMenuItemImage(editingItem.imageUrl!); setEditingItem({...editingItem, imageUrl: undefined}) }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white text-sm flex items-center justify-center">✕</button>
                    <button onClick={() => editImageInputRef.current?.click()} disabled={uploadingEdit}
                      className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-black/50 text-white text-xs font-medium">
                      {uploadingEdit ? '...' : 'Замінити'}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => editImageInputRef.current?.click()} disabled={uploadingEdit}
                    className="w-full h-36 border-2 border-dashed border-[#E8E0D4] rounded-xl flex flex-col items-center justify-center gap-2 text-[#9A9490] hover:border-[#C17F3B] hover:text-[#C17F3B] transition-colors disabled:opacity-60">
                    {uploadingEdit ? <span className="text-sm">Завантаження...</span> : <><span className="text-2xl">📷</span><span className="text-sm font-medium">Завантажити фото</span></>}
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Назва</label>
                <input value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                  className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Опис</label>
                <input value={editingItem.desc} onChange={e => setEditingItem({...editingItem, desc: e.target.value})}
                  className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Ціна (₴)</label>
                <input type="number" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})}
                  className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingItem(null)}
                  className="flex-1 py-3 border border-[#E8E0D4] rounded-xl text-sm font-medium">Скасувати</button>
                <button onClick={saveItem}
                  className="flex-1 py-3 bg-[#C17F3B] text-white rounded-xl text-sm font-semibold">Зберегти</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showAddCat && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-display text-xl font-bold mb-5">Нова категорія</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Назва *</label>
                <input value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})}
                  className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none text-sm"
                  placeholder="Десерти" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setNewCat({...newCat, emoji: e})}
                      className={`w-10 h-10 rounded-xl text-xl transition-all ${newCat.emoji === e ? 'bg-[#C17F3B] scale-110' : 'bg-[#FAF8F5] hover:bg-[#F0E8DC]'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddCat(false)}
                  className="flex-1 py-3 border border-[#E8E0D4] rounded-xl text-sm font-medium">Скасувати</button>
                <button onClick={addCategory}
                  className="flex-1 py-3 bg-[#C17F3B] text-white rounded-xl text-sm font-semibold">Додати</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
