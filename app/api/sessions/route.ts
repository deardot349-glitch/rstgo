import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/sessions?slug=xxx&table=1
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  const table = Number(req.nextUrl.searchParams.get('table'))
  if (!slug || !table) return NextResponse.json([], { status: 200 })

  const restaurant = await prisma.restaurant.findUnique({ where: { slug } })
  if (!restaurant) return NextResponse.json([], { status: 200 })

  const sessions = await prisma.tableSession.findMany({
    where: { restaurantId: restaurant.id, tableNumber: table },
  })
  return NextResponse.json(sessions)
}

// POST /api/sessions  { slug, table, guestName, cart }
export async function POST(req: NextRequest) {
  const { slug, table, guestName, cart } = await req.json()
  const restaurant = await prisma.restaurant.findUnique({ where: { slug } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const session = await prisma.tableSession.upsert({
    where: { restaurantId_tableNumber_guestName: { restaurantId: restaurant.id, tableNumber: table, guestName } },
    create: { restaurantId: restaurant.id, tableNumber: table, guestName, cart },
    update: { cart },
  })
  return NextResponse.json(session)
}

// DELETE /api/sessions?slug=xxx&table=1&guest=Mykola
export async function DELETE(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  const table = Number(req.nextUrl.searchParams.get('table'))
  const guestName = req.nextUrl.searchParams.get('guest')
  if (!slug || !table || !guestName) return NextResponse.json({ ok: false })

  const restaurant = await prisma.restaurant.findUnique({ where: { slug } })
  if (!restaurant) return NextResponse.json({ ok: false })

  await prisma.tableSession.deleteMany({
    where: { restaurantId: restaurant.id, tableNumber: table, guestName },
  })
  return NextResponse.json({ ok: true })
}
