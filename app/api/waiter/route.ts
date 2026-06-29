import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/waiter  { slug, table, guestName }
export async function POST(req: NextRequest) {
  const { slug, table, guestName } = await req.json()
  const restaurant = await prisma.restaurant.findUnique({ where: { slug } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const call = await prisma.waiterCall.create({
    data: { restaurantId: restaurant.id, tableNumber: table, guestName },
  })
  return NextResponse.json(call)
}

// GET /api/waiter?slug=xxx
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json([])

  const restaurant = await prisma.restaurant.findUnique({ where: { slug } })
  if (!restaurant) return NextResponse.json([])

  const calls = await prisma.waiterCall.findMany({
    where: { restaurantId: restaurant.id, resolved: false },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(calls)
}

// PATCH /api/waiter  { id }  → marks resolved
export async function PATCH(req: NextRequest) {
  const { id } = await req.json()
  const call = await prisma.waiterCall.update({ where: { id }, data: { resolved: true } })
  return NextResponse.json(call)
}
