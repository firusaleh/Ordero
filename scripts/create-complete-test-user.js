const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

async function createCompleteTestUser() {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017/ordero?replicaSet=rs0')
  
  try {
    await client.connect()
    console.log('🧪 Creating test user with completed onboarding...')
    
    const db = client.db('ordero')
    
    // Check if test user already exists
    const existingUser = await db.collection('User').findOne({ email: 'test@ordero.de' })
    
    if (existingUser) {
      // Check if user already has a restaurant
      const existingRestaurant = await db.collection('Restaurant').findOne({ ownerId: existingUser._id })
      
      if (existingRestaurant) {
        console.log('✅ Test user already has completed onboarding!')
        console.log('\n📝 Test-Account:')
        console.log('   Email: test@ordero.de')
        console.log('   Passwort: test123')
        console.log('\n🔗 Dashboard: http://localhost:3000/dashboard')
        return
      }
    }
    
    // Create or update test user
    const hashedPassword = await bcrypt.hash('test123', 12)
    
    let userId
    if (existingUser) {
      userId = existingUser._id
    } else {
      const newUser = await db.collection('User').insertOne({
        email: 'test@ordero.de',
        password: hashedPassword,
        name: 'Test Restaurant Owner',
        role: 'RESTAURANT_OWNER',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      userId = newUser.insertedId
    }
    
    // Create restaurant for test user
    const restaurant = await db.collection('Restaurant').insertOne({
      name: 'Mein Test Restaurant',
      slug: `test-restaurant-${Date.now()}`,
      description: 'Ein gemütliches Restaurant mit ausgezeichneter Küche',
      cuisine: 'german',
      street: 'Teststraße 123',
      city: 'Berlin',
      postalCode: '10115',
      phone: '+49 30 98765432',
      email: 'info@testrestaurant.de',
      website: 'https://testrestaurant.de',
      ownerId: userId,
      status: 'ACTIVE',
      plan: 'TRIAL',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      primaryColor: '#3b82f6',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    console.log('✅ Created restaurant for test user')
    
    // Create categories
    const categories = [
      { name: 'Vorspeisen', icon: 'Salad', color: '#10b981' },
      { name: 'Hauptgerichte', icon: 'ChefHat', color: '#3b82f6' },
      { name: 'Desserts', icon: 'IceCream', color: '#ec4899' },
      { name: 'Getränke', icon: 'Coffee', color: '#6366f1' }
    ]
    
    for (let i = 0; i < categories.length; i++) {
      const category = await db.collection('Category').insertOne({
        restaurantId: restaurant.insertedId,
        name: categories[i].name,
        icon: categories[i].icon,
        color: categories[i].color,
        sortOrder: i,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      // Add sample menu items
      if (categories[i].name === 'Hauptgerichte') {
        await db.collection('MenuItem').insertOne({
          categoryId: category.insertedId,
          restaurantId: restaurant.insertedId,
          name: 'Wiener Schnitzel',
          description: 'Mit Pommes frites und Preiselbeeren',
          price: 18.90,
          image: 'https://images.unsplash.com/photo-1564436872-f6d81182df12?w=800&q=80',
          allergens: ['Gluten', 'Eier'],
          additives: [],
          tags: ['Klassiker'],
          isActive: true,
          isAvailable: true,
          sortOrder: 0,
          variants: [],
          extras: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    }
    
    console.log('✅ Created categories and sample menu items')
    
    // Create tables
    for (let i = 1; i <= 5; i++) {
      await db.collection('Table').insertOne({
        restaurantId: restaurant.insertedId,
        number: i,
        name: `Tisch ${i}`,
        seats: 4,
        area: 'Innenbereich',
        qrCode: `http://localhost:3000/r/${restaurant.slug}/tisch/${i}`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    
    console.log('✅ Created 5 tables')
    
    // Create settings
    await db.collection('RestaurantSettings').insertOne({
      restaurantId: restaurant.insertedId,
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
    
    console.log('\n🎉 Test user with completed onboarding created!')
    console.log('\n📝 Test-Account (Onboarding abgeschlossen):')
    console.log('   Email: test@ordero.de')
    console.log('   Passwort: test123')
    console.log('\n🔗 Direkter Zugang:')
    console.log('   Dashboard: http://localhost:3000/dashboard')
    console.log('   Speisekarte verwalten: http://localhost:3000/dashboard/menu')
    console.log('   Bestellungen: http://localhost:3000/dashboard/orders')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

createCompleteTestUser()