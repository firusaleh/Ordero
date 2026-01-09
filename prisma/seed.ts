import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Seeding database...')

  // Erstelle Demo-User
  const hashedPassword = await bcrypt.hash('demo123', 10)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@ordero.de' },
    update: {},
    create: {
      email: 'demo@ordero.de',
      password: hashedPassword,
      name: 'Demo User',
      phone: '+49 123 456789',
      role: 'RESTAURANT_OWNER',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Created demo user:', demoUser.email)

  // Erstelle Demo-Restaurant
  const demoRestaurant = await prisma.restaurant.upsert({
    where: { slug: 'demo-restaurant' },
    update: {},
    create: {
      name: 'Demo Restaurant',
      slug: 'demo-restaurant',
      description: 'Ein gemütliches Restaurant mit internationaler Küche',
      ownerId: demoUser.id,
      street: 'Musterstraße 123',
      city: 'Berlin',
      postalCode: '10115',
      country: 'Deutschland',
      phone: '+49 30 12345678',
      email: 'info@demo-restaurant.de',
      website: 'https://demo-restaurant.de',
      cuisine: 'International',
      primaryColor: '#FF6B35',
      status: 'ACTIVE',
      plan: 'STANDARD',
      settings: {
        create: {
          currency: 'EUR',
          language: 'de',
          timezone: 'Europe/Berlin',
          orderPrefix: 'ORD',
          requireTableNumber: true,
          allowTakeaway: true,
          allowDelivery: false,
          autoAcceptOrders: true,
          sendOrderEmails: true,
          sendStatusUpdates: true,
          taxRate: 19,
        }
      }
    },
    include: {
      settings: true
    }
  })

  console.log('✅ Created demo restaurant:', demoRestaurant.name)

  // Erstelle Kategorien
  const categories = [
    { name: 'Vorspeisen', icon: 'Salad', color: '#10B981' },
    { name: 'Hauptgerichte', icon: 'Pizza', color: '#F59E0B' },
    { name: 'Desserts', icon: 'IceCream', color: '#EC4899' },
    { name: 'Getränke', icon: 'Coffee', color: '#3B82F6' },
  ]

  for (let i = 0; i < categories.length; i++) {
    const category = await prisma.category.create({
      data: {
        restaurantId: demoRestaurant.id,
        name: categories[i].name,
        icon: categories[i].icon,
        color: categories[i].color,
        sortOrder: i,
        isActive: true,
      }
    })

    console.log(`✅ Created category: ${category.name}`)
    
    // Füge Beispiel-Gerichte hinzu
    if (category.name === 'Vorspeisen') {
      await prisma.menuItem.createMany({
        data: [
          {
            restaurantId: demoRestaurant.id,
            categoryId: category.id,
            name: 'Bruschetta',
            description: 'Geröstetes Brot mit Tomaten, Knoblauch und Basilikum',
            price: 8.50,
            allergens: ['Gluten'],
            tags: ['vegetarisch'],
            sortOrder: 0,
            isActive: true,
            isAvailable: true,
          },
          {
            restaurantId: demoRestaurant.id,
            categoryId: category.id,
            name: 'Caesar Salat',
            description: 'Knackiger Salat mit Caesar-Dressing, Croutons und Parmesan',
            price: 12.90,
            allergens: ['Gluten', 'Milch', 'Ei'],
            tags: [],
            sortOrder: 1,
            isActive: true,
            isAvailable: true,
          }
        ]
      })
    }
    
    if (category.name === 'Hauptgerichte') {
      const pizza = await prisma.menuItem.create({
        data: {
          categoryId: category.id,
          name: 'Pizza Margherita',
          description: 'Klassische Pizza mit Tomatensauce, Mozzarella und Basilikum',
          price: 12.50,
          allergens: (['Gluten', 'Milch']),
          tags: (['vegetarisch']),
          sortOrder: 0,
          isActive: true,
          isAvailable: true,
        }
      })
      
      // Füge Varianten hinzu
      await prisma.menuItemVariant.createMany({
        data: [
          { menuItemId: pizza.id, name: 'Klein (26cm)', price: 10.50, sortOrder: 0 },
          { menuItemId: pizza.id, name: 'Mittel (30cm)', price: 12.50, sortOrder: 1 },
          { menuItemId: pizza.id, name: 'Groß (35cm)', price: 15.50, sortOrder: 2 },
        ]
      })
      
      // Füge Extras hinzu
      await prisma.menuItemExtra.createMany({
        data: [
          { menuItemId: pizza.id, name: 'Extra Käse', price: 2.00, sortOrder: 0 },
          { menuItemId: pizza.id, name: 'Oliven', price: 1.50, sortOrder: 1 },
          { menuItemId: pizza.id, name: 'Salami', price: 2.50, sortOrder: 2 },
        ]
      })

      await prisma.menuItem.create({
        data: {
          categoryId: category.id,
          name: 'Spaghetti Carbonara',
          description: 'Cremige Pasta mit Speck, Ei und Parmesan',
          price: 14.90,
          allergens: (['Gluten', 'Ei', 'Milch']),
          tags: [],
          sortOrder: 1,
          isActive: true,
          isAvailable: true,
        }
      })
    }
    
    if (category.name === 'Desserts') {
      await prisma.menuItem.createMany({
        data: [
          {
            categoryId: category.id,
            name: 'Tiramisu',
            description: 'Italienisches Dessert mit Mascarpone und Kaffee',
            price: 6.90,
            allergens: (['Gluten', 'Ei', 'Milch']),
            tags: (['hausgemacht']),
            sortOrder: 0,
            isActive: true,
            isAvailable: true,
          },
          {
            categoryId: category.id,
            name: 'Panna Cotta',
            description: 'Italienischer Pudding mit Beerensauce',
            price: 5.90,
            allergens: (['Milch']),
            tags: (['glutenfrei']),
            sortOrder: 1,
            isActive: true,
            isAvailable: true,
          }
        ]
      })
    }
    
    if (category.name === 'Getränke') {
      await prisma.menuItem.createMany({
        data: [
          {
            categoryId: category.id,
            name: 'Coca Cola',
            description: '0,33l',
            price: 3.50,
            allergens: [],
            tags: [],
            sortOrder: 0,
            isActive: true,
            isAvailable: true,
          },
          {
            categoryId: category.id,
            name: 'Apfelschorle',
            description: '0,4l',
            price: 3.90,
            allergens: [],
            tags: [],
            sortOrder: 1,
            isActive: true,
            isAvailable: true,
          },
          {
            categoryId: category.id,
            name: 'Espresso',
            description: 'Italienischer Espresso',
            price: 2.50,
            allergens: [],
            tags: (['koffeinhaltig']),
            sortOrder: 2,
            isActive: true,
            isAvailable: true,
          }
        ]
      })
    }
  }

  // Erstelle Tische
  for (let i = 1; i <= 10; i++) {
    await prisma.table.create({
      data: {
        restaurantId: demoRestaurant.id,
        number: i,
        name: `Tisch ${i}`,
        seats: i <= 4 ? 2 : 4,
        area: i <= 5 ? 'Innenbereich' : 'Terrasse',
        qrCode: `http://localhost:3000/r/demo-restaurant/tisch/${i}`,
        isActive: true,
      }
    })
  }

  console.log('✅ Created 10 tables')
  
  console.log('\n🎉 Seeding completed!')
  console.log('\n📝 Demo-Account:')
  console.log('   Email: demo@ordero.de')
  console.log('   Passwort: demo123')
  console.log('\n🔗 Gast-App:')
  console.log('   http://localhost:3000/r/demo-restaurant/tisch/1')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })