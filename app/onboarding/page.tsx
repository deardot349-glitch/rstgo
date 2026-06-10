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
  const [copiedTable, setCopiedTable] = useState<number | null>(null)
  const [nfcReady, setNfcReady] = useState<Set<number>>(new Set())
  const [step, setStep] = useState<'intro' | 'setup' | 'done'>('intro')
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    setBaseUrl(window.location.origin)
    // In a real app these come from the auth session / query params after signup
    const params = new URLSearchParams(window.location.search)
    if (params.get('name')) setRestaurantName(decodeURIComponent(params.get('name')!))
    if (params.get('slug')) setSlug(params.get('slug')!)
    if (params.get('tables')) setTableCount(Number(params.get('tables')))
  }, [])

  const tableUrl = (n: number) => `${baseUrl}/${slug}/table/${n}`

  const copyUrl = async (n: number) => {
    await navigator.clipboard.writeText(tableUrl(n))
    setCopiedTable(n)
    setTimeout(() => setCopiedTable(null), 2000)
    // Mark as "ready"
    setNfcReady(prev => new Set([...prev, n]))
  }

  const markReady = (n: number) => {
    setNfcReady(prev => new Set([...prev, n]))
  }

  const allReady = nfcReady.size === tableCount
  const dailySavingsSec = SAVINGS_PER_ORDER_SECONDS * AVG_ORDERS_PER_DAY
  const monthlySavingsMin = Math.round((dailySavingsSec * 30) / 60)

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
          {(['intro', 'setup', 'done'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-all ${
                step === s ? 'bg-[#C17F3B] text-white' :
                (['intro', 'setup', 'done'].indexOf(step) > i) ? 'bg-[#3A7D58] text-white' : 'bg-[#E8E0D4] text-[#9A9490]'
              }`}>
                {(['intro', 'setup', 'done'].indexOf(step) > i) ? '✓' : i + 1}
              </div>
              <div className={`h-1 flex-1 rounded-full last:hidden transition-all ${
                ['intro', 'setup', 'done'].indexOf(step) > i ? 'bg-[#3A7D58]' : 'bg-[#E8E0D4]'
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
            <div className="w-20 h-20 bg-[#F5E9D8] rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">📲</div>
            <h1 style={{ fontFamily: 'Playfair Display,serif' }} className="text-3xl font-bold mb-3">
              Налаштуйте NFC для столів
            </h1>
            <p className="text-[#6B6560] mb-8 text-lg">
              Кожен стіл отримає унікальне посилання. Запишіть його на NFC-тег або роздрукуйте QR —
              гості торкнуться телефоном і одразу відкриється ваше меню. Жодних додатків.
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
              <div className="font-semibold text-[#9A6328] mb-3">Що вам знадобиться:</div>
              <div className="space-y-2">
                {[
                  { icon: '📦', text: `NFC NTAG213 наклейки — ${tableCount} штук (AliExpress, ~5–15 ₴/шт)` },
                  { icon: '📱', text: 'Додаток NFC Tools або NFC TagWriter by NXP (безкоштовно)' },
                  { icon: '⏱', text: `Приблизно ${Math.max(5, tableCount * 2)} хвилин вашого часу` },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <span className="text-sm text-[#7A5520]">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setStep('setup')}
              className="w-full py-4 bg-[#C17F3B] hover:bg-[#9A6328] text-white font-semibold rounded-2xl text-lg transition-colors">
              Розпочати налаштування →
            </button>
            <button onClick={() => { window.location.href = '/dashboard' }}
              className="w-full py-3 mt-3 text-sm text-[#9A9490] hover:text-[#6B6560]">
              Пропустити, налаштую пізніше
            </button>
          </div>
        )}

        {/* SETUP STEP */}
        {step === 'setup' && (
          <div>
            <div className="mb-6">
              <h1 style={{ fontFamily: 'Playfair Display,serif' }} className="text-2xl font-bold mb-1">
                NFC для «{restaurantName}»
              </h1>
              <p className="text-[#6B6560] text-sm">
                Скопіюйте посилання кожного столу та запишіть на відповідний NFC-тег
              </p>
            </div>

            {/* Instruction card */}
            <div className="bg-white border border-[#E8E0D4] rounded-2xl p-4 mb-5">
              <div className="font-semibold text-sm mb-2">📲 Як записати на NFC-тег:</div>
              <ol className="text-xs text-[#6B6560] space-y-1 list-decimal list-inside">
                <li>Відкрийте <strong>NFC Tools</strong> → «Write» → «Add a record» → «URL / URI»</li>
                <li>Вставте скопійоване посилання → «Write» → Торкніться тегу телефоном</li>
                <li>Готово! Наклейте тег на стіл і відмітьте ✓ нижче</li>
              </ol>
            </div>

            {/* Progress bar */}
            <div className="bg-white border border-[#E8E0D4] rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Готовність NFC</span>
                <span className="text-sm font-bold text-[#C17F3B]">{nfcReady.size} / {tableCount}</span>
              </div>
              <div className="h-2 bg-[#F0EAE2] rounded-full overflow-hidden">
                <div className="h-full bg-[#C17F3B] rounded-full transition-all duration-500"
                  style={{ width: `${(nfcReady.size / tableCount) * 100}%` }} />
              </div>
              {allReady && (
                <div className="flex items-center gap-2 mt-2 text-[#3A7D58] text-sm font-semibold">
                  <span>✅</span> Всі столи готові!
                </div>
              )}
            </div>

            {/* Table list */}
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {Array.from({ length: tableCount }, (_, i) => i + 1).map(n => {
                const url = tableUrl(n)
                const isCopied = copiedTable === n
                const isReady = nfcReady.has(n)
                return (
                  <div key={n} className={`bg-white border-2 rounded-2xl p-4 transition-all ${isReady ? 'border-[#3A7D58]' : 'border-[#E8E0D4]'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 transition-all ${isReady ? 'bg-[#E6F4ED] text-[#3A7D58]' : 'bg-[#F5E9D8] text-[#C17F3B]'}`}>
                        {isReady ? '✓' : n}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">Стіл №{n}</div>
                        <div className="text-xs text-[#9A9490]">
                          {isReady ? 'NFC готовий ✓' : 'Очікує налаштування'}
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#FAF8F5] rounded-xl px-3 py-2 mb-3">
                      <div className="text-xs font-mono text-[#9A9490] truncate">{url || '...'}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => copyUrl(n)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${isCopied ? 'bg-[#3A7D58] text-white' : 'bg-[#F5E9D8] text-[#9A6328] hover:bg-[#EDD5B3]'}`}>
                        {isCopied ? '✓ Скопійовано!' : '📋 Копіювати'}
                      </button>
                      <button onClick={() => markReady(n)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isReady ? 'bg-[#E6F4ED] text-[#3A7D58]' : 'bg-[#F5F3EF] text-[#9A9490] hover:bg-[#E8E0D4]'}`}>
                        {isReady ? '✓' : 'Відмітити'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('intro')}
                className="px-5 py-3.5 border border-[#E8E0D4] bg-white rounded-xl text-sm font-medium">← Назад</button>
              <button onClick={() => setStep('done')}
                className="flex-1 py-3.5 bg-[#C17F3B] hover:bg-[#9A6328] text-white font-semibold rounded-xl transition-colors">
                {allReady ? 'Завершити налаштування ✓' : 'Продовжити →'}
              </button>
            </div>
          </div>
        )}

        {/* DONE STEP */}
        {step === 'done' && (
          <div className="text-center">
            <div className="w-24 h-24 bg-[#E6F4ED] rounded-full flex items-center justify-center text-5xl mx-auto mb-6">🎉</div>
            <h1 style={{ fontFamily: 'Playfair Display,serif' }} className="text-3xl font-bold mb-3">
              Ви готові до роботи!
            </h1>
            <p className="text-[#6B6560] mb-8">
              {nfcReady.size === tableCount
                ? `Всі ${tableCount} столів налаштовані. Гості можуть замовляти торкнувшись телефоном до тегу.`
                : `${nfcReady.size} зі ${tableCount} столів налаштовано. Решту можна додати пізніше в розділі «Столи».`}
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
