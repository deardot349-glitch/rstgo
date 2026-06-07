'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-[#C17F3B] rounded-xl flex items-center justify-center text-white font-bold">R</div>
            <span className="font-display font-bold text-2xl">RSTGO</span>
          </Link>
          <h1 className="font-display text-3xl font-bold mb-2">Ласкаво просимо</h1>
          <p className="text-[#6B6560]">Увійдіть до панелі керування</p>
        </div>

        <div className="bg-white border border-[#E8E0D4] rounded-2xl p-8 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input type="email" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none text-sm"
                placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Пароль</label>
              <input type="password" value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 border border-[#E8E0D4] rounded-xl focus:border-[#C17F3B] focus:outline-none text-sm"
                placeholder="••••••••" />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button onClick={handleLogin} disabled={loading}
              className="w-full bg-[#C17F3B] hover:bg-[#9A6328] text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60">
              {loading ? 'Входимо...' : 'Увійти'}
            </button>
          </div>
          <div className="mt-6 text-center">
            <a href="#" className="text-sm text-[#C17F3B] hover:underline">Забули пароль?</a>
          </div>
        </div>

        <p className="text-center text-sm text-[#6B6560] mt-6">
          Ще немає акаунту?{' '}
          <Link href="/signup" className="text-[#C17F3B] font-medium hover:underline">Зареєструватись безкоштовно</Link>
        </p>
      </div>
    </div>
  )
}
