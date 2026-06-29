import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/menu?slug=xxx  → returns categories with items
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json([])

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      menuCategories: {
        orderBy: { sortOrder: 'asc' },
        include: {
          items: { orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  })
  if (!restaurant) return NextResponse.json([])
  return NextResponse.json(restaurant.menuCategories)
}

// POST /api/menu  { slug, categories }  → replaces entire menu
export async function POST(req: NextRequest) {
  const { slug, categories } = await req.json()

  const restaurant = await prisma.restaurant.findUnique({ where: { slug } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  // Delete all existing categories (cascade deletes items)
  await prisma.menuCategory.deleteMany({ where: { restaurantId: restaurant.id } })

  // Recreate from the full categories array
  for (let ci = 0; ci < categories.length; ci++) {
    const cat = categories[ci]
    const createdCat = await prisma.menuCategory.create({
      data: {
        id: cat.id,
        restaurantId: restaurant.id,
        name: cat.name,
        emoji: cat.emoji,
        sortOrder: ci,
      },
    })
    for (let ii = 0; ii < (cat.items || []).length; ii++) {
      const item = cat.items[ii]
      await prisma.menuItem.create({
        data: {
          id: item.id,
          categoryId: createdCat.id,
          name: item.name,
          description: item.desc || item.description || '',
          price: item.price,
          available: item.available ?? true,
          imageUrl: item.imageUrl || null,
          sortOrder: ii,
        },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
