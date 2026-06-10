'use client'
import { useState } from 'react'
import Link from 'next/link'

type UserStatus = 'active' | 'blocked' | 'pending'
type Plan = 'starter' | 'pro' | 'enterprise'

type User = {
  id: string
  email: string
  restaurantName: string
  slug: string
  plan: Plan
  status: UserStatus
  tableCount: number
  createdAt: string
  lastSeen: string
  ordersTotal: number
  revenue: number
}

const MOCK_USERS: User[] = [
  { id: '1', email: 'vatra@gmail.com', restaurantName: 'Ресторан «Ватра»', slug: 'vatra', plan: 'pro', status: 'active', tableCount: 12, createdAt: '2025-01-15', lastSeen: '2025-06-10', ordersTotal: 842, revenue: 287400 },
  { id: '2', email: 'pizzeria.kyiv@gmail.com', restaurantName: 'Піцерія Наполі', slug: 'napoli', plan: 'starter', status: 'active', tableCount: 5, createdAt: '2025-03-02', lastSeen: '2025-06-09', ordersTotal: 231, revenue: 68900 },
  { id: '3', email: 'cafe.lviv@ukr.net', restaurantName: 'Кав\'ярня Дах', slug: 'dakh', plan: 'enterprise', status: 'active', tableCount: 30, createdAt: '2024-11-20', lastSeen: '2025-06-10', ordersTotal: 2140, revenue: 912000 },
  { id: '4', email: 'sushi.bar@gmail.com', restaurantName: 'Суші-бар Сакура', slug: 'sakura', plan: 'pro', status: 'blocked', tableCount: 8, createdAt: '2025-02-14', lastSeen: '2025-05-28', ordersTotal: 445, revenue: 156700 },
  { id: '5', email: 'burgers.odesa@gmail.com', restaurantName: 'Бургерна ОдесА', slug: 'odesa-burgers', plan: 'starter', status: 'pending', tableCount: 3, createdAt: '2025-06-08', lastSeen: '2025-06-08', ordersTotal: 0, revenue: 0 },
  { id: '6', email: 'shawarma.kharkiv@gmail.com', restaurantName: 'Шаурма Хаус', slug: 'shawarma-house', plan: 'starter', status: 'active', tableCount: 4, createdAt: '2025-04-11', lastSeen: '2025-06-07', ordersTotal: 88, revenue: 21200 },
  { id: '7', email: 'fine.dining@gmail.com', restaurantName: 'Fine Dining Kyiv', slug: 'fine-dining', plan: 'enterprise', status: 'active', tableCount: 20, createdAt: '2025-01-03', lastSeen: '2025-06-10', ordersTotal: 1870, revenue: 1240000 },
]

const PLAN_COLORS: Record<Plan, string> = {
  starter: 'bg-gray-100 text-gray-600',
  pro: 'bg-[#F5E9D8] text-[#9A6328]',
  enterprise: 'bg-[#E6F4ED] text-[#2E7D54]',
}

const STATUS_COLORS: Record<UserStatus, string> = {
  active: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
}

const STATUS_LABELS: Record<UserStatus, string> = {
  active: '● Активний',
  blocked: '✕ Заблокований',
  pending: '◌ Очікує',
}

