const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRestaurantStatus() {
  try {
    console.log('🔍 Überprüfe Demo-Restaurants Status...\n');

    // Hole beide Demo-Restaurants
    const restaurants = await prisma.restaurant.findMany({
      where: {
        OR: [
          { slug: 'oriido-demo-de' },
          { slug: 'oriido-demo-jo' }
        ]
      },
      include: {
        settings: true,
        _count: {
          select: {
            menuItems: true,
            categories: true,
            tables: true
          }
        }
      }
    });

    if (restaurants.length === 0) {
      console.log('❌ Keine Demo-Restaurants gefunden!');
      return;
    }

    restaurants.forEach(restaurant => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📍 Restaurant: ${restaurant.name}`);
      console.log(`🔗 Slug: ${restaurant.slug}`);
      console.log(`🌍 Land: ${restaurant.country || 'Nicht gesetzt'}`);
      console.log(`🗣️  Sprache: ${restaurant.language || 'Nicht gesetzt'}`);
      console.log(`✅ Status: ${restaurant.status}`);
      console.log(`🎨 Plan: ${restaurant.plan || 'Kein Plan'}`);
      
      if (restaurant.status !== 'ACTIVE') {
        console.log('⚠️  WARNUNG: Restaurant ist NICHT AKTIV!');
      }

      console.log('\n📊 Statistiken:');
      console.log(`  - Kategorien: ${restaurant._count.categories}`);
      console.log(`  - Menü-Items: ${restaurant._count.menuItems}`);
      console.log(`  - Tische: ${restaurant._count.tables}`);
      
      console.log('\n🔧 Settings:');
      if (restaurant.settings) {
        console.log(`  - Bestellungen aktiviert: ${restaurant.settings.orderingEnabled}`);
        console.log(`  - Währung: ${restaurant.settings.currency}`);
        console.log(`  - Sprache: ${restaurant.settings.language}`);
      } else {
        console.log('  ❌ Keine Settings gefunden!');
      }

      console.log('\n🌐 URLs:');
      console.log(`  - Guest: https://www.oriido.com/r/${restaurant.slug}`);
      console.log(`  - Direkt: https://www.oriido.com/${restaurant.slug}`);
      console.log(`  - Tisch 1: https://www.oriido.com/r/${restaurant.slug}/tisch/1`);
    });

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRestaurantStatus().catch(console.error);