'use client'
import { useState } from 'react'
import Link from 'next/link'

const PLANS = [
  { id: 'starter', name: 'Starter', price: 'Безкоштовно', tables: 'До 5 столів', items: 'До 30 страв', badge: '' },
  { id: 'pro', name: 'Pro', price: '999 ₴/міс', tables: 'До 20 столів', items: 'Необмежено', badge: 'Популярний' },
  { id: 'enterprise', name: 'Enterprise', price: '2999 ₴/міс', tables: 'Необмежено', items: 'Необмежено', badge: '' },
]

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [plan, setPlan] = useState('starter')
  const [form, setForm] = useState({
    email: '', password: '', restaurantName: '', slug: '',
    phone: '', address: '', currency: 'UAH', tableCount: '5', staffPin: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    // After creating the account, redirect to the NFC onboarding page
    // passing the restaurant details as query params
    setTimeout(() => {
      const params = new URLSearchParams({
        name: form.restaurantName,
        slug: form.slug || 'your-restaurant',
        tables: form.tableCount,
      })
      window.location.href = `/onboarding?${params.toString()}`
    }, 1500)
  }

  const stepLabel = ['Акаунт', 'Ресторан', 'План']

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between border-b border-[#E8E0D4] bg-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#C17F3B] rounded-lg flex items-center justify-center text-white font-bold text-sm">R</div>
          <span className="font-display font-bold text-lg">RSTGO</span>
        </Link>
        <div className="flex items-center gap-4">
          {[1,2,3].map(s => (
            <div key={s} className={`flex items-center gap-2 text-sm ${step >= s ? 'text-[#C17F3B] font-semibold' : 'text-[#9A9490]'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? 'bg-[#C17F3B] text-white' : 'bg-[#E8E0D4] text-[#9A9490]'}`}>{step > s ? '✓' : s}</div>
              <span className="hidden sm:inline">{stepLabel[s-1]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-xl">

          {step === 1 && (
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">Створіть акаунт</h1>
              <p className="text-[#6B6560] mb-8">Безкоштовно. Без кредитної картки.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none bg-white text-sm"
                    placeholder="your@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Пароль</label>
                  <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                    className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none bg-white text-sm"
                    placeholder="Мінімум 8 символів" />
                </div>
                <button onClick={() => { if(form.email && form.password.length >= 6) setStep(2) }}
                  className="w-full bg-[#C17F3B] hover:bg-[#9A6328] text-white font-semibold py-3.5 rounded-xl transition-colors">
                  Продовжити →
                </button>
                <p className="text-center text-sm text-[#6B6560]">
                  Вже є акаунт?{' '}
                  <Link href="/login" className="text-[#C17F3B] font-medium">Увійти</Link>
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">Налаштуйте заклад</h1>
              <p className="text-[#6B6560] mb-8">Все можна змінити пізніше в дашборді.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Назва закладу *</label>
                  <input value={form.restaurantName} onChange={e => {
                    const n = e.target.value
                    const s = n.toLowerCase().replace(/[^\w\s-]/g,'').replace(/[\s_-]+/g,'-').replace(/^-+|-+$/g,'')
                    setForm({...form, restaurantName: n, slug: s})
                  }}
                    className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none bg-white text-sm"
                    placeholder="Ресторан «Ватра»" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">URL-адреса *</label>
                  <div className="flex items-center border border-[#E8E0D4] rounded-xl bg-white overflow-hidden focus-within:border-[#C17F3B]">
                    <span className="px-3 text-sm text-[#9A9490] bg-[#FAF8F5] py-3 border-r border-[#E8E0D4] whitespace-nowrap">rstgo.app/</span>
                    <input value={form.slug} onChange={e => setForm({...form, slug: e.target.value.toLowerCase().replace(/[^\w-]/g,'')})}
                      className="flex-1 px-3 py-3 focus:outline-none text-sm min-w-0" placeholder="vatra" />
                  </div>
                  <p className="text-xs text-[#9A9490] mt-1">Гості відкриватимуть меню за цим посиланням</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Кількість столів</label>
                    <input type="number" min="1" max="200" value={form.tableCount}
                      onChange={e => setForm({...form, tableCount: e.target.value})}
                      className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none bg-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Валюта</label>
                    <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}
                      className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none bg-white text-sm">
                      <option value="UAH">₴ Гривня</option>
                      <option value="USD">$ Долар</option>
                      <option value="EUR">€ Євро</option>
                      <option value="PLN">zł Злотий</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">PIN-код персоналу *</label>
                  <input type="text" maxLength={6} value={form.staffPin}
                    onChange={e => setForm({...form, staffPin: e.target.value.replace(/\D/g,'')})}
                    className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none bg-white text-sm font-mono tracking-[0.4em] text-center"
                    placeholder="4–6 цифр" />
                  <p className="text-xs text-[#9A9490] mt-1">Персонал вводить PIN для доступу до панелі замовлень</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Адреса (необов&apos;язково)</label>
                  <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                    className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none bg-white text-sm"
                    placeholder="вул. Хрещатик, 1, Київ" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(1)}
                    className="px-6 py-3.5 border border-[#E8E0D4] bg-white rounded-xl text-sm font-medium hover:border-[#C17F3B] transition-colors">
                    ← Назад
                  </button>
                  <button onClick={() => { if(form.restaurantName && form.slug && form.staffPin.length >= 4) setStep(3) }}
                    className="flex-1 bg-[#C17F3B] hover:bg-[#9A6328] text-white font-semibold py-3.5 rounded-xl transition-colors">
                    Продовжити →
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">Оберіть план</h1>
              <p className="text-[#6B6560] mb-8">Завжди можна змінити. Починайте безкоштовно.</p>
              <div className="space-y-3 mb-6">
                {PLANS.map(p => (
                  <div key={p.id} onClick={() => setPlan(p.id)}
                    className={`border-2 rounded-2xl p-5 cursor-pointer transition-all ${plan === p.id ? 'border-[#C17F3B] bg-[#FDF6EE] shadow-sm' : 'border-[#E8E0D4] bg-white hover:border-[#C17F3B]/40'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${plan === p.id ? 'border-[#C17F3B]' : 'border-[#D1C9BE]'}`}>
                          {plan === p.id && <div className="w-2.5 h-2.5 bg-[#C17F3B] rounded-full" />}
                        </div>
                        <div>
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {p.name}
                            {p.badge && <span className="text-xs bg-[#C17F3B] text-white px-2 py-0.5 rounded-full">{p.badge}</span>}
                          </div>
                          <div className="text-xs text-[#6B6560] mt-0.5">{p.tables} · {p.items}</div>
                        </div>
                      </div>
                      <div className="font-semibold text-sm">{p.price}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* NFC teaser */}
              <div className="bg-[#F5E9D8] border border-[#E8C99A] rounded-2xl p-4 mb-6 flex items-start gap-3">
                <span className="text-2xl shrink-0">📲</span>
                <div>
                  <div className="font-semibold text-[#9A6328] text-sm">Наступний крок: налаштування NFC</div>
                  <div className="text-xs text-[#7A5520] mt-1">Після реєстрації ми допоможемо вам налаштувати NFC-теги для кожного столу — це займе кілька хвилин.</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)}
                  className="px-6 py-3.5 border border-[#E8E0D4] bg-white rounded-xl text-sm font-medium hover:border-[#C17F3B] transition-colors">
                  ← Назад
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 bg-[#C17F3B] hover:bg-[#9A6328] text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60">
                  {loading ? 'Створюємо акаунт...' : 'Завершити реєстрацію ✓'}
                </button>
              </div>
              <p className="text-xs text-[#9A9490] mt-4 text-center">
                Реєструючись, ви погоджуєтесь з{' '}
                <a href="#" className="underline">Умовами</a> та{' '}
                <a href="#" className="underline">Конфіденційністю</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