const ADMIN_PIN = '0000'

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState<Plan | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: 'block' | 'unblock' | 'delete'; user: User } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const tryPin = () => {
    if (pinInput === ADMIN_PIN) {
      setAuthenticated(true)
    } else {
      setPinError(true)
      setPinInput('')
      setTimeout(() => setPinError(false), 1500)
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const blockUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'blocked' } : u))
    setSelectedUser(prev => prev?.id === userId ? { ...prev, status: 'blocked' } : prev)
    setConfirmAction(null)
    showToast('Користувача заблоковано')
  }

  const unblockUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u))
    setSelectedUser(prev => prev?.id === userId ? { ...prev, status: 'active' } : prev)
    setConfirmAction(null)
    showToast('Користувача розблоковано')
  }

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId))
    setSelectedUser(null)
    setConfirmAction(null)
    showToast('Акаунт видалено')
  }

  const changePlan = (userId: string, plan: Plan) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan } : u))
    setSelectedUser(prev => prev?.id === userId ? { ...prev, plan } : prev)
    showToast(`План змінено на ${plan}`)
  }

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.restaurantName.toLowerCase().includes(search.toLowerCase()) ||
      u.slug.toLowerCase().includes(search.toLowerCase())
    const matchPlan = filterPlan === 'all' || u.plan === filterPlan
    const matchStatus = filterStatus === 'all' || u.status === filterStatus
    return matchSearch && matchPlan && matchStatus
  })

  const totalRevenue = users.reduce((s, u) => s + u.revenue, 0)
  const activeCount = users.filter(u => u.status === 'active').length
  const proCount = users.filter(u => u.plan !== 'starter').length

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0F0D0C] flex items-center justify-center px-6">
        <div className="w-full max-w-xs text-center">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">🛡</div>
          <div className="text-white font-bold text-xl mb-1">Адмін-панель</div>
          <div className="text-white/30 text-xs uppercase tracking-widest mb-8">RSTGO · Захищено</div>
          <div className="text-white/50 text-sm mb-5">Введіть адмін-пароль</div>
          <div className={`flex justify-center gap-4 mb-6 transition-transform ${pinError ? 'translate-x-2' : ''}`}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i < pinInput.length ? 'bg-red-500 border-red-500' : 'border-white/20'}`} />
            ))}
          </div>
          {pinError && <p className="text-red-400 text-sm mb-4">Невірний пароль</p>}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button key={n} onClick={() => { if (pinInput.length < 4) setPinInput(p => p + n) }}
                className="h-14 bg-white/8 hover:bg-white/15 text-white font-semibold text-xl rounded-2xl transition-all active:scale-95">{n}</button>
            ))}
            <div />
            <button onClick={() => { if (pinInput.length < 4) setPinInput(p => p + '0') }}
              className="h-14 bg-white/8 hover:bg-white/15 text-white font-semibold text-xl rounded-2xl transition-all">0</button>
            <button onClick={() => setPinInput(p => p.slice(0, -1))}
              className="h-14 bg-white/8 hover:bg-white/15 text-white/50 text-2xl rounded-2xl transition-all flex items-center justify-center">⌫</button>
          </div>
          <button onClick={tryPin} disabled={pinInput.length < 4}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-30">
            Увійти
          </button>
          <div className="mt-6">
            <Link href="/dashboard" className="text-white/30 text-sm hover:text-white/50">← До дашборду</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0D0C] text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#3A7D58] text-white px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl animate-fade-in">
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-[#1C1A18] border-b border-white/8 px-6 py-4 flex items-center gap-4 sticky top-0 z-40">
        <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center text-white font-bold">🛡</div>
        <div className="flex-1">
          <div className="font-bold">Адмін-панель RSTGO</div>
          <div className="text-white/30 text-xs">Управління користувачами</div>
        </div>
        <Link href="/dashboard" className="text-white/30 hover:text-white/60 text-sm">← Дашборд</Link>
        <button onClick={() => setAuthenticated(false)} className="text-white/20 hover:text-white/50 text-sm">Вийти</button>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Всього закладів', value: users.length, icon: '🏪', sub: `${activeCount} активних` },
            { label: 'Платні плани', value: proCount, icon: '💎', sub: `${users.length - proCount} Starter` },
            { label: 'Загальна виручка', value: `${(totalRevenue / 1000).toFixed(0)}к ₴`, icon: '💰', sub: 'через платформу' },
            { label: 'Заблоковано', value: users.filter(u => u.status === 'blocked').length, icon: '🚫', sub: 'потребують уваги' },
          ].map((s, i) => (
            <div key={i} className="bg-[#1C1A18] border border-white/8 rounded-2xl p-5">
              <div className="text-2xl mb-3">{s.icon}</div>
              <div className="font-bold text-2xl mb-0.5">{s.value}</div>
              <div className="text-white/40 text-xs">{s.label}</div>
              <div className="text-white/25 text-xs mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] bg-[#1C1A18] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-white/30 focus:outline-none placeholder:text-white/25"
            placeholder="🔍 Пошук за email, назвою або slug..." />
          <select value={filterPlan} onChange={e => setFilterPlan(e.target.value as Plan | 'all')}
            className="bg-[#1C1A18] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-white/70">
            <option value="all">Всі плани</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as UserStatus | 'all')}
            className="bg-[#1C1A18] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-white/70">
            <option value="all">Всі статуси</option>
            <option value="active">Активні</option>
            <option value="blocked">Заблоковані</option>
            <option value="pending">Очікують</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-[#1C1A18] border border-white/8 rounded-2xl overflow-hidden mb-4">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/8 text-xs text-white/30 uppercase tracking-wider">
            <span>Заклад</span>
            <span>План</span>
            <span>Статус</span>
            <span>Замовлення</span>
            <span>Дії</span>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-white/20">
              <div className="text-4xl mb-3">🔍</div>
              <p>Нічого не знайдено</p>
            </div>
          ) : (
            filtered.map(user => (
              <div key={user.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-4 border-b border-white/5 hover:bg-white/3 transition-colors items-center">
                <button onClick={() => setSelectedUser(user)} className="text-left min-w-0">
                  <div className="font-medium text-sm truncate">{user.restaurantName}</div>
                  <div className="text-white/30 text-xs truncate">{user.email}</div>
                  <div className="text-white/20 text-xs">/{user.slug} · {user.tableCount} столів</div>
                </button>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PLAN_COLORS[user.plan]}`}>{user.plan}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[user.status]}`}>{STATUS_LABELS[user.status]}</span>
                <span className="text-white/40 text-sm text-right whitespace-nowrap">{user.ordersTotal.toLocaleString()}</span>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => setSelectedUser(user)}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 text-sm flex items-center justify-center" title="Деталі">👁</button>
                  {user.status === 'blocked' ? (
                    <button onClick={() => setConfirmAction({ type: 'unblock', user })}
                      className="w-8 h-8 rounded-lg bg-green-900/30 hover:bg-green-900/50 text-green-400 text-sm flex items-center justify-center" title="Розблокувати">✓</button>
                  ) : (
                    <button onClick={() => setConfirmAction({ type: 'block', user })}
                      className="w-8 h-8 rounded-lg bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-400 text-sm flex items-center justify-center" title="Заблокувати">🚫</button>
                  )}
                  <button onClick={() => setConfirmAction({ type: 'delete', user })}
                    className="w-8 h-8 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 text-sm flex items-center justify-center" title="Видалити">✕</button>
                </div>
              </div>
            ))
          )}
        </div>
        <p className="text-white/20 text-xs text-center">{filtered.length} з {users.length} закладів</p>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-[#1C1A18] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="font-bold text-xl">{selectedUser.restaurantName}</h3>
                <p className="text-white/40 text-sm mt-0.5">{selectedUser.email}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="w-8 h-8 rounded-xl bg-white/8 text-white/40 hover:text-white flex items-center justify-center">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Slug', value: `/${selectedUser.slug}` },
                { label: 'Столів', value: String(selectedUser.tableCount) },
                { label: 'Замовлень', value: selectedUser.ordersTotal.toLocaleString() },
                { label: 'Виручка', value: `${(selectedUser.revenue / 1000).toFixed(1)}к ₴` },
                { label: 'Зареєстровано', value: selectedUser.createdAt },
                { label: 'Остання активність', value: selectedUser.lastSeen },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 rounded-xl px-3 py-2.5">
                  <div className="text-white/30 text-xs mb-0.5">{item.label}</div>
                  <div className="text-sm font-medium">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mb-5">
              <div className="text-white/30 text-xs uppercase tracking-wide mb-2">Змінити план</div>
              <div className="flex gap-2">
                {(['starter', 'pro', 'enterprise'] as Plan[]).map(p => (
                  <button key={p} onClick={() => changePlan(selectedUser.id, p)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${selectedUser.plan === p ? 'bg-[#C17F3B] text-white' : 'bg-white/8 text-white/50 hover:bg-white/15'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className="text-white/30 text-xs uppercase tracking-wide mb-2">Статус</div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${STATUS_COLORS[selectedUser.status]}`}>
                {STATUS_LABELS[selectedUser.status]}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-white/8">
              {selectedUser.status === 'blocked' ? (
                <button onClick={() => { unblockUser(selectedUser.id) }}
                  className="flex-1 py-2.5 bg-green-700/30 hover:bg-green-700/50 text-green-300 border border-green-700/30 rounded-xl text-sm font-semibold">
                  ✓ Розблокувати
                </button>
              ) : (
                <button onClick={() => setConfirmAction({ type: 'block', user: selectedUser })}
                  className="flex-1 py-2.5 bg-yellow-700/20 hover:bg-yellow-700/35 text-yellow-300 border border-yellow-700/20 rounded-xl text-sm font-semibold">
                  🚫 Заблокувати
                </button>
              )}
              <button onClick={() => setConfirmAction({ type: 'delete', user: selectedUser })}
                className="flex-1 py-2.5 bg-red-700/20 hover:bg-red-700/35 text-red-300 border border-red-700/20 rounded-xl text-sm font-semibold">
                🗑 Видалити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1A18] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="text-4xl mb-4">
              {confirmAction.type === 'delete' ? '🗑' : confirmAction.type === 'block' ? '🚫' : '✅'}
            </div>
            <h3 className="font-bold text-lg mb-2">
              {confirmAction.type === 'delete' ? 'Видалити акаунт?' :
               confirmAction.type === 'block' ? 'Заблокувати акаунт?' : 'Розблокувати акаунт?'}
            </h3>
            <p className="text-white/40 text-sm mb-6">
              <strong className="text-white/70">{confirmAction.user.restaurantName}</strong>
              {confirmAction.type === 'delete' && ' — акаунт буде видалено назавжди. Цю дію не можна відмінити.'}
              {confirmAction.type === 'block' && ' — заклад більше не матиме доступу до системи.'}
              {confirmAction.type === 'unblock' && ' — заклад знову отримає повний доступ.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 py-3 border border-white/10 rounded-xl text-sm font-medium text-white/60 hover:bg-white/5">
                Скасувати
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'delete') deleteUser(confirmAction.user.id)
                  else if (confirmAction.type === 'block') blockUser(confirmAction.user.id)
                  else unblockUser(confirmAction.user.id)
                }}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold ${
                  confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700 text-white' :
                  confirmAction.type === 'block' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                  'bg-green-600 hover:bg-green-700 text-white'
                }`}>
                {confirmAction.type === 'delete' ? 'Видалити' : confirmAction.type === 'block' ? 'Заблокувати' : 'Розблокувати'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
