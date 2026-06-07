'use client'
import { useState } from 'react'

const TABLE_COUNT = 10
const SLUG = 'vatra-restaurant'

export default function TablesPage() {
  const [copiedTable, setCopiedTable] = useState<number | null>(null)
  const [tableCount, setTableCount] = useState(TABLE_COUNT)
  const [editingCount, setEditingCount] = useState(false)
  const [tempCount, setTempCount] = useState(String(TABLE_COUNT))

  const tableUrl = (n: number) => `https://rstgo.app/${SLUG}/table/${n}`
  const staffUrl = `https://rstgo.app/${SLUG}/staff`

  const copyUrl = async (url: string, tableNum: number) => {
    await navigator.clipboard.writeText(url)
    setCopiedTable(tableNum)
    setTimeout(() => setCopiedTable(null), 2000)
  }

  const saveTableCount = () => {
    const n = Math.max(1, Math.min(200, Number(tempCount)))
    setTableCount(n)
    setEditingCount(false)
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Столи</h1>
          <p className="text-[#6B6560] text-sm">Посилання для NFC-тегів та QR-кодів</p>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1C1A18] text-white rounded-xl text-sm font-semibold hover:bg-[#2D2A26] transition-colors">
          🖨 Роздрукувати всі QR
        </button>
      </div>

      {/* Staff link */}
      <div className="bg-[#1C1A18] rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="w-10 h-10 bg-[#C17F3B] rounded-xl flex items-center justify-center text-white font-bold shrink-0">👨‍🍳</div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-sm mb-0.5">Панель персоналу</div>
          <div className="text-white/50 text-xs font-mono truncate">{staffUrl}</div>
          <div className="text-white/40 text-xs mt-1">Захищено PIN-кодом · Видно тільки персоналу</div>
        </div>
        <button onClick={() => navigator.clipboard.writeText(staffUrl)}
          className="shrink-0 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors">
          Копіювати
        </button>
      </div>

      {/* Table count control */}
      <div className="bg-white border border-[#E8E0D4] rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="flex-1">
          <div className="font-semibold text-sm mb-0.5">Кількість столів</div>
          <div className="text-[#6B6560] text-xs">Визначає скільки унікальних посилань буде активних</div>
        </div>
        {editingCount ? (
          <div className="flex items-center gap-2">
            <input type="number" min="1" max="200" value={tempCount}
              onChange={e => setTempCount(e.target.value)}
              className="w-20 px-3 py-2 border border-[#C17F3B] rounded-xl text-center font-bold focus:outline-none" />
            <button onClick={saveTableCount}
              className="px-4 py-2 bg-[#C17F3B] text-white rounded-xl text-sm font-semibold">Зберегти</button>
            <button onClick={() => { setTempCount(String(tableCount)); setEditingCount(false) }}
              className="px-3 py-2 border border-[#E8E0D4] rounded-xl text-sm">✕</button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-bold text-[#C17F3B]">{tableCount}</span>
            <button onClick={() => setEditingCount(true)}
              className="px-4 py-2 border border-[#E8E0D4] rounded-xl text-sm font-medium hover:border-[#C17F3B] transition-colors">Змінити</button>
          </div>
        )}
      </div>

      {/* NFC Instructions */}
      <div className="bg-[#F5E9D8] border border-[#E8C99A] rounded-2xl p-5 mb-6">
        <div className="font-semibold text-[#9A6328] mb-2">📲 Як налаштувати NFC-теги</div>
        <ol className="text-sm text-[#7A5520] space-y-1 list-decimal list-inside">
          <li>Придбайте NFC NTAG213 наклейки (AliExpress, ~5–15 ₴/шт)</li>
          <li>Завантажте додаток <strong>NFC Tools</strong> або <strong>NFC TagWriter by NXP</strong></li>
          <li>Відкрийте додаток, виберіть &ldquo;Write&rdquo; → &ldquo;URL&rdquo; → вставте посилання зі списку нижче</li>
          <li>Прикладіть телефон до NFC-тегу — посилання записано</li>
          <li>Наклейте тег на стіл або підставку</li>
        </ol>
      </div>

      {/* Tables grid */}
      <div className="grid sm:grid-cols-2 gap-3">
        {Array.from({ length: tableCount }, (_, i) => i + 1).map(n => {
          const url = tableUrl(n)
          const isCopied = copiedTable === n
          return (
            <div key={n} className="bg-white border border-[#E8E0D4] rounded-2xl p-4 hover:border-[#C17F3B] transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#F5E9D8] rounded-xl flex items-center justify-center font-display font-bold text-[#C17F3B]">{n}</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">Стіл №{n}</div>
                  <div className="text-xs text-[#9A9490]">Унікальне посилання</div>
                </div>
                <div className="flex gap-1.5">
                  <a href={url} target="_blank" rel="noreferrer"
                    className="w-8 h-8 rounded-lg bg-[#FAF8F5] hover:bg-[#F0E8DC] flex items-center justify-center text-sm transition-colors" title="Відкрити">
                    👁
                  </a>
                  <button onClick={() => copyUrl(url, n)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${isCopied ? 'bg-[#3A7D58] text-white' : 'bg-[#FAF8F5] hover:bg-[#F0E8DC]'}`}
                    title="Копіювати">
                    {isCopied ? '✓' : '📋'}
                  </button>
                </div>
              </div>
              <div className="bg-[#FAF8F5] rounded-xl px-3 py-2">
                <div className="text-xs font-mono text-[#9A9490] truncate">{url}</div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-[#9A9490] text-center mt-6">
        Кожен стіл має унікальне посилання. Замовлення з різних столів не перетинаються.
      </p>
    </div>
  )
}
