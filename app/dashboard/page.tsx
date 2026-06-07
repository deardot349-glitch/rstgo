'use client'
import Link from 'next/link'

const STATS = [
  { label: 'Замовлень сьогодні', value: '24', delta: '+8 vs вчора', up: true, icon: '📋' },
  { label: 'Виручка сьогодні', value: '8 340 ₴', delta: '+12% vs вчора', up: true, icon: '💰' },
  { label: 'Активних столів', value: '7 / 10', delta: '3 вільних', up: null, icon: '🪑' },
  { label: 'Виклики офіціанта', value: '2', delta: 'Потребують уваги', up: false, icon: '🔔' },
]

const RECENT_ORDERS = [
  { table: 4, guests: ['Олена', 'Максим'], total: 537, status: 'pending', time: '14:22' },
  { table: 7, guests: ['Іван'], total: 289, status: 'preparing', time: '14:18' },
  { table: 2, guests: ['Марія', 'Софія', 'Катерина'], total: 890, status: 'served', time: '14:05' },
  { table: 9, guests: ['Андрій'], total: 179, status: 'paid', time: '13:58' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Очікує',    color: 'bg-yellow-100 text-yellow-800' },
  preparing: { label: 'Готується', color: 'bg-blue-100 text-blue-800' },
  served:    { label: 'Подано',    color: 'bg-green-100 text-green-800' },
  paid:      { label: 'Оплачено',  color: 'bg-gray-100 text-gray-600' },
}

const QUICK_ACTIONS = [
  { href: '/dashboard/menu', label: 'Редагувати меню', icon: '🍽', desc: 'Додати страви, змінити ціни' },
  { href: '/dashboard/tables', label: 'Управління столами', icon: '🪑', desc: 'QR-коди, NFC посилання' },
  { href: '/demo/staff', label: 'Панель персоналу', icon: '👨‍🍳', desc: 'Замовлення в реальному часі' },
  { href: '/dashboard/settings', label: 'Налаштування', icon: '⚙️', desc: 'PIN, валюта, бренд' },
]

export default function DashboardPage() {
  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1">Добрий день! 👋</h1>
        <p className="text-[#6B6560]">Ресторан «Ватра» · <span className="text-[#3A7D58] font-medium">● Активний</span></p>
      </div>

      {/* Setup banner if new */}
      <div className="bg-gradient-to-r from-[#C17F3B] to-[#9A6328] rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-semibold text-lg mb-1">Завершіть налаштування 🚀</div>
            <p className="text-white/80 text-sm">Додайте меню та роздрукуйте NFC/QR для столів — і ви готові до роботи</p>
            <div className="flex gap-2 mt-4">
              <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-medium">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />Акаунт ✓
              </div>
              <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-medium">
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />Меню
              </div>
              <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-medium">
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />NFC/QR
              </div>
            </div>
          </div>
          <Link href="/dashboard/menu"
            className="shrink-0 bg-white text-[#C17F3B] font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white/90 transition-colors">
            Налаштувати →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat, i) => (
          <div key={i} className="bg-white border border-[#E8E0D4] rounded-2xl p-5">
            <div className="text-2xl mb-3">{stat.icon}</div>
            <div className="font-display text-2xl font-bold mb-0.5">{stat.value}</div>
            <div className="text-xs text-[#9A9490] mb-1">{stat.label}</div>
            <div className={`text-xs font-medium ${stat.up === true ? 'text-[#3A7D58]' : stat.up === false ? 'text-red-500' : 'text-[#6B6560]'}`}>
              {stat.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white border border-[#E8E0D4] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg">Останні замовлення</h2>
            <Link href="/demo/staff" className="text-sm text-[#C17F3B] font-medium hover:underline">Всі →</Link>
          </div>
          <div className="space-y-3">
            {RECENT_ORDERS.map((order, i) => {
              const sc = STATUS_CONFIG[order.status]
              return (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#FAF8F5] transition-colors">
                  <div className="w-10 h-10 bg-[#F5E9D8] rounded-xl flex items-center justify-center font-bold text-[#C17F3B] text-sm shrink-0">
                    {order.table}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{order.guests.join(', ')}</div>
                    <div className="text-xs text-[#9A9490]">Стіл №{order.table} · {order.time}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-sm mb-1">{order.total} ₴</div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-5">Швидкі дії</h2>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((action, i) => (
              <Link key={i} href={action.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FAF8F5] transition-colors group">
                <span className="text-xl">{action.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium group-hover:text-[#C17F3B] transition-colors">{action.label}</div>
                  <div className="text-xs text-[#9A9490]">{action.desc}</div>
                </div>
                <span className="text-[#D1C9BE] group-hover:text-[#C17F3B] transition-colors">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
