import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create the demo restaurant if it doesn't exist
  await prisma.restaurant.upsert({
    where: { slug: 'demo' },
    create: {
      slug: 'demo',
      name: 'Ватра',
      staffPin: '1234',
      tableCount: 10,
      currency: 'UAH',
      primaryColor: '#C17F3B',
    },
    update: {},
  })

  console.log('✅ Seeded restaurant: demo')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
