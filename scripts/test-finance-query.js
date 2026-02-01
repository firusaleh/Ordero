const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testFinanceQuery() {
  try {
    console.log('🔍 Teste die exakte Finanz-Abfrage...\n')

    // Aktueller Monat
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    console.log(`Zeitraum: ${startOfMonth.toLocaleDateString('de-DE')} - ${endOfMonth.toLocaleDateString('de-DE')}\n`)

    // Exakte Query wie in finance/page.tsx
    const restaurants = await prisma.restaurant.findMany({
      include: {
        owner: {
          select: {
            email: true,
            name: true
          }
        },
        orders: {
          where: {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth
            },
            // Nur abgeschlossene/bezahlte Bestellungen zählen (CONFIRMED, READY, DELIVERED, COMPLETED)
            AND: [
              {
                OR: [
                  { status: { in: ['CONFIRMED', 'READY', 'DELIVERED', 'COMPLETED'] } },
                  { paymentStatus: 'PAID' }
                ]
              }
            ]
          },
          select: {
            id: true,
            total: true,
            createdAt: true,
            paymentMethod: true,
            status: true,
            paymentStatus: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log(`=== ${restaurants.length} RESTAURANTS GEFUNDEN ===\n`)
    
    restaurants.forEach(restaurant => {
      console.log(`📍 ${restaurant.name}`)
      console.log(`   Plan: ${restaurant.plan || 'NONE'}`)
      console.log(`   Land: ${restaurant.country || 'DE'}`)
      console.log(`   Bestellungen diesen Monat: ${restaurant.orders.length}`)
      
      if (restaurant.orders.length > 0) {
        console.log(`   Bestellungen:`)
        restaurant.orders.forEach(order => {
          console.log(`     - Status: ${order.status}, Payment: ${order.paymentStatus}, Total: ${order.total}`)
        })
      }
      
      // Gebührenberechnung
      let orderRate = 0
      if (restaurant.country === 'JO') {
        if (restaurant.plan?.includes('PAY_PER_ORDER') || restaurant.plan === 'TRIAL') {
          orderRate = 0.10
        }
      } else {
        if (restaurant.plan?.includes('PAY_PER_ORDER') || restaurant.plan === 'TRIAL') {
          orderRate = 0.45
        }
      }
      
      const fees = restaurant.orders.length * orderRate
      if (fees > 0) {
        console.log(`   💰 Gebühren: €${fees.toFixed(2)} (${restaurant.orders.length} × €${orderRate})`)
      }
      console.log('')
    })

    // Test ohne Zeitfilter
    console.log('\n=== TEST: ALLE BESTELLUNGEN OHNE ZEITFILTER ===\n')
    const allTimeOrders = await prisma.order.count({
      where: {
        AND: [
          {
            OR: [
              { status: { in: ['CONFIRMED', 'READY', 'DELIVERED', 'COMPLETED'] } },
              { paymentStatus: 'PAID' }
            ]
          }
        ]
      }
    })
    
    console.log(`Gesamt gültige Bestellungen (alle Zeit): ${allTimeOrders}`)
    
    // Test mit einfacherem Filter
    console.log('\n=== TEST: NUR PAID BESTELLUNGEN ===\n')
    const paidOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        },
        paymentStatus: 'PAID'
      }
    })
    
    console.log(`Bezahlte Bestellungen diesen Monat: ${paidOrders}`)

  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testFinanceQuery()