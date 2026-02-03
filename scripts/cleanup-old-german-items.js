const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupOldGermanItems() {
  try {
    // Finde das jordanische Restaurant
    const restaurantJO = await prisma.restaurant.findUnique({
      where: { slug: 'oriido-demo-jo' },
      include: {
        menuItems: true
      }
    });

    if (!restaurantJO) {
      console.log('❌ Jordanisches Restaurant nicht gefunden!');
      return;
    }

    console.log('🔍 Suche nach deutschen Items im jordanischen Restaurant...\n');

    // Deutsche Items die gelöscht werden sollten
    const germanItemNames = ['Bruschetta Classica', 'Tomatensuppe', 'Pizza Margherita', 
                            'Classic Burger', 'Wiener Schnitzel', 'Tiramisu', 'Coca Cola'];
    
    const germanItems = restaurantJO.menuItems.filter(item => 
      germanItemNames.includes(item.name) || 
      item.description?.includes('€') ||
      /[A-Z][a-z]+\s[A-Z][a-z]+/.test(item.name) // Deutsche Namen-Pattern
    );

    if (germanItems.length > 0) {
      console.log(`⚠️  Gefunden: ${germanItems.length} deutsche Items:`);
      germanItems.forEach(item => {
        console.log(`  - ${item.name}: ${item.description}`);
      });

      console.log('\n🗑️  Lösche deutsche Items...');
      
      await prisma.menuItem.deleteMany({
        where: {
          id: { in: germanItems.map(i => i.id) }
        }
      });
      
      console.log('✅ Deutsche Items gelöscht!');
    } else {
      console.log('✅ Keine deutschen Items gefunden - alles ist auf Arabisch!');
    }

    // Zeige finale Statistik
    const finalCount = await prisma.menuItem.count({
      where: { restaurantId: restaurantJO.id }
    });
    
    console.log(`\n📊 Verbleibende Items: ${finalCount}`);

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOldGermanItems().catch(console.error);