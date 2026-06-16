'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const NAV = ['Можливості', 'Як це працює', 'Ціни', 'FAQ']

const FEATURES = [
  {
    icon: '📲',
    title: 'NFC або QR — одне торкання',
    desc: 'Гість підносить телефон до тега або сканує код — і вже в меню. Жодних застосунків, жодної реєстрації.',
  },
  {
    icon: '👥',
    title: 'Спільне замовлення за столом',
    desc: 'Кожен вводить своє ім\'я та обирає страви. Кошик спільний — видно хто що замовив, підписано іменем.',
  },
  {
    icon: '💳',
    title: 'Розділити рахунок одним кліком',
    desc: 'Окремий рахунок для кожного гостя формується автоматично. Ніяких незручних підрахунків.',
  },
  {
    icon: '🔔',
    title: 'Виклик офіціанта',
    desc: 'Кнопка прямо в меню. Персонал отримує повідомлення миттєво з номером столу.',
  },
  {
    icon: '🍳',
    title: 'Кухня отримує замовлення в реальному часі',
    desc: 'Окрема захищена панель для персоналу. Оновлюється автоматично. Позначте виконано — і готово.',
  },
  {
    icon: '⚙️',
    title: 'Повне налаштування за 10 хвилин',
    desc: 'Меню, столики, PIN персоналу, валюта, кольори — все в одному дашборді. Жодного програміста.',
  },
]

const HOW = [
  { step: '01', title: 'Зареєструйтесь', desc: 'Введіть дані ресторану, оберіть план — акаунт готовий за 2 хвилини.' },
  { step: '02', title: 'Налаштуйте меню та столики', desc: 'Додайте категорії, страви з описами, фото та цінами. Вкажіть кількість столів.' },
  { step: '03', title: 'Отримайте NFC-теги поштою', desc: 'Ми надсилаємо готові NFC-наклейки для кожного столу. Просто наклейте — посилання вже записане.' },
  { step: '04', title: 'Персонал входить за PIN', desc: 'Захищена панель тільки для вашої команди. Замовлення — в реальному часі.' },
]

const PLANS = [
  {
    name: 'Starter',
    price: 0,
    period: 'назавжди',
    desc: 'Ідеально для малого кафе або тестування',
    features: ['До 5 столів', 'До 30 позицій у меню', 'Панель персоналу', 'QR-коди для столів', 'Базова підтримка'],
    cta: 'Почати безкоштовно',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 999,
    period: 'на місяць',
    desc: 'Для ресторанів з повноцінною роботою',
    features: ['До 20 столів', 'Необмежене меню', 'NFC-теги включено', 'Аналітика замовлень', 'Розподіл рахунків', 'Пріоритетна підтримка', 'Власний колір/бренд'],
    cta: 'Спробувати Pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 2999,
    period: 'на місяць',
    desc: 'Мережа ресторанів або великий заклад',
    features: ['Необмежена кількість столів', 'Мультилокація', 'Власний домен', 'API доступ', 'White-label рішення', 'Персональний менеджер', 'SLA гарантія'],
    cta: 'Зв\'язатись з нами',
    highlighted: false,
  },
]

const FAQS = [
  {
    q: 'Чи потрібен мобільний застосунок?',
    a: 'Ні. Все працює через браузер. Гість просто торкається телефону до NFC або сканує QR — і вже в меню без жодного завантаження.',
  },
  {
    q: 'Як персонал отримує замовлення?',
    a: 'Є окрема захищена панель за унікальним посиланням. Вхід — за PIN-кодом, який ви задаєте. Замовлення з\'являються автоматично в реальному часі.',
  },
  {
    q: 'Що таке NFC-теги і як я їх отримаю?',
    a: 'NFC-теги — маленькі наклейки, на які записується посилання на ваше меню. Після реєстрації ми надсилаємо готові теги поштою — по одному на кожен стіл. Вам залишається лише наклеїти.',
  },
  {
    q: 'Чи можу я редагувати меню у будь-який час?',
    a: 'Так, зміни в дашборді відображаються для гостей миттєво — без перевантаження сторінки та без будь-яких затримок.',
  },
  {
    q: 'Чи безпечна панель персоналу?',
    a: 'Так. Панель персоналу доступна за окремим URL і захищена PIN-кодом. Гості не можуть потрапити туди навіть знаючи структуру посилань.',
  },
]

