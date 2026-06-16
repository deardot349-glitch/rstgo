'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

// In production these would come from the newly registered restaurant's data
// For now we read from localStorage or use query params
const TIME_SAVINGS = [
  { label: 'QR-сканування', seconds: 40 },
  { label: 'Передача замовлення', seconds: 90 },
  { label: 'Роздрук і зачитування меню', seconds: 120 },
  { label: 'Підрахунок рахунку вручну', seconds: 60 },
]
const SAVINGS_PER_ORDER_SECONDS = TIME_SAVINGS.reduce((s, t) => s + t.seconds, 0)
const AVG_ORDERS_PER_DAY = 40

function fmtTime(sec: number) {
  if (sec < 60) return `${sec} сек`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m} хв ${s} сек` : `${m} хв`
}

export default function OnboardingNFCPage() {
  const [restaurantName, setRestaurantName] = useState('Ваш заклад')
  const [slug, setSlug] = useState('your-restaurant')
  const [tableCount, setTableCount] = useState(5)
  const [baseUrl, setBaseUrl] = useState('')
  const [step, setStep] = useState<'intro' | 'shipping' | 'done'>('intro')
  const [address, setAddress] = useState('')
  const [addressSaved, setAddressSaved] = useState(false)

  useEffect(() => {
    setBaseUrl(window.location.origin)
    // In a real app these come from the auth session / query params after signup
    const params = new URLSearchParams(window.location.search)
    if (params.get('name')) setRestaurantName(decodeURIComponent(params.get('name')!))
    if (params.get('slug')) setSlug(params.get('slug')!)
    if (params.get('tables')) setTableCount(Number(params.get('tables')))
  }, [])

  const tableUrl = (n: number) => `${baseUrl}/${slug}/table/${n}`

  const dailySavingsSec = SAVINGS_PER_ORDER_SECONDS * AVG_ORDERS_PER_DAY
  const monthlySavingsMin = Math.round((dailySavingsSec * 30) / 60)

  const saveAddress = () => {
    if (!address.trim()) return
    setAddressSaved(true)
    setTimeout(() => setStep('done'), 900)
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap'); body{font-family:'DM Sans',sans-serif;}`}</style>

      {/* Progress header */}
      <div className="bg-white border-b border-[#E8E0D4] px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#C17F3B] rounded-lg flex items-center justify-center text-white font-bold text-sm">R</div>
          <span className="font-bold text-lg" style={{ fontFamily: 'Playfair Display,serif' }}>RSTGO</span>
        </div>
        <div className="flex-1 flex items-center gap-2 mx-4">
          {(['intro', 'shipping', 'done'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-all ${
                step === s ? 'bg-[#C17F3B] text-white' :
                (['intro', 'shipping', 'done'].indexOf(step) > i) ? 'bg-[#3A7D58] text-white' : 'bg-[#E8E0D4] text-[#9A9490]'
              }`}>
                {(['intro', 'shipping', 'done'].indexOf(step) > i) ? '✓' : i + 1}
              </div>
              <div className={`h-1 flex-1 rounded-full last:hidden transition-all ${
                ['intro', 'shipping', 'done'].indexOf(step) > i ? 'bg-[#3A7D58]' : 'bg-[#E8E0D4]'
              }`} />
            </div>
          ))}
        </div>
        <Link href="/dashboard" className="text-sm text-[#9A9490] hover:text-[#C17F3B]">Пропустити</Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* INTRO STEP */}
        {step === 'intro' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-[#F5E9D8] rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">📦</div>
            <h1 style={{ fontFamily: 'Playfair Display,serif' }} className="text-3xl font-bold mb-3">
              Ми надсилаємо NFC-теги для ваших столів
            </h1>
            <p className="text-[#6B6560] mb-8 text-lg">
              Кожен стіл отримає унікальне посилання на ваше меню, вже записане на готовий NFC-тег.
              Ми друкуємо та надсилаємо їх поштою — вам залишається лише наклеїти на стіл.
              Гості торкнуться телефоном і одразу відкриється ваше меню. Жодних додатків.
            </p>

            {/* Time savings stats */}
            <div className="bg-gradient-to-br from-[#1C1A18] to-[#2D2A26] rounded-3xl p-6 mb-8 text-left">
              <div className="text-white/60 text-xs uppercase tracking-widest mb-4">⏱ Скільки часу ви заощадите</div>
              <div className="space-y-3 mb-5">
                {TIME_SAVINGS.map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-white/70 text-sm">{t.label}</span>
                    <span className="text-[#C17F3B] font-semibold text-sm">−{fmtTime(t.seconds)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-4 grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display,serif' }}>{fmtTime(SAVINGS_PER_ORDER_SECONDS)}</div>
                  <div className="text-white/30 text-xs mt-1">на замовлення</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#C17F3B]" style={{ fontFamily: 'Playfair Display,serif' }}>{fmtTime(dailySavingsSec)}</div>
                  <div className="text-white/30 text-xs mt-1">на день (~40 зам.)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#6FCF97]" style={{ fontFamily: 'Playfair Display,serif' }}>{monthlySavingsMin} хв</div>
                  <div className="text-white/30 text-xs mt-1">на місяць</div>
                </div>
              </div>
            </div>

            <div className="bg-[#F5E9D8] border border-[#E8C99A] rounded-2xl p-5 mb-8 text-left">
              <div className="font-semibold text-[#9A6328] mb-3">Як це працює:</div>
              <div className="space-y-2">
                {[
                  { icon: '🏷️', text: `Ми готуємо ${tableCount} NFC-наклейок — по одній на кожен стіл, посилання вже записане` },
                  { icon: '📮', text: 'Надсилаємо поштою на адресу вашого закладу — зазвичай 3–5 робочих днів' },
                  { icon: '📍', text: 'Наклейте теги на столи відповідно до номерів — і все готово' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <span className="text-sm text-[#7A5520]">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setStep('shipping')}
              className="w-full py-4 bg-[#C17F3B] hover:bg-[#9A6328] text-white font-semibold rounded-2xl text-lg transition-colors">
              Вказати адресу доставки →
            </button>
            <button onClick={() => { window.location.href = '/dashboard' }}
              className="w-full py-3 mt-3 text-sm text-[#9A9490] hover:text-[#6B6560]">
              Пропустити, вкажу пізніше в Налаштуваннях
            </button>
          </div>
        )}

        {/* SHIPPING STEP */}
        {step === 'shipping' && (
          <div>
            <div className="mb-6">
              <h1 style={{ fontFamily: 'Playfair Display,serif' }} className="text-2xl font-bold mb-1">
                Куди надіслати NFC-теги для «{restaurantName}»
              </h1>
              <p className="text-[#6B6560] text-sm">
                Вкажіть адресу закладу — ми надрукуємо та надішлемо {tableCount} NFC-наклейок (по одній на кожен стіл)
              </p>
            </div>

            <div className="bg-white border border-[#E8E0D4] rounded-2xl p-5 mb-5">
              <label className="block text-sm font-medium mb-1.5">Адреса доставки *</label>
              <input value={address} onChange={e => setAddress(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveAddress()}
                className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none text-sm mb-2"
                placeholder="вул. Хрещатик, 1, Київ, 01001" />
              <p className="text-xs text-[#9A9490]">Ви завжди можете змінити цю адресу пізніше в Налаштуваннях</p>
            </div>

            {/* What you'll receive */}
            <div className="bg-[#FAF8F5] border border-[#E8E0D4] rounded-2xl p-5 mb-6">
              <div className="font-semibold text-sm mb-3">📦 Що ви отримаєте:</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {Array.from({ length: tableCount }, (_, i) => i + 1).map(n => (
                  <div key={n} className="flex items-center gap-3 bg-white border border-[#E8E0D4] rounded-xl px-3 py-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#F5E9D8] text-[#C17F3B] flex items-center justify-center font-bold text-xs shrink-0">{n}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs">NFC-тег · Стіл №{n}</div>
                      <div className="text-[10px] text-[#9A9490] font-mono truncate">{tableUrl(n)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('intro')}
                className="px-5 py-3.5 border border-[#E8E0D4] bg-white rounded-xl text-sm font-medium">← Назад</button>
              <button onClick={saveAddress} disabled={!address.trim()}
                className="flex-1 py-3.5 bg-[#C17F3B] hover:bg-[#9A6328] text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
                {addressSaved ? '✓ Збережено' : 'Підтвердити адресу →'}
              </button>
            </div>
          </div>
        )}

        {/* DONE STEP */}
        {step === 'done' && (
          <div className="text-center">
            <div className="w-24 h-24 bg-[#E6F4ED] rounded-full flex items-center justify-center text-5xl mx-auto mb-6">🎉</div>
            <h1 style={{ fontFamily: 'Playfair Display,serif' }} className="text-3xl font-bold mb-3">
              Готово! Ваші NFC-теги в дорозі
            </h1>
            <p className="text-[#6B6560] mb-8">
              Ми надрукуємо {tableCount} NFC-наклейок з посиланнями на ваше меню та надішлемо на вказану адресу.
              Зазвичай це займає 3–5 робочих днів. Поки чекаєте — налаштуйте меню.
            </p>

            {/* Summary stats */}
            <div className="bg-[#1C1A18] rounded-3xl p-6 mb-8 text-left">
              <div className="text-white/40 text-xs uppercase tracking-widest mb-4">Ваша економія щомісяця</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-bold text-[#C17F3B]" style={{ fontFamily: 'Playfair Display,serif' }}>
                    {monthlySavingsMin} хв
                  </div>
                  <div className="text-white/30 text-xs mt-1">персонального часу</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#6FCF97]" style={{ fontFamily: 'Playfair Display,serif' }}>
                    ~{Math.round(monthlySavingsMin / 60)} год
                  </div>
                  <div className="text-white/30 text-xs mt-1">або {fmtTime(dailySavingsSec)} щодня</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/dashboard/menu"
                className="block w-full py-4 bg-[#C17F3B] hover:bg-[#9A6328] text-white font-semibold rounded-2xl transition-colors">
                Додати меню →
              </Link>
              <Link href="/dashboard"
                className="block w-full py-3.5 border border-[#E8E0D4] bg-white rounded-2xl text-sm font-medium text-[#6B6560] hover:border-[#C17F3B]">
                До дашборду
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
