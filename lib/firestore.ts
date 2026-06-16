import { db } from './firebase'
import {
  collection, doc, setDoc, deleteDoc, addDoc, updateDoc,
  onSnapshot, query, where, orderBy, serverTimestamp,
  Timestamp,
} from 'firebase/firestore'

export type CartItem = { id: string; name: string; price: number; emoji: string }
export type TableSession = { guest_name: string; cart: CartItem[]; updated_at?: Timestamp }
export type OrderItem = { id: string; name: string; price: number; emoji: string; guest: string }
export type OrderDoc = {
  id: string
  restaurant_slug: string
  table_number: number
  items: OrderItem[]
  total: number
  done: boolean
  created_at: Timestamp
}
export type WaiterCallDoc = {
  id: string
  restaurant_slug: string
  table_number: number
  guest_name: string
  created_at: Timestamp
  resolved: boolean
}

// ── Table sessions ──

export function subscribeTableSessions(
  slug: string,
  tableNumber: number,
  callback: (sessions: TableSession[]) => void
) {
  // Simple query — no composite index needed
  const q = query(
    collection(db, 'table_sessions'),
    where('restaurant_slug', '==', slug),
    where('table_number', '==', tableNumber),
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data() as TableSession))
  }, err => console.error('table_sessions error:', err))
}

export async function upsertTableSession(
  slug: string, tableNumber: number, guestName: string, cart: CartItem[]
) {
  const id = `${slug}_${tableNumber}_${guestName}`
  await setDoc(doc(db, 'table_sessions', id), {
    restaurant_slug: slug,
    table_number: tableNumber,
    guest_name: guestName,
    cart,
    updated_at: serverTimestamp(),
  })
}

export async function deleteTableSession(slug: string, tableNumber: number, guestName: string) {
  const id = `${slug}_${tableNumber}_${guestName}`
  await deleteDoc(doc(db, 'table_sessions', id))
}

// ── Orders ──
// NOTE: uses only where() — no orderBy() to avoid needing a composite index.
// We sort client-side instead.

export function subscribeOrders(slug: string, callback: (orders: OrderDoc[]) => void) {
  const q = query(
    collection(db, 'orders_rt'),
    where('restaurant_slug', '==', slug),
  )
  return onSnapshot(q, snap => {
    const orders = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as OrderDoc))
      .sort((a, b) => {
        // Sort newest first, client-side
        const aTime = a.created_at?.toDate?.()?.getTime() ?? 0
        const bTime = b.created_at?.toDate?.()?.getTime() ?? 0
        return bTime - aTime
      })
    callback(orders)
  }, err => console.error('orders_rt error:', err))
}

export async function createOrder(
  slug: string, tableNumber: number, items: OrderItem[], total: number
) {
  await addDoc(collection(db, 'orders_rt'), {
    restaurant_slug: slug,
    table_number: tableNumber,
    items,
    total,
    done: false,
    created_at: serverTimestamp(),
  })
}

export async function markOrderDone(orderId: string) {
  await updateDoc(doc(db, 'orders_rt', orderId), { done: true })
}

// ── Waiter calls ──
// NOTE: uses only where('restaurant_slug') — no orderBy or resolved filter
// to avoid composite index. We filter resolved client-side.

export function subscribeWaiterCalls(slug: string, callback: (calls: WaiterCallDoc[]) => void) {
  const q = query(
    collection(db, 'waiter_calls_rt'),
    where('restaurant_slug', '==', slug),
  )
  return onSnapshot(q, snap => {
    const calls = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as WaiterCallDoc))
      .filter(c => !c.resolved)
      .sort((a, b) => {
        const aTime = a.created_at?.toDate?.()?.getTime() ?? 0
        const bTime = b.created_at?.toDate?.()?.getTime() ?? 0
        return bTime - aTime
      })
    callback(calls)
  }, err => console.error('waiter_calls_rt error:', err))
}

export async function createWaiterCall(slug: string, tableNumber: number, guestName: string) {
  await addDoc(collection(db, 'waiter_calls_rt'), {
    restaurant_slug: slug,
    table_number: tableNumber,
    guest_name: guestName,
    resolved: false,
    created_at: serverTimestamp(),
  })
}

export async function resolveWaiterCall(callId: string) {
  await updateDoc(doc(db, 'waiter_calls_rt', callId), { resolved: true })
}

// ── Menu ──

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

export function subscribeMenu(slug: string, callback: (categories: MenuCategoryDoc[]) => void) {
  return onSnapshot(doc(db, 'restaurants', slug), snap => {
    const data = snap.data()
    callback((data?.menu as MenuCategoryDoc[]) || [])
  }, err => console.error('menu error:', err))
}

export async function saveMenu(slug: string, categories: MenuCategoryDoc[]) {
  await setDoc(doc(db, 'restaurants', slug), { menu: categories }, { merge: true })
}
