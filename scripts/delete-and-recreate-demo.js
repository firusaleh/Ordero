const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAndRecreateDemoRestaurants() {
  try {
    console.log('🗑️  Lösche alte Demo-Restaurants...\n');

    // Lösche die alten Demo-Restaurants (cascades zu allen zugehörigen Daten)
    await prisma.restaurant.deleteMany({
      where: {
        OR: [
          { slug: 'oriido-demo-de' },
          { slug: 'oriido-demo-jo' }
        ]
      }
    });
    
    console.log('✅ Alte Demo-Restaurants gelöscht');
    console.log('\n🚀 Erstelle neue Demo-Restaurants mit korrekten arabischen Texten...\n');
    
    // Führe das create-demo-restaurants-simple Skript aus
    const { execSync } = require('child_process');
    execSync('node scripts/create-demo-restaurants-simple.js', { 
      stdio: 'inherit',
      env: { ...process.env }
    });

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAndRecreateDemoRestaurants().catch(console.error);