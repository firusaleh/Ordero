const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testGuestPageData() {
  try {
    console.log('🔍 Teste Gäste-Seiten-Daten für jordanisches Restaurant...\n');

    // Genau wie in der Guest-Page
    const restaurant = await prisma.restaurant.findUnique({
      where: { 
        slug: 'oriido-demo-jo',
        status: 'ACTIVE'
      },
      include: {
        settings: true,
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            menuItems: {
              where: { 
                isActive: true,
                isAvailable: true 
              },
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!restaurant) {
      console.log('❌ Restaurant nicht gefunden oder nicht aktiv!');
      return;
    }

    console.log(`📍 Restaurant: ${restaurant.name}`);
    console.log(`🌍 Land: ${restaurant.country}`);
    console.log(`🗣️  Sprache: ${restaurant.language}\n`);

    restaurant.categories.forEach(category => {
      console.log(`\n📂 Kategorie: ${category.name}`);
      console.log('─'.repeat(40));
      
      if (category.menuItems.length === 0) {
        console.log('  ⚠️  Keine aktiven/verfügbaren Items');
      }
      
      category.menuItems.forEach(item => {
        console.log(`  🍽️  ${item.name}`);
        console.log(`     ${item.description}`);
        console.log(`     💰 ${item.price} ${restaurant.settings?.currency || 'JOD'}`);
      });
    });

    // Statistik
    const totalItems = restaurant.categories.reduce((sum, cat) => sum + cat.menuItems.length, 0);
    console.log(`\n📊 Gesamt: ${totalItems} aktive Menü-Items`);

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGuestPageData().catch(console.error);