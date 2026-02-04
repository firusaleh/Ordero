const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTableDisplay() {
  try {
    // Hole ein paar Tische vom jordanischen Restaurant
    const tables = await prisma.table.findMany({
      where: { 
        restaurant: { slug: 'oriido-demo-jo' }
      },
      take: 5,
      include: {
        restaurant: {
          select: {
            name: true,
            language: true,
            country: true
          }
        }
      }
    });

    console.log('🔍 Tisch-Daten in der Datenbank:\n');
    tables.forEach(table => {
      console.log(`Tisch ${table.number}:`);
      console.log(`  - name (DB): "${table.name}"`);
      console.log(`  - area: "${table.area}"`);
      console.log(`  - Restaurant: ${table.restaurant.name}`);
      console.log(`  - Sprache: ${table.restaurant.language}\n`);
    });

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTableDisplay().catch(console.error);