const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkArabicMenu() {
  try {
    // Finde das jordanische Restaurant
    const restaurantJO = await prisma.restaurant.findUnique({
      where: { slug: 'oriido-demo-jo' },
      include: {
        menuItems: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        categories: true
      }
    });

    if (!restaurantJO) {
      console.log('❌ Jordanisches Restaurant nicht gefunden!');
      return;
    }

    console.log('\n📍 Restaurant:', restaurantJO.name);
    console.log('🌍 Land:', restaurantJO.country);
    console.log('🗣️  Sprache:', restaurantJO.language);
    
    console.log('\n📋 Kategorien:');
    restaurantJO.categories.forEach(cat => {
      console.log(`  - ${cat.name}`);
    });

    console.log('\n🍽️  Menü-Items (neueste zuerst):');
    restaurantJO.menuItems.forEach(item => {
      console.log(`  - ${item.name}: ${item.description}`);
      console.log(`    Preis: ${item.price} JOD`);
    });

    // Zähle alle Items
    const totalItems = await prisma.menuItem.count({
      where: { restaurantId: restaurantJO.id }
    });
    
    console.log(`\n📊 Gesamt: ${totalItems} Menü-Items`);

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkArabicMenu().catch(console.error);