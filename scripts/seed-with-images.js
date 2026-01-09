const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

async function seed() {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017/ordero?replicaSet=rs0')
  
  try {
    await client.connect()
    console.log('🌱 Seeding MongoDB with images...')
    
    const db = client.db('ordero')
    
    // Clear existing data
    await db.collection('User').deleteMany({})
    await db.collection('Restaurant').deleteMany({})
    await db.collection('Category').deleteMany({})
    await db.collection('MenuItem').deleteMany({})
    await db.collection('Table').deleteMany({})
    await db.collection('RestaurantSettings').deleteMany({})
    
    console.log('✅ Cleared existing data')
    
    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 12)
    const demoUser = await db.collection('User').insertOne({
      email: 'demo@ordero.de',
      password: hashedPassword,
      name: 'Demo Restaurant',
      role: 'RESTAURANT_OWNER',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    console.log('✅ Created demo user: demo@ordero.de')
    
    // Create demo restaurant
    const demoRestaurant = await db.collection('Restaurant').insertOne({
      name: 'Bella Vista Restaurant',
      slug: 'demo-restaurant',
      description: 'Authentische italienische Küche mit modernem Touch',
      cuisine: 'italian',
      street: 'Musterstraße 123',
      city: 'Berlin',
      postalCode: '10115',
      phone: '+49 30 12345678',
      email: 'info@bellavista.de',
      website: 'https://bellavista.de',
      ownerId: demoUser.insertedId,
      status: 'ACTIVE',
      plan: 'PREMIUM',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      primaryColor: '#10b981',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    console.log('✅ Created demo restaurant')
    
    // Define categories with menu items and images
    const categoriesData = [
      {
        name: 'Vorspeisen',
        description: 'Frische Antipasti und Vorspeisen',
        icon: 'Salad',
        color: '#10b981',
        menuItems: [
          {
            name: 'Bruschetta Classica',
            description: 'Geröstetes Ciabatta mit frischen Tomaten, Knoblauch und Basilikum',
            price: 8.50,
            image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=800&q=80',
            allergens: ['Gluten'],
            tags: ['Vegan', 'Beliebt'],
          },
          {
            name: 'Carpaccio di Manzo',
            description: 'Hauchdünn geschnittenes Rinderfilet mit Rucola, Parmesan und Zitronendressing',
            price: 14.50,
            image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',
            allergens: ['Milch'],
            tags: ['Empfehlung'],
          },
          {
            name: 'Caprese',
            description: 'Büffelmozzarella mit Tomaten, Basilikum und Olivenöl',
            price: 11.90,
            image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=800&q=80',
            allergens: ['Milch'],
            tags: ['Vegetarisch'],
          },
          {
            name: 'Antipasti Misti',
            description: 'Gemischte italienische Vorspeisen mit gegrilltem Gemüse, Oliven und Käse',
            price: 16.90,
            image: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=800&q=80',
            allergens: ['Milch', 'Sellerie'],
            tags: ['Vegetarisch', 'Für 2 Personen'],
          }
        ]
      },
      {
        name: 'Pizza',
        description: 'Steinofenpizza mit knusprigem Boden',
        icon: 'Pizza',
        color: '#ef4444',
        menuItems: [
          {
            name: 'Pizza Margherita',
            description: 'Tomatensauce, Mozzarella, frisches Basilikum',
            price: 10.50,
            image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
            allergens: ['Gluten', 'Milch'],
            tags: ['Vegetarisch', 'Klassiker'],
            variants: [
              { id: '1', name: 'Klein (26cm)', price: 10.50 },
              { id: '2', name: 'Groß (32cm)', price: 14.50 },
              { id: '3', name: 'Familie (40cm)', price: 19.50 }
            ],
            extras: [
              { id: '1', name: 'Extra Mozzarella', price: 2.50 },
              { id: '2', name: 'Oliven', price: 1.50 },
              { id: '3', name: 'Knoblauch', price: 1.00 }
            ]
          },
          {
            name: 'Pizza Diavola',
            description: 'Tomatensauce, Mozzarella, scharfe Salami, Peperoncini',
            price: 13.50,
            image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80',
            allergens: ['Gluten', 'Milch'],
            tags: ['Scharf', 'Beliebt'],
            variants: [
              { id: '1', name: 'Klein (26cm)', price: 13.50 },
              { id: '2', name: 'Groß (32cm)', price: 17.50 },
              { id: '3', name: 'Familie (40cm)', price: 23.50 }
            ]
          },
          {
            name: 'Pizza Quattro Formaggi',
            description: 'Vier verschiedene Käsesorten: Mozzarella, Gorgonzola, Parmesan, Ricotta',
            price: 14.90,
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
            allergens: ['Gluten', 'Milch'],
            tags: ['Vegetarisch'],
            variants: [
              { id: '1', name: 'Klein (26cm)', price: 14.90 },
              { id: '2', name: 'Groß (32cm)', price: 18.90 },
              { id: '3', name: 'Familie (40cm)', price: 24.90 }
            ]
          },
          {
            name: 'Pizza Prosciutto e Funghi',
            description: 'Tomatensauce, Mozzarella, Schinken, frische Champignons',
            price: 12.90,
            image: 'https://images.unsplash.com/photo-1564936281291-294551497d81?w=800&q=80',
            allergens: ['Gluten', 'Milch'],
            tags: ['Klassiker'],
            variants: [
              { id: '1', name: 'Klein (26cm)', price: 12.90 },
              { id: '2', name: 'Groß (32cm)', price: 16.90 },
              { id: '3', name: 'Familie (40cm)', price: 22.90 }
            ]
          }
        ]
      },
      {
        name: 'Pasta',
        description: 'Hausgemachte Pasta al dente',
        icon: 'ChefHat',
        color: '#f59e0b',
        menuItems: [
          {
            name: 'Spaghetti Carbonara',
            description: 'Mit Guanciale, Eigelb, Pecorino Romano und schwarzem Pfeffer',
            price: 13.90,
            image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80',
            allergens: ['Gluten', 'Eier', 'Milch'],
            tags: ['Hausgemacht'],
          },
          {
            name: 'Penne Arrabbiata',
            description: 'Mit scharfer Tomatensauce, Knoblauch und Peperoncini',
            price: 11.90,
            image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80',
            allergens: ['Gluten'],
            tags: ['Vegan', 'Scharf'],
          },
          {
            name: 'Tagliatelle al Ragù',
            description: 'Hausgemachte Bandnudeln mit original Bolognese-Sauce',
            price: 14.90,
            image: 'https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=800&q=80',
            allergens: ['Gluten', 'Eier', 'Sellerie'],
            tags: ['Hausgemacht', 'Empfehlung'],
          },
          {
            name: 'Lasagne al Forno',
            description: 'Geschichtete Pasta mit Ragù, Bechamel und Mozzarella',
            price: 15.90,
            image: 'https://images.unsplash.com/photo-1560035285-64808ba47bda?w=800&q=80',
            allergens: ['Gluten', 'Milch', 'Eier'],
            tags: ['Ofengericht'],
          }
        ]
      },
      {
        name: 'Hauptgerichte',
        description: 'Fleisch- und Fischspezialitäten',
        icon: 'ChefHat',
        color: '#8b5cf6',
        menuItems: [
          {
            name: 'Scaloppine al Limone',
            description: 'Kalbsschnitzel in Zitronenbutter-Sauce mit Rosmarin-Kartoffeln',
            price: 24.90,
            image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&q=80',
            allergens: ['Milch'],
            tags: ['Empfehlung'],
          },
          {
            name: 'Salmone alla Griglia',
            description: 'Gegrillter Lachs mit mediterranem Gemüse und Kräuteröl',
            price: 22.90,
            image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
            allergens: ['Fisch'],
            tags: ['Gesund'],
          },
          {
            name: 'Pollo Parmigiana',
            description: 'Paniertes Hähnchen mit Tomatensauce und geschmolzenem Mozzarella',
            price: 18.90,
            image: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800&q=80',
            allergens: ['Gluten', 'Milch', 'Eier'],
            tags: ['Beliebt'],
          },
          {
            name: 'Tagliata di Manzo',
            description: 'Rosa gebratenes Rinderfilet in Scheiben mit Rucola und Parmesan',
            price: 28.90,
            image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80',
            allergens: ['Milch'],
            tags: ['Premium'],
          }
        ]
      },
      {
        name: 'Desserts',
        description: 'Hausgemachte Süßspeisen',
        icon: 'IceCream',
        color: '#ec4899',
        menuItems: [
          {
            name: 'Tiramisu',
            description: 'Klassisches italienisches Dessert mit Mascarpone und Espresso',
            price: 7.90,
            image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80',
            allergens: ['Gluten', 'Milch', 'Eier'],
            tags: ['Hausgemacht', 'Beliebt'],
          },
          {
            name: 'Panna Cotta',
            description: 'Sahnecreme mit Beerensauce',
            price: 6.90,
            image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
            allergens: ['Milch'],
            tags: ['Vegetarisch'],
          },
          {
            name: 'Gelato Misto',
            description: 'Drei Kugeln italienisches Eis nach Wahl',
            price: 5.90,
            image: 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=800&q=80',
            allergens: ['Milch'],
            tags: ['Kinder'],
          },
          {
            name: 'Cannoli Siciliani',
            description: 'Knusprige Teigröllchen gefüllt mit süßer Ricotta-Creme',
            price: 8.90,
            image: 'https://images.unsplash.com/photo-1607276221014-2cb4970b577e?w=800&q=80',
            allergens: ['Gluten', 'Milch', 'Nüsse'],
            tags: ['Spezialität'],
          }
        ]
      },
      {
        name: 'Getränke',
        description: 'Erfrischungen und Heißgetränke',
        icon: 'Coffee',
        color: '#6366f1',
        menuItems: [
          {
            name: 'Espresso',
            description: 'Starker italienischer Kaffee',
            price: 2.50,
            image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&q=80',
            allergens: [],
            tags: [],
          },
          {
            name: 'Cappuccino',
            description: 'Espresso mit aufgeschäumter Milch',
            price: 3.90,
            image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=80',
            allergens: ['Milch'],
            tags: [],
          },
          {
            name: 'Aperol Spritz',
            description: 'Aperol, Prosecco und Soda',
            price: 8.90,
            image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80',
            allergens: [],
            tags: ['Alkohol'],
          },
          {
            name: 'Limonata',
            description: 'Hausgemachte Zitronenlimonade mit Minze',
            price: 4.90,
            image: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?w=800&q=80',
            allergens: [],
            tags: ['Hausgemacht', 'Erfrischend'],
          }
        ]
      }
    ]
    
    // Create categories and menu items
    for (const categoryData of categoriesData) {
      const category = await db.collection('Category').insertOne({
        restaurantId: demoRestaurant.insertedId,
        name: categoryData.name,
        description: categoryData.description,
        icon: categoryData.icon,
        color: categoryData.color,
        sortOrder: categoriesData.indexOf(categoryData),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      console.log(`✅ Created category: ${categoryData.name}`)
      
      // Create menu items for this category
      for (let i = 0; i < categoryData.menuItems.length; i++) {
        const item = categoryData.menuItems[i]
        await db.collection('MenuItem').insertOne({
          categoryId: category.insertedId,
          restaurantId: demoRestaurant.insertedId,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image || null,
          allergens: item.allergens || [],
          additives: [],
          tags: item.tags || [],
          isActive: true,
          isAvailable: true,
          sortOrder: i,
          variants: item.variants || [],
          extras: item.extras || [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    }
    
    // Create tables
    for (let i = 1; i <= 10; i++) {
      await db.collection('Table').insertOne({
        restaurantId: demoRestaurant.insertedId,
        number: i,
        name: `Tisch ${i}`,
        seats: i <= 4 ? 2 : 4,
        area: i <= 5 ? 'Innenbereich' : 'Terrasse',
        qrCode: `http://localhost:3000/r/demo-restaurant/tisch/${i}`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    
    console.log('✅ Created 10 tables')
    
    // Create settings
    await db.collection('RestaurantSettings').insertOne({
      restaurantId: demoRestaurant.insertedId,
      orderingEnabled: true,
      requireTableNumber: true,
      allowTakeaway: true,
      allowDelivery: false,
      autoAcceptOrders: true,
      orderPrefix: 'ORD',
      emailNotifications: true,
      soundNotifications: true,
      sendOrderEmails: true,
      sendStatusUpdates: true,
      acceptCash: true,
      acceptCard: false,
      acceptPaypal: false,
      acceptStripe: false,
      taxRate: 19,
      includeTax: true,
      currency: 'EUR',
      language: 'de',
      timezone: 'Europe/Berlin',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    console.log('✅ Created restaurant settings')
    
    console.log('\n🎉 Seeding with images completed!')
    console.log('\n📝 Demo-Account:')
    console.log('   Email: demo@ordero.de')
    console.log('   Passwort: demo123')
    console.log('\n🔗 Gast-App:')
    console.log('   http://localhost:3000/r/demo-restaurant/tisch/1')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

seed()