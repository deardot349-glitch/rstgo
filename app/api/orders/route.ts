import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/orders  { slug, table, items, total }
export async function POST(req: NextRequest) {
  const { slug, table, items, total } = await req.json()
  const restaurant = await prisma.restaurant.findUnique({ where: { slug } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const order = await prisma.order.create({
    data: { restaurantId: restaurant.id, tableNumber: table, items, total },
  })
  return NextResponse.json(order)
}

// GET /api/orders?slug=xxx
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json([])

  const restaurant = await prisma.restaurant.findUnique({ where: { slug } })
  if (!restaurant) return NextResponse.json([])

  const orders = await prisma.order.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(orders)
}

// PATCH /api/orders  { id }  → marks done
export async function PATCH(req: NextRequest) {
  const { id } = await req.json()
  const order = await prisma.order.update({ where: { id }, data: { done: true } })
  return NextResponse.json(order)
}
