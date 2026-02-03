const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoRestaurants() {
  try {
    console.log('🚀 Erstelle Demo-Restaurants...\n');

    // 1. Demo-Owner erstellen
    const hashedPassword = await bcrypt.hash('Demo123!', 10);
    
    const demoOwner = await prisma.user.upsert({
      where: { email: 'demo@oriido.com' },
      update: {},
      create: {
        email: 'demo@oriido.com',
        name: 'Demo Owner',
        password: hashedPassword,
        role: 'RESTAURANT_OWNER',
        emailVerified: new Date()
      }
    });
    console.log('✅ Demo-Owner erstellt');

    // 2. Deutsches Restaurant
    const restaurantDE = await prisma.restaurant.upsert({
      where: { slug: 'oriido-demo-de' },
      update: {},
      create: {
        name: 'Oriido Restaurant Germany',
        slug: 'oriido-demo-de',
        description: 'Erleben Sie kulinarische Vielfalt in unserem All-in-One Restaurant',
        email: 'demo-de@oriido.com',
        phone: '+49 89 12345678',
        street: 'Marienplatz 1',
        city: 'München',
        postalCode: '80331',
        country: 'DE',
        language: 'de',
        logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
        banner: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
        primaryColor: '#EA580C',
        ownerId: demoOwner.id,
        status: 'ACTIVE',
        plan: 'DE_PAY_PER_ORDER',
        payPerOrderEnabled: true,
        billingEnabled: true
      }
    });
    console.log('✅ Deutsches Restaurant erstellt');

    // Restaurant Settings
    await prisma.restaurantSettings.upsert({
      where: { restaurantId: restaurantDE.id },
      update: {},
      create: {
        restaurantId: restaurantDE.id,
        orderingEnabled: true,
        requireTableNumber: true,
        allowTakeaway: true,
        allowDelivery: false,
        acceptCash: true,
        acceptCard: true,
        acceptStripe: true,
        serviceFeePercent: 10,
        serviceFeeType: 'PERCENTAGE',
        currency: 'EUR',
        language: 'de',
        timezone: 'Europe/Berlin'
      }
    });

    // 3. Kategorien für deutsches Restaurant
    const vorspeisen = await prisma.category.create({
      data: {
        name: 'Vorspeisen',
        sortOrder: 1,
        isActive: true,
        restaurantId: restaurantDE.id
      }
    });

    const hauptgerichte = await prisma.category.create({
      data: {
        name: 'Hauptgerichte',
        sortOrder: 2,
        isActive: true,
        restaurantId: restaurantDE.id
      }
    });

    const desserts = await prisma.category.create({
      data: {
        name: 'Desserts',
        sortOrder: 3,
        isActive: true,
        restaurantId: restaurantDE.id
      }
    });

    const getraenke = await prisma.category.create({
      data: {
        name: 'Getränke',
        sortOrder: 4,
        isActive: true,
        restaurantId: restaurantDE.id
      }
    });

    // 4. Menü-Items hinzufügen
    // Vorspeisen
    await prisma.menuItem.create({
      data: {
        name: 'Bruschetta Classica',
        description: 'Geröstetes Brot mit frischen Tomaten, Basilikum und Knoblauch',
        price: 8.90,
        image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=800',
        isAvailable: true,
        isActive: true,
        categoryId: vorspeisen.id,
        restaurantId: restaurantDE.id,
        sortOrder: 1
      }
    });

    await prisma.menuItem.create({
      data: {
        name: 'Tomatensuppe',
        description: 'Hausgemachte Tomatensuppe mit Basilikum',
        price: 6.90,
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800',
        isAvailable: true,
        isActive: true,
        categoryId: vorspeisen.id,
        restaurantId: restaurantDE.id,
        sortOrder: 2
      }
    });

    // Hauptgerichte
    const pizza = await prisma.menuItem.create({
      data: {
        name: 'Pizza Margherita',
        description: 'Tomatensauce, Mozzarella, Basilikum',
        price: 12.90,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
        isAvailable: true,
        isActive: true,
        categoryId: hauptgerichte.id,
        restaurantId: restaurantDE.id,
        sortOrder: 1
      }
    });

    const burger = await prisma.menuItem.create({
      data: {
        name: 'Classic Burger',
        description: '200g Rindfleisch, Salat, Tomate, Zwiebel, Burgersauce',
        price: 14.90,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
        isAvailable: true,
        isActive: true,
        categoryId: hauptgerichte.id,
        restaurantId: restaurantDE.id,
        sortOrder: 2
      }
    });

    await prisma.menuItem.create({
      data: {
        name: 'Wiener Schnitzel',
        description: 'Paniertes Kalbsschnitzel mit Pommes und Preiselbeeren',
        price: 22.90,
        image: 'https://images.unsplash.com/photo-1599921841143-819065280b44?w=800',
        isAvailable: true,
        isActive: true,
        categoryId: hauptgerichte.id,
        restaurantId: restaurantDE.id,
        sortOrder: 3
      }
    });

    // Desserts
    await prisma.menuItem.create({
      data: {
        name: 'Tiramisu',
        description: 'Klassisches italienisches Dessert',
        price: 7.90,
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800',
        isAvailable: true,
        isActive: true,
        categoryId: desserts.id,
        restaurantId: restaurantDE.id,
        sortOrder: 1
      }
    });

    // Getränke
    await prisma.menuItem.create({
      data: {
        name: 'Coca Cola',
        description: 'Erfrischungsgetränk',
        price: 3.90,
        image: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800',
        isAvailable: true,
        isActive: true,
        categoryId: getraenke.id,
        restaurantId: restaurantDE.id,
        sortOrder: 1
      }
    });

    // 5. Tische erstellen
    for (let i = 1; i <= 15; i++) {
      await prisma.table.create({
        data: {
          number: i,
          name: `Tisch ${i}`,
          seats: i <= 6 ? 2 : 4,
          area: i <= 10 ? 'Innen' : 'Terrasse',
          qrCode: `https://www.oriido.com/oriido-demo-de/table/${i}`,
          isActive: true,
          restaurantId: restaurantDE.id
        }
      });
    }
    console.log('✅ 15 Tische erstellt');

    // 6. Arabisches Restaurant
    const restaurantJO = await prisma.restaurant.upsert({
      where: { slug: 'oriido-demo-jo' },
      update: {},
      create: {
        name: 'مطعم أوريدو الأردن',
        slug: 'oriido-demo-jo',
        description: 'استمتع بأشهى الأطباق العربية والعالمية',
        email: 'demo-jo@oriido.com',
        phone: '+962 6 1234567',
        street: 'شارع الرينبو',
        city: 'عمان',
        postalCode: '11181',
        country: 'JO',
        language: 'ar',
        logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
        banner: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200',
        primaryColor: '#EA580C',
        ownerId: demoOwner.id,
        status: 'ACTIVE',
        plan: 'JO_PAY_PER_ORDER',
        payPerOrderEnabled: true,
        billingEnabled: true
      }
    });
    console.log('✅ Arabisches Restaurant erstellt');

    // Restaurant Settings für arabisches Restaurant
    await prisma.restaurantSettings.upsert({
      where: { restaurantId: restaurantJO.id },
      update: {},
      create: {
        restaurantId: restaurantJO.id,
        orderingEnabled: true,
        requireTableNumber: true,
        allowTakeaway: true,
        allowDelivery: true,
        acceptCash: true,
        acceptCard: true,
        acceptPaytabs: true,
        serviceFeePercent: 10,
        serviceFeeType: 'PERCENTAGE',
        currency: 'JOD',
        language: 'ar',
        timezone: 'Asia/Amman'
      }
    });

    // 7. Kategorien für arabisches Restaurant
    const mezze = await prisma.category.create({
      data: {
        name: 'المقبلات',
        sortOrder: 1,
        isActive: true,
        restaurantId: restaurantJO.id
      }
    });

    const grills = await prisma.category.create({
      data: {
        name: 'المشاوي',
        sortOrder: 2,
        isActive: true,
        restaurantId: restaurantJO.id
      }
    });

    const sweets = await prisma.category.create({
      data: {
        name: 'الحلويات',
        sortOrder: 3,
        isActive: true,
        restaurantId: restaurantJO.id
      }
    });

    const drinks = await prisma.category.create({
      data: {
        name: 'المشروبات',
        sortOrder: 4,
        isActive: true,
        restaurantId: restaurantJO.id
      }
    });

    // 8. Arabische Menü-Items
    await prisma.menuItem.create({
      data: {
        name: 'حمص',
        description: 'حمص بالطحينة مع زيت الزيتون والخبز العربي',
        price: 2.50,
        image: 'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=800',
        isAvailable: true,
        isActive: true,
        categoryId: mezze.id,
        restaurantId: restaurantJO.id,
        sortOrder: 1
      }
    });

    await prisma.menuItem.create({
      data: {
        name: 'فلافل',
        description: 'ست قطع فلافل مقرمشة مع صلصة الطحينة والخضار',
        price: 3.00,
        image: 'https://images.unsplash.com/photo-1593001872117-56a5d3b6e7b1?w=800',
        isAvailable: true,
        isActive: true,
        categoryId: mezze.id,
        restaurantId: restaurantJO.id,
        sortOrder: 2
      }
    });

    await prisma.menuItem.create({
      data: {
        name: 'متبل',
        description: 'باذنجان مشوي مع الطحينة والثوم وزيت الزيتون',
        price: 2.75,
        image: 'https://images.unsplash.com/photo-1530469912745-a215c6b256ea?w=800',
        isAvailable: true,
        isActive: true,
        categoryId: mezze.id,
        restaurantId: restaurantJO.id,
        sortOrder: 3
      }
    });

    await prisma.menuItem.create({
      data: {
        name: 'كباب لحم',
        description: 'ثلاث أسياخ كباب لحم مشوي مع الأرز والخضار المشوية',
        price: 8.50,
        image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800',
        isAvailable: true,
        isActive: true,
        categoryId: grills.id,
        restaurantId: restaurantJO.id,
        sortOrder: 1
      }
    });

    await prisma.menuItem.create({
      data: {
        name: 'شاورما عربي',
        description: 'شاورما لحم أو دجاج بالطريقة الأردنية الأصيلة',
        price: 4.00,
        image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800',
        isAvailable: true,
        isActive: true,
        categoryId: grills.id,
        restaurantId: restaurantJO.id,
        sortOrder: 2
      }
    });

    await prisma.menuItem.create({
      data: {
        name: 'مشاوي مشكلة',
        description: 'طبق مشاوي مشكل: كباب، شيش طاووق، ريش لحم مع الأرز',
        price: 12.50,
        image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800',
        isAvailable: true,
        isActive: true,
        categoryId: grills.id,
        restaurantId: restaurantJO.id,
        sortOrder: 3
      }
    });

    await prisma.menuItem.create({
      data: {
        name: 'كنافة نابلسية',
        description: 'كنافة ساخنة بالجبنة النابلسية والقطر',
        price: 4.00,
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
        isAvailable: true,
        isActive: true,
        categoryId: sweets.id,
        restaurantId: restaurantJO.id,
        sortOrder: 1
      }
    });

    await prisma.menuItem.create({
      data: {
        name: 'بقلاوة',
        description: 'حلوى البقلاوة بالفستق الحلبي والعسل',
        price: 3.50,
        image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800',
        isAvailable: true,
        isActive: true,
        categoryId: sweets.id,
        restaurantId: restaurantJO.id,
        sortOrder: 2
      }
    });

    await prisma.menuItem.create({
      data: {
        name: 'شاي بالميرمية',
        description: 'شاي أردني أصيل بالميرمية الطبيعية',
        price: 1.50,
        image: 'https://images.unsplash.com/photo-1594631661960-34762327295a?w=800',
        isAvailable: true,
        isActive: true,
        categoryId: drinks.id,
        restaurantId: restaurantJO.id,
        sortOrder: 1
      }
    });

    await prisma.menuItem.create({
      data: {
        name: 'قهوة عربية',
        description: 'قهوة عربية أصيلة بالهيل',
        price: 2.00,
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800',
        isAvailable: true,
        isActive: true,
        categoryId: drinks.id,
        restaurantId: restaurantJO.id,
        sortOrder: 2
      }
    });

    // 9. Tische für arabisches Restaurant
    for (let i = 1; i <= 20; i++) {
      await prisma.table.create({
        data: {
          number: i,
          name: `طاولة ${i}`,
          seats: i <= 8 ? 2 : i <= 16 ? 4 : 6,
          area: i <= 15 ? 'داخلي' : 'شرفة',
          qrCode: `https://www.oriido.com/oriido-demo-jo/table/${i}`,
          isActive: true,
          restaurantId: restaurantJO.id
        }
      });
    }
    console.log('✅ 20 Tische für arabisches Restaurant erstellt');

    console.log('\n✨ Demo-Restaurants erfolgreich erstellt!');
    console.log('\n📝 Login-Daten:');
    console.log('   Email: demo@oriido.com');
    console.log('   Passwort: Demo123!\n');
    console.log('🔗 Restaurant URLs:');
    console.log('   Deutsch: https://www.oriido.com/oriido-demo-de');
    console.log('   Arabisch: https://www.oriido.com/oriido-demo-jo\n');

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoRestaurants().catch(console.error);