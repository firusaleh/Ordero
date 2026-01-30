const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkSpecialItems() {
  try {
    // Finde alle Menü-Items mit speziellen Properties
    const dailySpecials = await prisma.menuItem.findMany({
      where: { isDailySpecial: true },
      include: {
        category: true,
        restaurant: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    })
    
    const featuredItems = await prisma.menuItem.findMany({
      where: { isFeatured: true },
      include: {
        category: true,
        restaurant: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    })
    
    console.log('=== TAGESGERICHTE ===')
    if (dailySpecials.length === 0) {
      console.log('Keine Tagesgerichte gefunden')
    } else {
      dailySpecials.forEach(item => {
        console.log(`- ${item.name} (${item.restaurant.name})`)
        console.log(`  isDailySpecial: ${item.isDailySpecial}`)
        console.log(`  specialPrice: ${item.specialPrice}`)
        console.log(`  Restaurant Slug: ${item.restaurant.slug}`)
      })
    }
    
    console.log('\n=== EMPFOHLENE ARTIKEL ===')
    if (featuredItems.length === 0) {
      console.log('Keine empfohlenen Artikel gefunden')
    } else {
      featuredItems.forEach(item => {
        console.log(`- ${item.name} (${item.restaurant.name})`)
        console.log(`  isFeatured: ${item.isFeatured}`)
        console.log(`  Restaurant Slug: ${item.restaurant.slug}`)
      })
    }
    
    // Prüfe auch ein spezifisches Restaurant
    const testRestaurant = await prisma.restaurant.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        categories: {
          include: {
            menuItems: {
              where: {
                OR: [
                  { isDailySpecial: true },
                  { isFeatured: true }
                ]
              }
            }
          }
        }
      }
    })
    
    if (testRestaurant) {
      console.log(`\n=== TEST RESTAURANT: ${testRestaurant.name} (${testRestaurant.slug}) ===`)
      testRestaurant.categories.forEach(cat => {
        if (cat.menuItems.length > 0) {
          console.log(`Kategorie: ${cat.name}`)
          cat.menuItems.forEach(item => {
            console.log(`  - ${item.name}`)
            console.log(`    isDailySpecial: ${item.isDailySpecial}, isFeatured: ${item.isFeatured}`)
          })
        }
      })
    }
    
  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSpecialItems()