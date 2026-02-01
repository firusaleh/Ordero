const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkOrders() {
  try {
    // Alle Bestellungen abrufen
    const allOrders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        status: true,
        total: true,
        restaurant: {
          select: {
            name: true,
            country: true,
            plan: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    console.log('\n=== LETZTE 20 BESTELLUNGEN ===\n')
    
    allOrders.forEach(order => {
      const date = new Date(order.createdAt)
      console.log(`📦 Bestellung: ${order.orderNumber}`)
      console.log(`   Restaurant: ${order.restaurant.name} (${order.restaurant.country}) - Plan: ${order.restaurant.plan}`)
      console.log(`   Datum: ${date.toLocaleDateString('de-DE')} ${date.toLocaleTimeString('de-DE')}`)
      console.log(`   Status: ${order.status}`)
      console.log(`   Betrag: €${order.total}`)
      console.log('---')
    })

    // Bestellungen pro Monat zählen
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    for (let i = 0; i < 3; i++) {
      const monthDate = new Date(currentYear, currentMonth - i, 1)
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      
      const monthOrders = await prisma.order.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          NOT: {
            status: 'CANCELLED'
          }
        }
      })

      const monthName = startOfMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
      console.log(`\n📅 ${monthName}: ${monthOrders} Bestellungen`)
    }

    // Bestellungen pro Restaurant zählen
    console.log('\n=== BESTELLUNGEN PRO RESTAURANT ===\n')
    
    const restaurants = await prisma.restaurant.findMany({
      include: {
        _count: {
          select: {
            orders: {
              where: {
                NOT: {
                  status: 'CANCELLED'
                }
              }
            }
          }
        }
      }
    })

    restaurants.forEach(restaurant => {
      if (restaurant._count.orders > 0) {
        console.log(`🍽️  ${restaurant.name}: ${restaurant._count.orders} Bestellungen insgesamt`)
      }
    })

  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOrders()