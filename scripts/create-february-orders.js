const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createFebruaryOrders() {
  try {
    console.log('🚀 Erstelle Februar 2026 Bestellungen in Cloud-DB...\n')

    // Restaurants mit Menüpunkten abrufen
    const restaurants = await prisma.restaurant.findMany({
      where: {
        plan: 'TRIAL' // Nur TRIAL Restaurants
      },
      include: {
        menuItems: {
          take: 3
        }
      }
    })

    console.log(`Gefunden: ${restaurants.length} TRIAL Restaurants\n`)

    for (const restaurant of restaurants) {
      if (restaurant.menuItems.length === 0) {
        console.log(`⚠️  ${restaurant.name} hat keine Menüpunkte - überspringe`)
        continue
      }

      // Bestellungen für Februar 2026
      const ordersToCreate = [
        { date: new Date(2026, 1, 1, 12, 30), status: 'CONFIRMED', paymentMethod: 'CASH', paymentStatus: 'PENDING' },
        { date: new Date(2026, 1, 2, 18, 45), status: 'DELIVERED', paymentMethod: 'CARD', paymentStatus: 'PAID' },
        { date: new Date(2026, 1, 3, 13, 20), status: 'READY', paymentMethod: 'CASH', paymentStatus: 'PENDING' },
      ]

      let created = 0
      for (let i = 0; i < ordersToCreate.length; i++) {
        const orderData = ordersToCreate[i]
        
        // Bestellnummer generieren
        const lastOrder = await prisma.order.findFirst({
          orderBy: { orderNumber: 'desc' }
        })
        
        let nextNumber = 'ORD-00100' // Fallback
        if (lastOrder?.orderNumber) {
          const match = lastOrder.orderNumber.match(/ORD-(\d+)/)
          if (match) {
            const num = parseInt(match[1]) + 1
            nextNumber = `ORD-${String(num).padStart(5, '0')}`
          }
        }
        
        // Zufälliger Menüpunkt
        const menuItem = restaurant.menuItems[Math.floor(Math.random() * restaurant.menuItems.length)]
        const quantity = Math.floor(Math.random() * 2) + 1
        const unitPrice = menuItem.price || 10
        const total = unitPrice * quantity

        try {
          const order = await prisma.order.create({
            data: {
              orderNumber: nextNumber,
              restaurantId: restaurant.id,
              subtotal: total,
              tax: 0,
              total,
              status: orderData.status,
              paymentStatus: orderData.paymentStatus,
              paymentMethod: orderData.paymentMethod,
              type: 'DINE_IN',
              createdAt: orderData.date,
              updatedAt: orderData.date,
              items: {
                create: {
                  menuItemId: menuItem.id,
                  name: menuItem.name,
                  quantity,
                  unitPrice,
                  totalPrice: total,
                  notes: ''
                }
              }
            }
          })

          console.log(`✅ ${nextNumber} für ${restaurant.name}`)
          console.log(`   Status: ${orderData.status}, Payment: ${orderData.paymentStatus}`)
          console.log(`   Datum: ${orderData.date.toLocaleDateString('de-DE')}`)
          console.log(`   Betrag: ${restaurant.country === 'JO' ? 'JD' : '€'}${total}`)
          created++
        } catch (err) {
          console.log(`❌ Fehler bei ${restaurant.name}: ${err.message}`)
        }
      }
      
      if (created > 0) {
        console.log(`\n✨ ${created} Bestellungen für ${restaurant.name} erstellt\n`)
      }
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

    const validOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(2026, 1, 1),
          lte: new Date(2026, 1, 28)
        },
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

    console.log('\n=== ZUSAMMENFASSUNG ===')
    console.log(`Februar 2026 Gesamt: ${februaryOrders} Bestellungen`)
    console.log(`Davon gültig für Abrechnung: ${validOrders} Bestellungen`)

  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createFebruaryOrders()