export default function LandingPage() {
  const [activeNav, setActiveNav] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1A18]">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#FAF8F5]/95 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#C17F3B] rounded-lg flex items-center justify-center text-white font-bold text-sm">R</div>
            <span className="font-display font-bold text-xl">RSTGO</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {NAV.map(n => (
              <a key={n} href={`#${n.toLowerCase().replace(/\s/g,'-')}`} className="text-sm text-[#6B6560] hover:text-[#1C1A18] transition-colors">{n}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[#6B6560] hover:text-[#1C1A18] px-4 py-2">Увійти</Link>
            <Link href="/signup" className="text-sm font-semibold bg-[#C17F3B] hover:bg-[#9A6328] text-white px-5 py-2 rounded-xl transition-colors">Почати безкоштовно</Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current" />
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#FAF8F5] border-t border-[#E8E0D4] px-6 py-4 flex flex-col gap-4">
            {NAV.map(n => <a key={n} href="#" className="text-sm font-medium">{n}</a>)}
            <Link href="/signup" className="text-sm font-semibold bg-[#C17F3B] text-white px-5 py-3 rounded-xl text-center">Почати безкоштовно</Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 bg-[#C17F3B]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#3A7D58]/6 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-[#C17F3B]/10 text-[#9A6328] px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
            <span className="w-1.5 h-1.5 bg-[#C17F3B] rounded-full animate-pulse" />
            Підходить для ресторанів, кафе, барів та готелів
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
            Ваше меню — <br />
            <span className="text-[#C17F3B] italic">одне торкання</span>
          </h1>

          <p className="text-xl md:text-2xl text-[#6B6560] max-w-2xl mx-auto leading-relaxed mb-12">
            NFC або QR — гості замовляють зі свого телефону без застосунків. Персонал бачить замовлення миттєво. Ви налаштовуєте все самостійно за 10 хвилин.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/signup" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#C17F3B] hover:bg-[#9A6328] text-white font-semibold text-lg px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-[#C17F3B]/25 hover:shadow-xl hover:shadow-[#C17F3B]/30 hover:-translate-y-0.5">
              Почати безкоштовно
              <span>→</span>
            </Link>
            <a href="#як-це-працює" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-[#E8E0D4] text-[#1C1A18] font-semibold text-lg px-8 py-4 rounded-2xl hover:border-[#C17F3B] transition-colors">
              Як це працює
            </a>
          </div>

          {/* MOCKUP */}
          <div className="relative mx-auto max-w-sm">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-[#E8E0D4] overflow-hidden">
              <div className="bg-[#1C1A18] px-6 pt-4 pb-3">
                <div className="flex justify-between text-white text-xs opacity-60 mb-3">
                  <span>9:41</span><span>●●●</span>
                </div>
                <div className="bg-[#2D2A26] rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-[#C17F3B] rounded-full flex items-center justify-center text-white font-bold text-xs">О</div>
                    <div>
                      <div className="text-white font-semibold text-sm">Олена</div>
                      <div className="text-white/50 text-xs">Стіл №4 · 3 гості</div>
                    </div>
                  </div>
                  {[
                    { e: '🥗', n: 'Цезар з куркою', p: '179 ₴', who: 'Олена' },
                    { e: '🍕', n: 'Пепероні', p: '259 ₴', who: 'Максим' },
                    { e: '🥤', n: 'Лимонад', p: '99 ₴', who: 'Олена' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-[#3A3735] rounded-xl p-2.5 mb-1.5">
                      <span className="text-lg">{item.e}</span>
                      <div className="flex-1">
                        <div className="text-white text-xs font-medium">{item.n}</div>
                        <div className="text-white/40 text-xs">{item.who}</div>
                      </div>
                      <span className="text-[#C17F3B] text-xs font-bold">{item.p}</span>
                    </div>
                  ))}
                  <div className="mt-3 bg-[#3A7D58] rounded-xl p-3 text-center">
                    <span className="text-white text-sm font-bold">✅ Відправити замовлення</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white">
                <div className="grid grid-cols-2 gap-2">
                  {['🥗 Салати', '🍲 Супи', '🍽 Основні', '🍕 Піца'].map(c => (
                    <div key={c} className="bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl px-3 py-2 text-xs font-medium text-center">{c}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -right-4 top-24 bg-white rounded-2xl shadow-xl border border-[#E8E0D4] px-4 py-3">
              <div className="text-xs text-[#6B6560] mb-0.5">Нове замовлення</div>
              <div className="font-semibold text-sm">🪑 Стіл №4</div>
              <div className="text-xs text-[#3A7D58] font-medium mt-0.5">537 ₴ · зараз</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGOS / SOCIAL PROOF ── */}
      <section className="py-12 border-y border-[#E8E0D4] bg-white/50">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-sm text-[#9A9490] mb-6 uppercase tracking-widest font-medium">Довіряють заклади по всій Україні</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-40">
            {['Ресторан «Вернісаж»', 'Кафе Barvy', 'Bistro 1901', 'Hotel Grand', 'Pizza House'].map(n => (
              <span key={n} className="font-display font-bold text-lg text-[#1C1A18]">{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="можливості" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Все що потрібно <br /><span className="text-[#C17F3B] italic">сучасному ресторану</span></h2>
            <p className="text-[#6B6560] text-lg max-w-xl mx-auto">Від вітання гостя до закриття рахунку — RSTGO покриває весь цикл обслуговування.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white border border-[#E8E0D4] rounded-2xl p-6 hover:border-[#C17F3B] hover:shadow-lg transition-all duration-300 group">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-[#C17F3B] transition-colors">{f.title}</h3>
                <p className="text-[#6B6560] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="як-це-працює" className="py-24 px-6 bg-[#1C1A18]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Запуск за <span className="text-[#C17F3B] italic">4 кроки</span></h2>
            <p className="text-white/50 text-lg">Від реєстрації до першого замовлення — менше 15 хвилин</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {HOW.map((h, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/8 transition-colors">
                <div className="font-display text-5xl font-bold text-[#C17F3B]/30 mb-4">{h.step}</div>
                <h3 className="text-white font-semibold text-xl mb-2">{h.title}</h3>
                <p className="text-white/50 leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>

          {/* NFC shipping banner */}
          <div className="mt-10 bg-[#C17F3B]/10 border border-[#C17F3B]/25 rounded-2xl p-6 flex items-start gap-4">
            <span className="text-3xl shrink-0">📦</span>
            <div>
              <div className="text-white font-semibold text-lg mb-1">NFC-теги надсилаємо ми</div>
              <p className="text-white/60 text-sm leading-relaxed">
                Після реєстрації ми відправляємо готові NFC-наклейки поштою — по одному тегу на кожен стіл.
                Посилання вже записане. Ваше завдання — лише наклеїти на стіл.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="ціни" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Прозорі <span className="text-[#C17F3B] italic">ціни</span></h2>
            <p className="text-[#6B6560] text-lg">Починайте безкоштовно — платіть лише коли готові масштабуватись</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <div key={i} className={`rounded-2xl p-8 border-2 relative ${plan.highlighted ? 'bg-[#C17F3B] border-[#C17F3B] text-white shadow-2xl shadow-[#C17F3B]/30 scale-105' : 'bg-white border-[#E8E0D4]'}`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1C1A18] text-white text-xs font-bold px-4 py-1 rounded-full">Найпопулярніший</div>
                )}
                <div className={`text-sm font-semibold mb-2 ${plan.highlighted ? 'text-white/70' : 'text-[#C17F3B]'}`}>{plan.name}</div>
                <div className="mb-1">
                  <span className="font-display text-4xl font-bold">{plan.price === 0 ? 'Безкоштовно' : `${plan.price} ₴`}</span>
                </div>
                {plan.price > 0 && <div className={`text-sm mb-4 ${plan.highlighted ? 'text-white/60' : 'text-[#6B6560]'}`}>{plan.period}</div>}
                <p className={`text-sm mb-6 ${plan.highlighted ? 'text-white/80' : 'text-[#6B6560]'}`}>{plan.desc}</p>
                <ul className="space-y-2 mb-8">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className={`flex items-center gap-2 text-sm ${plan.highlighted ? 'text-white/90' : 'text-[#1C1A18]'}`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${plan.highlighted ? 'bg-white/20' : 'bg-[#3A7D58]/15 text-[#3A7D58]'}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={`block text-center font-semibold py-3 rounded-xl transition-all ${plan.highlighted ? 'bg-white text-[#C17F3B] hover:bg-white/90' : 'bg-[#C17F3B] text-white hover:bg-[#9A6328]'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl font-bold text-center mb-16">Часті <span className="text-[#C17F3B] italic">запитання</span></h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-[#E8E0D4] rounded-2xl overflow-hidden">
                <button
                  className="w-full text-left px-6 py-5 font-semibold flex items-center justify-between hover:bg-[#FAF8F5] transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <span className={`transition-transform duration-200 text-[#C17F3B] ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-[#6B6560] leading-relaxed border-t border-[#E8E0D4] pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="py-24 px-6 bg-[#1C1A18]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
            Готові запустити <br /><span className="text-[#C17F3B] italic">цифрове меню?</span>
          </h2>
          <p className="text-white/50 text-lg mb-10">Безкоштовний план. Жодної кредитної картки. NFC-теги надсилаємо ми.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-[#C17F3B] hover:bg-[#9A6328] text-white font-semibold text-lg px-10 py-5 rounded-2xl transition-all duration-200 shadow-xl shadow-[#C17F3B]/30">
            Почати безкоштовно →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#141210] text-white/40 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#C17F3B] rounded flex items-center justify-center text-white font-bold text-xs">R</div>
            <span className="font-display font-bold text-white/70">RSTGO</span>
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Умови</a>
            <a href="#" className="hover:text-white transition-colors">Конфіденційність</a>
            <a href="mailto:hello@rstgo.app" className="hover:text-white transition-colors">Контакт</a>
          </div>
          <div className="text-sm">© 2025 RSTGO. Всі права захищені.</div>
        </div>
      </footer>
    </div>
  )
}
