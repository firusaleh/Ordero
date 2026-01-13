const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkRestaurant() {
  try {
    // Find demo restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: 'demo-restaurant' },
      include: {
        settings: true
      }
    })
    
    if (restaurant) {
      console.log('Restaurant gefunden:')
      console.log('Name:', restaurant.name)
      console.log('Country:', restaurant.country)
      console.log('City:', restaurant.city)
      console.log('Settings:')
      if (restaurant.settings) {
        console.log('  Currency:', restaurant.settings.currency)
        console.log('  Payment Region:', restaurant.settings.paymentRegion)
        console.log('  Timezone:', restaurant.settings.timezone)
      }
    } else {
      console.log('Restaurant nicht gefunden')
    }
  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRestaurant()