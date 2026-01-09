const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Für lokale Entwicklung - später durch MongoDB Atlas ersetzen
const MONGODB_URI = 'mongodb://localhost:27017/ordero';

async function seed() {
  console.log('🌱 Seeding MongoDB...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('ordero');
    
    // Clear existing data
    await db.collection('User').deleteMany({});
    await db.collection('Restaurant').deleteMany({});
    await db.collection('Category').deleteMany({});
    await db.collection('MenuItem').deleteMany({});
    await db.collection('Table').deleteMany({});
    
    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    const demoUser = await db.collection('User').insertOne({
      email: 'demo@ordero.de',
      emailVerified: new Date(),
      password: hashedPassword,
      name: 'Demo User',
      phone: '+49 123 456789',
      role: 'RESTAURANT_OWNER',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Created demo user: demo@ordero.de');
    
    // Create demo restaurant
    const demoRestaurant = await db.collection('Restaurant').insertOne({
      name: 'Demo Restaurant',
      slug: 'demo-restaurant',
      description: 'Ein gemütliches Restaurant mit internationaler Küche',
      cuisine: 'International',
      street: 'Musterstraße 123',
      city: 'Berlin',
      postalCode: '10115',
      country: 'DE',
      phone: '+49 30 12345678',
      email: 'info@demo-restaurant.de',
      website: 'https://demo-restaurant.de',
      primaryColor: '#FF6B35',
      status: 'ACTIVE',
      plan: 'STANDARD',
      ownerId: demoUser.insertedId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Created demo restaurant');
    
    // Create categories
    const categories = [
      { name: 'Vorspeisen', icon: 'Salad', color: '#10B981' },
      { name: 'Hauptgerichte', icon: 'Pizza', color: '#F59E0B' },
      { name: 'Desserts', icon: 'IceCream', color: '#EC4899' },
      { name: 'Getränke', icon: 'Coffee', color: '#3B82F6' },
    ];
    
    for (let i = 0; i < categories.length; i++) {
      const category = await db.collection('Category').insertOne({
        restaurantId: demoRestaurant.insertedId,
        name: categories[i].name,
        icon: categories[i].icon,
        color: categories[i].color,
        sortOrder: i,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`✅ Created category: ${categories[i].name}`);
      
      // Add sample menu items
      if (categories[i].name === 'Vorspeisen') {
        await db.collection('MenuItem').insertMany([
          {
            categoryId: category.insertedId,
            restaurantId: demoRestaurant.insertedId,
            name: 'Bruschetta',
            description: 'Geröstetes Brot mit Tomaten, Knoblauch und Basilikum',
            price: 8.50,
            allergens: ['Gluten'],
            additives: [],
            tags: ['vegetarisch'],
            isActive: true,
            isAvailable: true,
            sortOrder: 0,
            variants: [],
            extras: [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            categoryId: category.insertedId,
            restaurantId: demoRestaurant.insertedId,
            name: 'Caesar Salat',
            description: 'Knackiger Salat mit Caesar-Dressing, Croutons und Parmesan',
            price: 12.90,
            allergens: ['Gluten', 'Milch', 'Ei'],
            additives: [],
            tags: [],
            isActive: true,
            isAvailable: true,
            sortOrder: 1,
            variants: [],
            extras: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);
      }
      
      if (categories[i].name === 'Hauptgerichte') {
        const pizza = await db.collection('MenuItem').insertOne({
          categoryId: category.insertedId,
          restaurantId: demoRestaurant.insertedId,
          name: 'Pizza Margherita',
          description: 'Klassische Pizza mit Tomatensauce, Mozzarella und Basilikum',
          price: 12.50,
          allergens: ['Gluten', 'Milch'],
          additives: [],
          tags: ['vegetarisch'],
          isActive: true,
          isAvailable: true,
          sortOrder: 0,
          variants: [
            { id: '1', name: 'Klein (26cm)', price: 10.50, sortOrder: 0 },
            { id: '2', name: 'Mittel (30cm)', price: 12.50, sortOrder: 1 },
            { id: '3', name: 'Groß (35cm)', price: 15.50, sortOrder: 2 }
          ],
          extras: [
            { id: '1', name: 'Extra Käse', price: 2.00, sortOrder: 0 },
            { id: '2', name: 'Oliven', price: 1.50, sortOrder: 1 },
            { id: '3', name: 'Salami', price: 2.50, sortOrder: 2 }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        });
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
      });
    }
    
    console.log('✅ Created 10 tables');
    
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
    });
    
    console.log('✅ Created restaurant settings');
    
    console.log('\n🎉 Seeding completed!');
    console.log('\n📝 Demo-Account:');
    console.log('   Email: demo@ordero.de');
    console.log('   Passwort: demo123');
    console.log('\n🔗 Gast-App:');
    console.log('   http://localhost:3000/r/demo-restaurant/tisch/1');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();