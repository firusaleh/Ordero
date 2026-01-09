const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database('./dev.db');

async function seed() {
  console.log('🌱 Creating demo account...');
  
  // Hash password
  const hashedPassword = await bcrypt.hash('demo123', 10);
  
  // Create demo user
  const userId = 'demo-user-' + Date.now();
  
  db.prepare(`
    INSERT OR REPLACE INTO User (
      id, email, password, name, phone, role, emailVerified, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    userId,
    'demo@ordero.de',
    hashedPassword,
    'Demo User',
    '+49 123 456789',
    'RESTAURANT_OWNER',
    new Date().toISOString()
  );
  
  console.log('✅ Created demo user: demo@ordero.de');
  
  // Create demo restaurant
  const restaurantId = 'demo-restaurant-' + Date.now();
  
  db.prepare(`
    INSERT OR REPLACE INTO Restaurant (
      id, name, slug, description, ownerId, street, city, postalCode, country,
      phone, email, website, cuisine, primaryColor, status, plan,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    restaurantId,
    'Demo Restaurant',
    'demo-restaurant',
    'Ein gemütliches Restaurant mit internationaler Küche',
    userId,
    'Musterstraße 123',
    'Berlin',
    '10115',
    'Deutschland',
    '+49 30 12345678',
    'info@demo-restaurant.de',
    'https://demo-restaurant.de',
    'International',
    '#FF6B35',
    'ACTIVE',
    'STANDARD'
  );
  
  console.log('✅ Created demo restaurant');
  
  // Create restaurant settings
  const settingsId = 'settings-' + Date.now();
  
  db.prepare(`
    INSERT OR REPLACE INTO RestaurantSettings (
      id, restaurantId, orderingEnabled, requireTableNumber, allowTakeaway,
      emailNotifications, soundNotifications, currency, language,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    settingsId,
    restaurantId,
    1, // orderingEnabled
    1, // requireTableNumber
    1, // allowTakeaway
    1, // emailNotifications
    1, // soundNotifications
    'EUR',
    'de'
  );
  
  console.log('✅ Created restaurant settings');
  
  // Create categories
  const categories = [
    { name: 'Vorspeisen', icon: 'Salad', color: '#10B981' },
    { name: 'Hauptgerichte', icon: 'Pizza', color: '#F59E0B' },
    { name: 'Desserts', icon: 'IceCream', color: '#EC4899' },
    { name: 'Getränke', icon: 'Coffee', color: '#3B82F6' },
  ];
  
  categories.forEach((cat, index) => {
    const categoryId = `category-${index}-` + Date.now();
    
    db.prepare(`
      INSERT INTO Category (
        id, restaurantId, name, icon, color, sortOrder, isActive,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      categoryId,
      restaurantId,
      cat.name,
      cat.icon,
      cat.color,
      index,
      1 // true
    );
    
    console.log(`✅ Created category: ${cat.name}`);
    
    // Add sample menu items
    if (cat.name === 'Vorspeisen') {
      const itemId1 = 'item-1-' + Date.now();
      db.prepare(`
        INSERT INTO MenuItem (
          id, categoryId, name, description, price, allergens, tags,
          sortOrder, isActive, isAvailable, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        itemId1,
        categoryId,
        'Bruschetta',
        'Geröstetes Brot mit Tomaten, Knoblauch und Basilikum',
        8.50,
        JSON.stringify(['Gluten']),
        JSON.stringify(['vegetarisch']),
        0,
        1, // true
        1  // true
      );
      
      const itemId2 = 'item-2-' + Date.now();
      db.prepare(`
        INSERT INTO MenuItem (
          id, categoryId, name, description, price, allergens, tags,
          sortOrder, isActive, isAvailable, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        itemId2,
        categoryId,
        'Caesar Salat',
        'Knackiger Salat mit Caesar-Dressing, Croutons und Parmesan',
        12.90,
        JSON.stringify(['Gluten', 'Milch', 'Ei']),
        JSON.stringify([]),
        1,
        1, // true
        1  // true
      );
    }
  });
  
  // Create tables
  for (let i = 1; i <= 10; i++) {
    const tableId = `table-${i}-` + Date.now();
    
    db.prepare(`
      INSERT INTO Table (
        id, restaurantId, number, name, seats, area, qrCode, isActive,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      tableId,
      restaurantId,
      i,
      `Tisch ${i}`,
      i <= 4 ? 2 : 4,
      i <= 5 ? 'Innenbereich' : 'Terrasse',
      `http://localhost:3000/r/demo-restaurant/tisch/${i}`,
      1 // true
    );
  }
  
  console.log('✅ Created 10 tables');
  
  console.log('\n🎉 Seeding completed!');
  console.log('\n📝 Demo-Account:');
  console.log('   Email: demo@ordero.de');
  console.log('   Passwort: demo123');
  console.log('\n🔗 Gast-App:');
  console.log('   http://localhost:3000/r/demo-restaurant/tisch/1');
}

seed().catch(console.error).finally(() => db.close());