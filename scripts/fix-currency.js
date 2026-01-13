const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixCurrency() {
  try {
    // Find demo restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: 'demo-restaurant' },
      include: {
        settings: true
      }
    })
    
    if (!restaurant) {
      console.log('Restaurant nicht gefunden')
      return
    }
    
    console.log('Restaurant gefunden:')
    console.log('Name:', restaurant.name)
    console.log('Country:', restaurant.country)
    console.log('Current Settings:', restaurant.settings)
    
    // Bestimme die richtige Währung basierend auf dem Land
    const currencyMap = {
      'JO': 'JOD',
      'SA': 'SAR',
      'AE': 'AED',
      'KW': 'KWD',
      'BH': 'BHD',
      'QA': 'QAR',
      'OM': 'OMR',
      'EG': 'EGP',
      'LB': 'LBP',
      'DE': 'EUR',
      'FR': 'EUR',
      'IT': 'EUR',
      'ES': 'EUR',
      'GB': 'GBP',
      'US': 'USD',
      'CH': 'CHF'
    }
    
    const correctCurrency = currencyMap[restaurant.country] || 'EUR'
    console.log('Correct currency should be:', correctCurrency)
    
    if (restaurant.country === 'JO') {
      console.log('\nUpdating currency to JOD for Jordan...')
      
      // Update or create settings
      const updatedSettings = await prisma.restaurantSettings.upsert({
        where: { restaurantId: restaurant.id },
        update: {
          currency: 'JOD',
          timezone: 'Asia/Amman'
        },
        create: {
          restaurantId: restaurant.id,
          currency: 'JOD',
          timezone: 'Asia/Amman'
        }
      })
      
      console.log('Settings nach Update:', updatedSettings)
      console.log('✅ Währung erfolgreich auf JOD gesetzt!')
    }
    
  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCurrency()