import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Types ──

export type CartItem = { id: string; name: string; price: number; emoji: string }

export type TableSession = {
  id: string
  restaurant_slug: string
  table_number: number
  guest_name: string
  cart: CartItem[]
  updated_at: string
}

export type OrderItem = CartItem & { guest: string }

export type Order = {
  id: string
  restaurant_slug: string
  table_number: number
  items: OrderItem[]
  total: number
  done: boolean
  created_at: string
}

export type WaiterCall = {
  id: string
  restaurant_slug: string
  table_number: number
  guest_name: string
  resolved: boolean
  created_at: string
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

// ── Table Sessions ──

export function subscribeTableSessions(
  slug: string,
  tableNumber: number,
  callback: (sessions: TableSession[]) => void
) {
  // Initial fetch
  supabase
    .from('table_sessions')
    .select('*')
    .eq('restaurant_slug', slug)
    .eq('table_number', tableNumber)
    .then(({ data }) => callback((data as TableSession[]) || []))

  // Realtime subscription
  const channel = supabase
    .channel(`sessions-${slug}-${tableNumber}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'table_sessions',
      filter: `restaurant_slug=eq.${slug}`,
    }, () => {
      supabase
        .from('table_sessions')
        .select('*')
        .eq('restaurant_slug', slug)
        .eq('table_number', tableNumber)
        .then(({ data }) => callback((data as TableSession[]) || []))
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
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
  await supabase.from('table_sessions').delete()
    .eq('restaurant_slug', slug)
    .eq('table_number', tableNumber)
    .eq('guest_name', guestName)
}

// ── Orders ──

export function subscribeOrders(slug: string, callback: (orders: Order[]) => void) {
  supabase
    .from('orders_rt')
    .select('*')
    .eq('restaurant_slug', slug)
    .order('created_at', { ascending: false })
    .then(({ data }) => callback((data as Order[]) || []))

  const channel = supabase
    .channel(`orders-${slug}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders_rt',
      filter: `restaurant_slug=eq.${slug}`,
    }, () => {
      supabase
        .from('orders_rt')
        .select('*')
        .eq('restaurant_slug', slug)
        .order('created_at', { ascending: false })
        .then(({ data }) => callback((data as Order[]) || []))
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
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
    created_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function markOrderDone(orderId: string) {
  await supabase.from('orders_rt').update({ done: true }).eq('id', orderId)
}

// ── Waiter Calls ──

export function subscribeWaiterCalls(slug: string, callback: (calls: WaiterCall[]) => void) {
  supabase
    .from('waiter_calls_rt')
    .select('*')
    .eq('restaurant_slug', slug)
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .then(({ data }) => callback((data as WaiterCall[]) || []))

  const channel = supabase
    .channel(`waiter-${slug}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'waiter_calls_rt',
      filter: `restaurant_slug=eq.${slug}`,
    }, () => {
      supabase
        .from('waiter_calls_rt')
        .select('*')
        .eq('restaurant_slug', slug)
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .then(({ data }) => callback((data as WaiterCall[]) || []))
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export async function createWaiterCall(slug: string, tableNumber: number, guestName: string) {
  const { error } = await supabase.from('waiter_calls_rt').insert({
    restaurant_slug: slug,
    table_number: tableNumber,
    guest_name: guestName,
    resolved: false,
    created_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function resolveWaiterCall(callId: string) {
  await supabase.from('waiter_calls_rt').update({ resolved: true }).eq('id', callId)
}

// ── Menu (stored in Supabase DB as JSON) ──

export async function saveMenu(slug: string, categories: MenuCategoryDoc[]) {
  await supabase.from('restaurant_menus').upsert({
    restaurant_slug: slug,
    menu: categories,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'restaurant_slug' })
}

export function subscribeMenu(slug: string, callback: (categories: MenuCategoryDoc[]) => void) {
  supabase
    .from('restaurant_menus')
    .select('menu')
    .eq('restaurant_slug', slug)
    .single()
    .then(({ data }) => {
      if (data?.menu) callback(data.menu as MenuCategoryDoc[])
    })

  const channel = supabase
    .channel(`menu-${slug}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'restaurant_menus',
      filter: `restaurant_slug=eq.${slug}`,
    }, ({ new: row }) => {
      const r = row as { menu: MenuCategoryDoc[] }
      if (r?.menu) callback(r.menu)
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}
