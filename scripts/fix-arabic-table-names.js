const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixArabicTableNames() {
  try {
    console.log('🔧 Korrigiere arabische Tischnamen...\n');

    // Finde das jordanische Restaurant
    const restaurantJO = await prisma.restaurant.findUnique({
      where: { slug: 'oriido-demo-jo' }
    });

    if (!restaurantJO) {
      console.log('❌ Jordanisches Restaurant nicht gefunden!');
      return;
    }

    // Hole alle Tische des Restaurants
    const tables = await prisma.table.findMany({
      where: { restaurantId: restaurantJO.id },
      orderBy: { number: 'asc' }
    });

    console.log(`📍 Gefunden: ${tables.length} Tische\n`);

    // Update jeden Tisch mit arabischem Namen
    for (const table of tables) {
      const arabicName = `طاولة ${table.number}`;
      
      await prisma.table.update({
        where: { id: table.id },
        data: { 
          name: arabicName,
          area: table.number <= 15 ? 'داخلي' : 'شرفة'
        }
      });
      
      console.log(`✅ Tisch ${table.number}: "${table.name}" → "${arabicName}"`);
    }

    console.log('\n✨ Alle arabischen Tischnamen erfolgreich aktualisiert!');

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixArabicTableNames().catch(console.error);