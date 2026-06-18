import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── TYPES ───────────────────────────────────────────────

export type CartItem = { id: string; name: string; price: number; emoji: string }

export type TableSession = {
  id?: string
  restaurant_slug: string
  table_number: number
  guest_name: string
  cart: CartItem[]
  updated_at?: string
}

export type OrderItem = { id: string; name: string; price: number; emoji: string; guest: string }

export type OrderDoc = {
  id: string
  restaurant_slug: string
  table_number: number
  items: OrderItem[]
  total: number
  done: boolean
  created_at: string
}

export type WaiterCallDoc = {
  id: string
  restaurant_slug: string
  table_number: number
  guest_name: string
  created_at: string
  resolved: boolean
}

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

// ─── TABLE SESSIONS ───────────────────────────────────────

export function subscribeTableSessions(
  slug: string,
  tableNumber: number,
  callback: (sessions: TableSession[]) => void
): () => void {
  // Initial fetch
  const fetchSessions = async () => {
    const { data } = await supabase
      .from('table_sessions')
      .select('*')
      .eq('restaurant_slug', slug)
      .eq('table_number', tableNumber)
    if (data) callback(data as TableSession[])
  }
  fetchSessions()

  // Realtime subscription
  const channel = supabase
    .channel(`table_sessions_${slug}_${tableNumber}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'table_sessions',
      filter: `restaurant_slug=eq.${slug}`,
    }, () => fetchSessions())
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

export async function upsertTableSession(
  slug: string, tableNumber: number, guestName: string, cart: CartItem[]
) {
  await supabase.from('table_sessions').upsert({
    restaurant_slug: slug,
    table_number: tableNumber,
    guest_name: guestName,
    cart,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'restaurant_slug,table_number,guest_name' })
}

export async function deleteTableSession(slug: string, tableNumber: number, guestName: string) {
  await supabase.from('table_sessions')
    .delete()
    .eq('restaurant_slug', slug)
    .eq('table_number', tableNumber)
    .eq('guest_name', guestName)
}

// ─── ORDERS ───────────────────────────────────────────────

export function subscribeOrders(
  slug: string,
  callback: (orders: OrderDoc[]) => void
): () => void {
  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders_rt')
      .select('*')
      .eq('restaurant_slug', slug)
      .order('created_at', { ascending: false })
    if (data) callback(data as OrderDoc[])
  }
  fetchOrders()

  const channel = supabase
    .channel(`orders_rt_${slug}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders_rt',
      filter: `restaurant_slug=eq.${slug}`,
    }, () => fetchOrders())
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

export async function createOrder(
  slug: string, tableNumber: number, items: OrderItem[], total: number
) {
  const { error } = await supabase.from('orders_rt').insert({
    restaurant_slug: slug,
    table_number: tableNumber,
    items,
    total,
    done: false,
  })
  if (error) throw error
}

export async function markOrderDone(orderId: string) {
  await supabase.from('orders_rt').update({ done: true }).eq('id', orderId)
}

// ─── WAITER CALLS ─────────────────────────────────────────

export function subscribeWaiterCalls(
  slug: string,
  callback: (calls: WaiterCallDoc[]) => void
): () => void {
  const fetchCalls = async () => {
    const { data } = await supabase
      .from('waiter_calls_rt')
      .select('*')
      .eq('restaurant_slug', slug)
      .eq('resolved', false)
      .order('created_at', { ascending: false })
    if (data) callback(data as WaiterCallDoc[])
  }
  fetchCalls()

  const channel = supabase
    .channel(`waiter_calls_rt_${slug}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'waiter_calls_rt',
      filter: `restaurant_slug=eq.${slug}`,
    }, () => fetchCalls())
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

export async function createWaiterCall(slug: string, tableNumber: number, guestName: string) {
  const { error } = await supabase.from('waiter_calls_rt').insert({
    restaurant_slug: slug,
    table_number: tableNumber,
    guest_name: guestName,
    resolved: false,
  })
  if (error) throw error
}

export async function resolveWaiterCall(callId: string) {
  await supabase.from('waiter_calls_rt').update({ resolved: true }).eq('id', callId)
}

// ─── MENU (stored in Supabase as JSON in a restaurants table) ─────────────

export function subscribeMenu(
  slug: string,
  callback: (categories: MenuCategoryDoc[]) => void
): () => void {
  const fetchMenu = async () => {
    const { data } = await supabase
      .from('restaurants_menu')
      .select('menu')
      .eq('slug', slug)
      .single()
    if (data?.menu) callback(data.menu as MenuCategoryDoc[])
    else callback([])
  }
  fetchMenu()

  const channel = supabase
    .channel(`menu_${slug}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'restaurants_menu',
      filter: `slug=eq.${slug}`,
    }, () => fetchMenu())
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

export async function saveMenu(slug: string, categories: MenuCategoryDoc[]) {
  await supabase.from('restaurants_menu').upsert({
    slug,
    menu: categories,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'slug' })
}

// ─── STORAGE (photos) ─────────────────────────────────────

export async function uploadMenuItemImage(restaurantId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const fileName = `${restaurantId}/menu/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('restaurant-images')
    .upload(fileName, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('restaurant-images').getPublicUrl(fileName)
  return data.publicUrl
}

export async function deleteMenuItemImage(url: string): Promise<void> {
  try {
    const path = url.split('/restaurant-images/')[1]
    if (!path) return
    await supabase.storage.from('restaurant-images').remove([path])
  } catch { }
}
