const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestOrders() {
  try {
    console.log('🚀 Erstelle Test-Bestellungen...\n')

    // Alle Restaurants abrufen
    const restaurants = await prisma.restaurant.findMany({
      include: {
        menuItems: {
          take: 3
        }
      }
    })

    if (restaurants.length === 0) {
      console.log('❌ Keine Restaurants gefunden!')
      return
    }

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    for (const restaurant of restaurants) {
      if (restaurant.menuItems.length === 0) {
        console.log(`⚠️  ${restaurant.name} hat keine Menüpunkte`)
        continue
      }

      // Erstelle Bestellungen für verschiedene Zeiträume
      const ordersToCreate = [
        // Februar 2026 (aktueller Monat) - 5 Bestellungen
        { date: new Date(2026, 1, 1, 10, 30), paymentMethod: 'CASH' },
        { date: new Date(2026, 1, 2, 12, 45), paymentMethod: 'ONLINE' },
        { date: new Date(2026, 1, 3, 18, 20), paymentMethod: 'CASH' },
        { date: new Date(2026, 1, 4, 19, 15), paymentMethod: 'ONLINE' },
        { date: new Date(2026, 1, 5, 13, 0), paymentMethod: 'CASH' },
        
        // Januar 2026 - 3 Bestellungen
        { date: new Date(2026, 0, 15, 11, 30), paymentMethod: 'ONLINE' },
        { date: new Date(2026, 0, 20, 12, 45), paymentMethod: 'CASH' },
        { date: new Date(2026, 0, 25, 19, 20), paymentMethod: 'ONLINE' },
      ]

      for (let i = 0; i < ordersToCreate.length; i++) {
        const orderData = ordersToCreate[i]
        const orderNumber = `ORD-${restaurant.id.slice(-4)}-${Date.now()}-${i}`
        
        // Zufällige Artikel auswählen
        const menuItem = restaurant.menuItems[Math.floor(Math.random() * restaurant.menuItems.length)]
        const quantity = Math.floor(Math.random() * 3) + 1
        const total = (menuItem.price || 10) * quantity

        const order = await prisma.order.create({
          data: {
            orderNumber,
            restaurantId: restaurant.id,
            subtotal: total,
            tax: 0,
            total,
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            paymentMethod: orderData.paymentMethod,
            type: 'DINE_IN',
            createdAt: orderData.date,
            updatedAt: orderData.date,
            items: {
              create: {
                menuItemId: menuItem.id,
                name: menuItem.name,
                quantity,
                unitPrice: menuItem.price || 10,
                totalPrice: (menuItem.price || 10) * quantity,
                notes: ''
              }
            }
          }
        })

        console.log(`✅ Bestellung ${orderNumber} für ${restaurant.name} erstellt`)
        console.log(`   Datum: ${orderData.date.toLocaleDateString('de-DE')}`)
        console.log(`   Betrag: ${restaurant.country === 'JO' ? 'JD' : '€'}${total}`)
        console.log(`   Zahlung: ${orderData.paymentMethod}`)
      }
      
      console.log(`\n📊 ${ordersToCreate.length} Bestellungen für ${restaurant.name} erstellt\n`)
    }

    // Zusammenfassung
    const februaryOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(2026, 1, 1),
          lte: new Date(2026, 1, 28)
        }
      }
    })

    const januaryOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(2026, 0, 1),
          lte: new Date(2026, 0, 31)
        }
      }
    })

    console.log('\n=== ZUSAMMENFASSUNG ===')
    console.log(`Februar 2026: ${februaryOrders} Bestellungen`)
    console.log(`Januar 2026: ${januaryOrders} Bestellungen`)

  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestOrders()