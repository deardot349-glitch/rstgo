'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Огляд', icon: '📊' },
  { href: '/dashboard/menu', label: 'Меню', icon: '🍽' },
  { href: '/dashboard/tables', label: 'Столи', icon: '🪑' },
  { href: '/dashboard/settings', label: 'Налаштування', icon: '⚙️' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-[#1C1A18] text-white fixed top-0 left-0 h-full z-40">
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#C17F3B] rounded-lg flex items-center justify-center font-bold text-sm">R</div>
            <span className="font-display font-bold text-lg">RSTGO</span>
          </Link>
          <div className="mt-3 text-xs text-white/40 font-medium">Ресторан «Ватра»</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-[#C17F3B] text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-4">
          <Link href="/demo/table/1" target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-colors">
            <span>👁</span> Переглянути меню
          </Link>
          <Link href="/demo/staff"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-colors">
            <span>👨‍🍳</span> Панель персоналу
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/8 transition-colors">
            <span>🚪</span> Вийти
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#1C1A18] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#C17F3B] rounded-lg flex items-center justify-center font-bold text-xs">R</div>
          <span className="font-display font-bold">RSTGO</span>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1C1A18] border-t border-white/10 flex">
        {NAV.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              pathname === item.href ? 'text-[#C17F3B]' : 'text-white/50'
            }`}>
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      {/* Main content */}
      <main className="md:ml-60 flex-1 min-h-screen pt-14 md:pt-0 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
