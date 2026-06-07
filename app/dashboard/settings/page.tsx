'use client'
import { useState } from 'react'

export default function SettingsPage() {
  const [form, setForm] = useState({
    restaurantName: 'Ресторан «Ватра»',
    slug: 'vatra-restaurant',
    address: 'вул. Хрещатик, 1, Київ',
    phone: '+38 (050) 000-00-00',
    currency: 'UAH',
    staffPin: '1234',
    primaryColor: '#C17F3B',
    plan: 'pro',
  })
  const [showPin, setShowPin] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pinError, setPinError] = useState('')

  const save = () => {
    if (form.staffPin.length < 4) { setPinError('PIN має бути мінімум 4 цифри'); return }
    setPinError('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Налаштування</h1>
          <p className="text-[#6B6560] text-sm">Інформація про заклад та параметри системи</p>
        </div>
        <button onClick={save}
          className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${saved ? 'bg-[#3A7D58] text-white' : 'bg-[#C17F3B] hover:bg-[#9A6328] text-white'}`}>
          {saved ? '✓ Збережено' : 'Зберегти'}
        </button>
      </div>

      <div className="space-y-6">

        {/* Restaurant info */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-5">🏠 Інформація про заклад</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Назва закладу</label>
              <input value={form.restaurantName} onChange={e => setForm({...form, restaurantName: e.target.value})}
                className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">URL-адреса</label>
              <div className="flex items-center border border-[#E8E0D4] rounded-xl overflow-hidden focus-within:border-[#C17F3B] bg-white">
                <span className="px-3 text-sm text-[#9A9490] bg-[#FAF8F5] py-3 border-r border-[#E8E0D4] whitespace-nowrap">rstgo.app/</span>
                <input value={form.slug} onChange={e => setForm({...form, slug: e.target.value.toLowerCase().replace(/[^\w-]/g,'')})}
                  className="flex-1 px-3 py-3 focus:outline-none text-sm min-w-0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Телефон</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Валюта</label>
                <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}
                  className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none text-sm bg-white">
                  <option value="UAH">₴ Гривня</option>
                  <option value="USD">$ Долар</option>
                  <option value="EUR">€ Євро</option>
                  <option value="PLN">zł Злотий</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Адреса</label>
              <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none text-sm" />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-5">🔐 Безпека персоналу</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">PIN-код персоналу</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  value={form.staffPin}
                  onChange={e => setForm({...form, staffPin: e.target.value.replace(/\D/g,'')})}
                  className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none text-sm font-mono tracking-[0.4em] text-center pr-12" />
                <button onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9490] hover:text-[#1C1A18] text-sm">
                  {showPin ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            {pinError && <p className="text-red-500 text-xs mt-1">{pinError}</p>}
            <p className="text-xs text-[#9A9490] mt-1.5">
              Персонал вводить цей код для доступу до панелі замовлень.
              Ніколи не давайте його клієнтам.
            </p>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-1">🎨 Бренд</h2>
          <p className="text-sm text-[#9A9490] mb-5">Основний колір відображається в меню гостей</p>
          <div>
            <label className="block text-sm font-medium mb-2">Основний колір</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.primaryColor}
                onChange={e => setForm({...form, primaryColor: e.target.value})}
                className="w-12 h-12 rounded-xl border border-[#E8E0D4] cursor-pointer p-1" />
              <input value={form.primaryColor} onChange={e => setForm({...form, primaryColor: e.target.value})}
                className="w-32 px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none text-sm font-mono" />
              <div className="flex gap-2">
                {['#C17F3B','#3A7D58','#1A6FA8','#8B5CF6','#EC4899','#EF4444'].map(c => (
                  <button key={c} onClick={() => setForm({...form, primaryColor: c})}
                    className="w-8 h-8 rounded-lg border-2 transition-all hover:scale-110"
                    style={{ background: c, borderColor: form.primaryColor === c ? '#1C1A18' : 'transparent' }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg mb-1">💳 Поточний план</h2>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-display font-bold">Pro</span>
                <span className="bg-[#C17F3B] text-white text-xs px-2 py-0.5 rounded-full font-semibold">Активний</span>
              </div>
              <p className="text-sm text-[#6B6560] mt-1">999 ₴/місяць · Наступне списання 01.07.2025</p>
            </div>
            <button className="px-5 py-2.5 border border-[#E8E0D4] rounded-xl text-sm font-medium hover:border-[#C17F3B] transition-colors">
              Змінити план
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-[#FDF2F2] border border-red-200 rounded-2xl p-6">
          <h2 className="font-semibold text-lg text-red-700 mb-1">⚠️ Небезпечна зона</h2>
          <p className="text-sm text-red-600 mb-4">Ці дії незворотні. Будьте обережні.</p>
          <button className="px-5 py-2.5 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
            Видалити акаунт
          </button>
        </div>
      </div>
    </div>
  )
}
