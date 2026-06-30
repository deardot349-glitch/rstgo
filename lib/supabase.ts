// ─── DB client via API routes (Neon PostgreSQL + Prisma under the hood) ───────
// This file replaces the old Supabase client.
// All DB operations go through Next.js API routes so Prisma runs server-side.

export type CartItem = { id: string; name: string; price: number; emoji: string }

export type TableSession = {
  id: string
  restaurantId: string
  tableNumber: number
  guestName: string
  guest_name: string
  cart: CartItem[]
  updatedAt: string
}

export type OrderItem = CartItem & { guest: string }

export type MenuItemDoc = {
  id: string
  name: string
  desc: string
  price: number
  available: boolean
  imageUrl?: string
}

export type MenuCategoryDoc = {
  id: string
  name: string
  emoji: string
  items: MenuItemDoc[]
}

export type OrderDoc = {
  id: string
  table_number: number
  items: OrderItem[]
  total: number
  done: boolean
  created_at: string
}

export type WaiterCallDoc = {
  id: string
  table_number: number
  guest_name: string
  resolved: boolean
  created_at: string
}

// ─── Polling helper (replaces Supabase realtime) ─────────────────────────────
function poll(fn: () => void, intervalMs = 3000): () => void {
  fn()
  const id = setInterval(fn, intervalMs)
  return () => clearInterval(id)
}

// ─── Table Sessions ───────────────────────────────────────────────────────────

export function subscribeTableSessions(
  slug: string,
  tableNumber: number,
  callback: (sessions: TableSession[]) => void
): () => void {
  return poll(async () => {
    const res = await fetch(`/api/sessions?slug=${slug}&table=${tableNumber}`)
    if (res.ok) {
      const data = await res.json()
      callback(data.map((s: any) => ({
        ...s,
        guest_name: s.guestName,
        cart: s.cart ?? [],
      })))
    }
  })
}

export async function upsertTableSession(
  slug: string, tableNumber: number, guestName: string, cart: CartItem[]
) {
  await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, table: tableNumber, guestName, cart }),
  })
}

export async function deleteTableSession(slug: string, tableNumber: number, guestName: string) {
  await fetch(`/api/sessions?slug=${slug}&table=${tableNumber}&guest=${encodeURIComponent(guestName)}`, {
    method: 'DELETE',
  })
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(
  slug: string, tableNumber: number, items: OrderItem[], total: number
) {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, table: tableNumber, items, total }),
  })
  if (!res.ok) throw new Error('Failed to create order')
}

export function subscribeOrders(
  slug: string,
  callback: (orders: OrderDoc[]) => void
): () => void {
  return poll(async () => {
    const res = await fetch(`/api/orders?slug=${slug}`)
    if (res.ok) {
      const data = await res.json()
      callback(data.map((o: any) => ({
        id: o.id,
        table_number: o.tableNumber,
        items: o.items,
        total: o.total,
        done: o.done,
        created_at: o.createdAt,
      })))
    }
  })
}

export async function markOrderDone(orderId: string) {
  await fetch('/api/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: orderId }),
  })
}

// ─── Waiter Calls ─────────────────────────────────────────────────────────────

export async function createWaiterCall(slug: string, tableNumber: number, guestName: string) {
  const res = await fetch('/api/waiter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, table: tableNumber, guestName }),
  })
  if (!res.ok) throw new Error('Failed to call waiter')
}

export function subscribeWaiterCalls(
  slug: string,
  callback: (calls: WaiterCallDoc[]) => void
): () => void {
  return poll(async () => {
    const res = await fetch(`/api/waiter?slug=${slug}`)
    if (res.ok) {
      const data = await res.json()
      callback(data.map((c: any) => ({
        id: c.id,
        table_number: c.tableNumber,
        guest_name: c.guestName,
        resolved: c.resolved,
        created_at: c.createdAt,
      })))
    }
  })
}

export async function resolveWaiterCall(callId: string) {
  await fetch('/api/waiter', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: callId }),
  })
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export function subscribeMenu(
  slug: string,
  callback: (categories: MenuCategoryDoc[]) => void
): () => void {
  return poll(async () => {
    const res = await fetch(`/api/menu?slug=${slug}`)
    if (res.ok) {
      const data = await res.json()
      if (data && data.length > 0) {
        // Normalize: DB stores `description`, UI uses `desc`
        const normalized = data.map((cat: any) => ({
          ...cat,
          items: cat.items.map((item: any) => ({
            ...item,
            desc: item.description ?? item.desc ?? '',
          })),
        }))
        callback(normalized)
      }
    }
  }, 5000) // menu changes less often, poll every 5s
}

export async function saveMenu(slug: string, categories: MenuCategoryDoc[]) {
  const res = await fetch('/api/menu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, categories }),
  })
  if (!res.ok) throw new Error('Failed to save menu')
}

// ─── Image upload (uses Cloudinary from flower12's setup) ────────────────────
export async function uploadMenuItemImage(_restaurantId: string, file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: form })
  if (!res.ok) throw new Error('Upload failed')
  const { url } = await res.json()
  return url
}

export async function deleteMenuItemImage(_url: string): Promise<void> {
  // No-op for now; images stay in Cloudinary
}
