const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAllOrders() {
  try {
    console.log('🔍 Untersuche ALLE Bestellungen in der Datenbank...\n')

    // Alle Bestellungen ohne Filter abrufen
    const allOrders = await prisma.order.findMany({
      include: {
        restaurant: {
          select: {
            name: true,
            country: true,
            plan: true
          }
        }
      }
    })

    console.log(`📊 Gesamt: ${allOrders.length} Bestellungen gefunden\n`)

    // Nach Status gruppieren
    const statusGroups = {}
    allOrders.forEach(order => {
      if (!statusGroups[order.status]) {
        statusGroups[order.status] = []
      }
      statusGroups[order.status].push(order)
    })

    console.log('=== BESTELLUNGEN NACH STATUS ===')
    Object.entries(statusGroups).forEach(([status, orders]) => {
      console.log(`${status}: ${orders.length} Bestellungen`)
    })

    // Nach Monat gruppieren
    console.log('\n=== BESTELLUNGEN NACH MONAT ===')
    const monthGroups = {}
    allOrders.forEach(order => {
      const date = new Date(order.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = []
      }
      monthGroups[monthKey].push(order)
    })

    Object.entries(monthGroups).sort().forEach(([month, orders]) => {
      const [year, monthNum] = month.split('-')
      const monthName = new Date(year, monthNum - 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
      console.log(`${monthName}: ${orders.length} Bestellungen`)
    })

    // Die letzten 10 Bestellungen anzeigen
    console.log('\n=== DIE LETZTEN 10 BESTELLUNGEN ===')
    const recentOrders = allOrders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)

    recentOrders.forEach(order => {
      const date = new Date(order.createdAt)
      console.log(`\n📦 ${order.orderNumber}`)
      console.log(`   Restaurant: ${order.restaurant.name}`)
      console.log(`   Datum: ${date.toLocaleDateString('de-DE')} ${date.toLocaleTimeString('de-DE')}`)
      console.log(`   Status: ${order.status}`)
      console.log(`   Payment Status: ${order.paymentStatus}`)
      console.log(`   Payment Method: ${order.paymentMethod || 'Nicht angegeben'}`)
      console.log(`   Betrag: ${order.total}`)
    })

    // Bestellungen die NICHT gezählt werden würden
    console.log('\n=== BESTELLUNGEN DIE MÖGLICHERWEISE NICHT GEZÄHLT WERDEN ===')
    const cancelledOrders = allOrders.filter(order => order.status === 'CANCELLED')
    const pendingOrders = allOrders.filter(order => order.status === 'PENDING')
    const otherOrders = allOrders.filter(order => 
      !['CANCELLED', 'COMPLETED', 'READY', 'DELIVERED', 'PENDING'].includes(order.status)
    )

    console.log(`CANCELLED: ${cancelledOrders.length}`)
    console.log(`PENDING: ${pendingOrders.length}`)
    console.log(`Andere Status: ${otherOrders.length}`)
    
    if (otherOrders.length > 0) {
      console.log('\nAndere Status-Werte:')
      const uniqueStatuses = [...new Set(otherOrders.map(o => o.status))]
      uniqueStatuses.forEach(status => {
        console.log(`  - ${status}`)
      })
    }

    // Februar 2026 speziell prüfen
    console.log('\n=== FEBRUAR 2026 SPEZIELL ===')
    const feb2026Orders = allOrders.filter(order => {
      const date = new Date(order.createdAt)
      return date.getFullYear() === 2026 && date.getMonth() === 1 // Februar ist Monat 1
    })

    console.log(`Gefunden: ${feb2026Orders.length} Bestellungen`)
    if (feb2026Orders.length > 0) {
      const nonCancelled = feb2026Orders.filter(o => o.status !== 'CANCELLED')
      console.log(`Davon nicht storniert: ${nonCancelled.length}`)
      
      // Nach Restaurant gruppieren
      const byRestaurant = {}
      nonCancelled.forEach(order => {
        const name = order.restaurant.name
        if (!byRestaurant[name]) {
          byRestaurant[name] = 0
        }
        byRestaurant[name]++
      })
      
      console.log('\nPro Restaurant:')
      Object.entries(byRestaurant).forEach(([name, count]) => {
        console.log(`  ${name}: ${count} Bestellungen`)
      })
    }

  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllOrders()