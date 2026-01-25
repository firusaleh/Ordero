import { prisma } from '@/lib/prisma'

async function checkRestaurantSetup() {
  try {
    // Finde Restaurants mit Stripe-Problemen
    const restaurants = await prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        country: true,
        stripeAccountId: true,
        stripeOnboardingCompleted: true,
        ownerId: true,
        owner: {
          select: {
            email: true,
            name: true
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      }
    })
    
    console.log('\n=== Restaurant Stripe Setup Check ===\n')
    
    for (const restaurant of restaurants) {
      console.log(`Restaurant: ${restaurant.name} (${restaurant.slug})`)
      console.log(`  - ID: ${restaurant.id}`)
      console.log(`  - Country: ${restaurant.country}`)
      console.log(`  - Owner: ${restaurant.owner?.name} (${restaurant.owner?.email})`)
      console.log(`  - Total Orders: ${restaurant._count.orders}`)
      
      // Stripe Status
      if (restaurant.stripeAccountId) {
        console.log(`  - Stripe Account: ${restaurant.stripeAccountId}`)
        console.log(`  - Onboarding Complete: ${restaurant.stripeOnboardingCompleted ? '✅' : '❌'}`)
        
        if (!restaurant.stripeOnboardingCompleted) {
          console.log('    ⚠️  WARNUNG: Stripe Onboarding nicht abgeschlossen!')
          console.log('    → Zahlungen gehen an Oriido und müssen manuell übertragen werden')
        }
      } else {
        console.log('  - Stripe Account: ❌ NICHT EINGERICHTET')
        console.log('    ⚠️  WARNUNG: Kein Stripe Connect Konto vorhanden!')
        console.log('    → ALLE Zahlungen gehen an Oriido')
        console.log('    → Restaurant kann keine direkten Zahlungen empfangen')
      }
      
      // Prüfe letzte Bestellungen
      const recentOrders = await prisma.order.findMany({
        where: { restaurantId: restaurant.id },
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
          total: true
        },
        orderBy: { createdAt: 'desc' },
        take: 3
      })
      
      if (recentOrders.length > 0) {
        console.log('\n  Letzte Bestellungen:')
        for (const order of recentOrders) {
          console.log(`    - ${order.orderNumber} (${order.createdAt.toLocaleDateString()})`)
          console.log(`      Status: ${order.status}, Payment: ${order.paymentMethod}/${order.paymentStatus}`)
          console.log(`      Total: €${order.total}`)
        }
      } else {
        console.log('\n  Keine Bestellungen gefunden')
      }
      
      console.log('\n' + '='.repeat(50) + '\n')
    }
    
    // Empfehlungen
    const problemRestaurants = restaurants.filter(r => !r.stripeAccountId || !r.stripeOnboardingCompleted)
    if (problemRestaurants.length > 0) {
      console.log('🚨 AKTION ERFORDERLICH 🚨\n')
      console.log('Folgende Restaurants benötigen Stripe Connect Setup:')
      for (const r of problemRestaurants) {
        console.log(`  - ${r.name}: ${!r.stripeAccountId ? 'Konto erstellen' : 'Onboarding abschließen'}`)
      }
      console.log('\nBis zur Einrichtung:')
      console.log('  1. Alle Zahlungen gehen an das Oriido Hauptkonto')
      console.log('  2. Manuelle Überweisung an Restaurants erforderlich')
      console.log('  3. Keine automatische Gebührenaufteilung möglich')
    } else {
      console.log('✅ Alle Restaurants haben Stripe Connect eingerichtet!')
    }
    
  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRestaurantSetup()