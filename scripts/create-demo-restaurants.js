const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Bilder URLs von Unsplash für verschiedene Speisen
const FOOD_IMAGES = {
  // Vorspeisen
  bruschetta: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=800',
  suppe: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800',
  salat: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
  carpaccio: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800',
  
  // Hauptgerichte
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
  pasta: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
  steak: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
  schnitzel: 'https://images.unsplash.com/photo-1599921841143-819065280b44?w=800',
  fisch: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=800',
  
  // Arabische Gerichte
  shawarma: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800',
  falafel: 'https://images.unsplash.com/photo-1593001872117-56a5d3b6e7b1?w=800',
  hummus: 'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=800',
  kebab: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800',
  mansaf: 'https://images.unsplash.com/photo-1547532182-bf296f6be875?w=800',
  
  // Desserts
  tiramisu: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800',
  eis: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=800',
  kuchen: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
  
  // Getränke
  kaffee: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800',
  saft: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800',
  cocktail: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800',
  tee: 'https://images.unsplash.com/photo-1594631661960-34762327295a?w=800',
  
  // Restaurant Logo
  logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'
};

async function createDemoRestaurants() {
  try {
    console.log('🚀 Erstelle Demo-Restaurants...\n');

    // 1. Erstelle Demo-User (Owner)
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

    // 2. Erstelle deutsches Restaurant
    const restaurantDE = await prisma.restaurant.upsert({
      where: { slug: 'oriido-demo-de' },
      update: {},
      create: {
        name: 'Oriido Restaurant Germany',
        slug: 'oriido-demo-de',
        description: 'Erleben Sie kulinarische Vielfalt in unserem All-in-One Restaurant. Von traditionellen deutschen Gerichten bis zu internationalen Spezialitäten.',
        email: 'demo-de@oriido.com',
        phone: '+49 89 12345678',
        street: 'Marienplatz 1',
        city: 'München',
        postalCode: '80331',
        country: 'DE',
        language: 'de',
        logo: FOOD_IMAGES.logo,
        banner: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
        
        // Owner
        ownerId: demoOwner.id,
        
        // Status
        status: 'ACTIVE',
        
        // Billing
        plan: 'DE_PAY_PER_ORDER',
        payPerOrderEnabled: true,
        billingEnabled: true
      }
    });
    console.log('✅ Deutsches Restaurant erstellt');

    // Erstelle Restaurant Settings für deutsches Restaurant
    await prisma.restaurantSettings.create({
      data: {
        restaurantId: restaurantDE.id,
        orderingEnabled: true,
        requireTableNumber: true,
        allowTakeaway: true,
        allowDelivery: false,
        autoAcceptOrders: false,
        acceptCash: true,
        acceptCard: true,
        acceptStripe: true,
        openingHours: JSON.stringify({
          monday: { open: '11:00', close: '22:00', isClosed: false },
          tuesday: { open: '11:00', close: '22:00', isClosed: false },
          wednesday: { open: '11:00', close: '22:00', isClosed: false },
          thursday: { open: '11:00', close: '22:00', isClosed: false },
          friday: { open: '11:00', close: '23:00', isClosed: false },
          saturday: { open: '12:00', close: '23:00', isClosed: false },
          sunday: { open: '12:00', close: '21:00', isClosed: false }
        }),
        serviceFeePercent: 10,
        serviceFeeType: 'PERCENTAGE',
        taxRate: 0,
        includeTax: false,
        currency: 'EUR',
        language: 'de',
        timezone: 'Europe/Berlin'
      }
    });

    // 3. Erstelle Kategorien und Menü für deutsches Restaurant
    const categoriesDE = [
      { name: 'Vorspeisen', sortOrder: 1, isActive: true },
      { name: 'Suppen', sortOrder: 2, isActive: true },
      { name: 'Salate', sortOrder: 3, isActive: true },
      { name: 'Pizza', sortOrder: 4, isActive: true },
      { name: 'Pasta', sortOrder: 5, isActive: true },
      { name: 'Burger & Sandwiches', sortOrder: 6, isActive: true },
      { name: 'Hauptgerichte', sortOrder: 7, isActive: true },
      { name: 'Desserts', sortOrder: 8, isActive: true },
      { name: 'Getränke', sortOrder: 9, isActive: true }
    ];

    for (const cat of categoriesDE) {
      const category = await prisma.category.create({
        data: {
          ...cat,
          restaurantId: restaurantDE.id
        }
      });

      // Füge Menü-Items hinzu
      const items = getItemsForCategory(cat.name);
      for (const item of items) {
        await prisma.menuItem.create({
          data: {
            ...item,
            categoryId: category.id,
            restaurantId: restaurantDE.id
          }
        });
      }
    }
    console.log('✅ Deutsches Menü erstellt');

    // 4. Erstelle Tische für deutsches Restaurant
    for (let i = 1; i <= 20; i++) {
      await prisma.table.create({
        data: {
          tableNumber: i,
          capacity: i <= 4 ? 2 : i <= 12 ? 4 : 6,
          location: i <= 10 ? 'Innen' : 'Terrasse',
          restaurantId: restaurantDE.id
        }
      });
    }
    console.log('✅ 20 Tische für deutsches Restaurant erstellt');

    // 5. Erstelle arabisches Restaurant
    const restaurantJO = await prisma.restaurant.upsert({
      where: { slug: 'oriido-demo-jo' },
      update: {},
      create: {
        name: 'مطعم أوريدو الأردن',
        slug: 'oriido-demo-jo',
        description: 'استمتع بأشهى الأطباق العربية والعالمية في مطعمنا. نقدم تشكيلة واسعة من الأطباق التقليدية والحديثة.',
        email: 'demo-jo@oriido.com',
        phone: '+962 6 1234567',
        street: 'شارع الرينبو',
        city: 'عمان',
        postalCode: '11181',
        country: 'JO',
        language: 'ar',
        logo: FOOD_IMAGES.logo,
        banner: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200',
        
        // Owner
        ownerId: demoOwner.id,
        
        // Status
        status: 'ACTIVE',
        
        // Billing
        plan: 'JO_PAY_PER_ORDER',
        payPerOrderEnabled: true,
        billingEnabled: true
      }
    });
    console.log('✅ Arabisches Restaurant erstellt');

    // Erstelle Restaurant Settings für arabisches Restaurant
    await prisma.restaurantSettings.create({
      data: {
        restaurantId: restaurantJO.id,
        orderingEnabled: true,
        requireTableNumber: true,
        allowTakeaway: true,
        allowDelivery: true,
        autoAcceptOrders: false,
        acceptCash: true,
        acceptCard: true,
        acceptPaytabs: true,
        openingHours: JSON.stringify({
          monday: { open: '11:00', close: '23:00', isClosed: false },
          tuesday: { open: '11:00', close: '23:00', isClosed: false },
          wednesday: { open: '11:00', close: '23:00', isClosed: false },
          thursday: { open: '11:00', close: '23:00', isClosed: false },
          friday: { open: '13:00', close: '24:00', isClosed: false },
          saturday: { open: '11:00', close: '24:00', isClosed: false },
          sunday: { open: '11:00', close: '23:00', isClosed: false }
        }),
        serviceFeePercent: 10,
        serviceFeeType: 'PERCENTAGE',
        taxRate: 0,
        includeTax: false,
        currency: 'JOD',
        language: 'ar',
        timezone: 'Asia/Amman'
      }
    });

    // 6. Erstelle Kategorien und Menü für arabisches Restaurant
    const categoriesJO = [
      { name: 'المقبلات', sortOrder: 1, isActive: true },
      { name: 'الشوربات', sortOrder: 2, isActive: true },
      { name: 'السلطات', sortOrder: 3, isActive: true },
      { name: 'المشاوي', sortOrder: 4, isActive: true },
      { name: 'الأطباق الرئيسية', sortOrder: 5, isActive: true },
      { name: 'الساندويشات', sortOrder: 6, isActive: true },
      { name: 'الحلويات', sortOrder: 7, isActive: true },
      { name: 'المشروبات', sortOrder: 8, isActive: true }
    ];

    for (const cat of categoriesJO) {
      const category = await prisma.category.create({
        data: {
          ...cat,
          restaurantId: restaurantJO.id
        }
      });

      // Füge Menü-Items hinzu
      const items = getArabicItemsForCategory(cat.name);
      for (const item of items) {
        await prisma.menuItem.create({
          data: {
            ...item,
            categoryId: category.id,
            restaurantId: restaurantJO.id
          }
        });
      }
    }
    console.log('✅ Arabisches Menü erstellt');

    // 7. Erstelle Tische für arabisches Restaurant
    for (let i = 1; i <= 25; i++) {
      await prisma.table.create({
        data: {
          tableNumber: i,
          capacity: i <= 5 ? 2 : i <= 15 ? 4 : i <= 20 ? 6 : 8,
          location: i <= 15 ? 'داخلي' : 'شرفة',
          restaurantId: restaurantJO.id
        }
      });
    }
    console.log('✅ 25 Tische für arabisches Restaurant erstellt');

    console.log('\n✨ Demo-Restaurants erfolgreich erstellt!');
    console.log('\n📝 Login-Daten:');
    console.log('   Email: demo@oriido.com');
    console.log('   Passwort: Demo123!\n');
    console.log('🔗 Restaurant URLs:');
    console.log('   Deutsch: /oriido-demo-de');
    console.log('   Arabisch: /oriido-demo-jo\n');

  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Demo-Restaurants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Hilfsfunktion für deutsche Menü-Items
function getItemsForCategory(categoryName) {
  const items = {
    'Vorspeisen': [
      {
        name: 'Bruschetta Classica',
        description: 'Geröstetes Brot mit frischen Tomaten, Basilikum und Knoblauch',
        price: 8.90,
        image: FOOD_IMAGES.bruschetta,
        isAvailable: true,
        preparationTime: 10,
        isVegetarian: true
      },
      {
        name: 'Carpaccio di Manzo',
        description: 'Hauchdünne Rinderscheiben mit Rucola, Parmesan und Zitronendressing',
        price: 14.90,
        image: FOOD_IMAGES.carpaccio,
        isAvailable: true,
        preparationTime: 10
      },
      {
        name: 'Antipasti Misti',
        description: 'Gemischte italienische Vorspeisen',
        price: 16.90,
        image: FOOD_IMAGES.bruschetta,
        isAvailable: true,
        preparationTime: 15,
        isVegetarian: true
      }
    ],
    'Suppen': [
      {
        name: 'Tomatensuppe',
        description: 'Hausgemachte Tomatensuppe mit Basilikum und Sahne',
        price: 6.90,
        image: FOOD_IMAGES.suppe,
        isAvailable: true,
        preparationTime: 10,
        isVegetarian: true
      },
      {
        name: 'Zwiebelsuppe',
        description: 'Französische Zwiebelsuppe mit überbackenem Käse',
        price: 7.90,
        image: FOOD_IMAGES.suppe,
        isAvailable: true,
        preparationTime: 15,
        isVegetarian: true
      }
    ],
    'Salate': [
      {
        name: 'Caesar Salad',
        description: 'Römersalat mit Caesar-Dressing, Croutons und Parmesan',
        price: 12.90,
        image: FOOD_IMAGES.salat,
        isAvailable: true,
        preparationTime: 10,
        variants: [
          { name: 'Klein', price: 9.90 },
          { name: 'Groß', price: 12.90 },
          { name: 'Mit Hähnchen', price: 15.90 }
        ]
      },
      {
        name: 'Griechischer Salat',
        description: 'Mit Feta, Oliven, Tomaten, Gurken und Zwiebeln',
        price: 11.90,
        image: FOOD_IMAGES.salat,
        isAvailable: true,
        preparationTime: 10,
        isVegetarian: true
      }
    ],
    'Pizza': [
      {
        name: 'Pizza Margherita',
        description: 'Tomatensauce, Mozzarella, Basilikum',
        price: 12.90,
        image: FOOD_IMAGES.pizza,
        isAvailable: true,
        preparationTime: 15,
        isVegetarian: true,
        variants: [
          { name: '25cm', price: 9.90 },
          { name: '30cm', price: 12.90 },
          { name: '35cm', price: 15.90 }
        ]
      },
      {
        name: 'Pizza Salami',
        description: 'Tomatensauce, Mozzarella, italienische Salami',
        price: 14.90,
        image: FOOD_IMAGES.pizza,
        isAvailable: true,
        preparationTime: 15,
        variants: [
          { name: '25cm', price: 11.90 },
          { name: '30cm', price: 14.90 },
          { name: '35cm', price: 17.90 }
        ]
      },
      {
        name: 'Pizza Quattro Formaggi',
        description: 'Vier verschiedene Käsesorten',
        price: 15.90,
        image: FOOD_IMAGES.pizza,
        isAvailable: true,
        preparationTime: 15,
        isVegetarian: true
      }
    ],
    'Pasta': [
      {
        name: 'Spaghetti Carbonara',
        description: 'Mit Speck, Ei und Parmesan',
        price: 13.90,
        image: FOOD_IMAGES.pasta,
        isAvailable: true,
        preparationTime: 15
      },
      {
        name: 'Penne Arrabbiata',
        description: 'Scharfe Tomatensauce mit Knoblauch und Chili',
        price: 11.90,
        image: FOOD_IMAGES.pasta,
        isAvailable: true,
        preparationTime: 15,
        isVegetarian: true,
        isSpicy: true
      },
      {
        name: 'Tagliatelle al Salmone',
        description: 'Bandnudeln mit Lachs in Sahnesauce',
        price: 16.90,
        image: FOOD_IMAGES.pasta,
        isAvailable: true,
        preparationTime: 20
      }
    ],
    'Burger & Sandwiches': [
      {
        name: 'Classic Burger',
        description: '200g Rindfleisch, Salat, Tomate, Zwiebel, Gurke, Burgersauce',
        price: 14.90,
        image: FOOD_IMAGES.burger,
        isAvailable: true,
        preparationTime: 20,
        extras: [
          { name: 'Extra Bacon', price: 2.50 },
          { name: 'Extra Käse', price: 1.50 },
          { name: 'Extra Patty', price: 4.00 }
        ]
      },
      {
        name: 'Cheeseburger',
        description: '200g Rindfleisch mit doppelt Käse',
        price: 15.90,
        image: FOOD_IMAGES.burger,
        isAvailable: true,
        preparationTime: 20
      },
      {
        name: 'Veggie Burger',
        description: 'Hausgemachter Gemüsepatty mit frischem Gemüse',
        price: 13.90,
        image: FOOD_IMAGES.burger,
        isAvailable: true,
        preparationTime: 20,
        isVegetarian: true
      }
    ],
    'Hauptgerichte': [
      {
        name: 'Wiener Schnitzel',
        description: 'Paniertes Kalbsschnitzel mit Pommes und Preiselbeeren',
        price: 24.90,
        image: FOOD_IMAGES.schnitzel,
        isAvailable: true,
        preparationTime: 25
      },
      {
        name: 'Rindersteak',
        description: '250g argentinisches Rindersteak mit Kräuterbutter',
        price: 32.90,
        image: FOOD_IMAGES.steak,
        isAvailable: true,
        preparationTime: 30,
        variants: [
          { name: 'Medium Rare', price: 32.90 },
          { name: 'Medium', price: 32.90 },
          { name: 'Well Done', price: 32.90 }
        ]
      },
      {
        name: 'Lachsfilet',
        description: 'Gegrilltes Lachsfilet mit Zitronenbutter und Gemüse',
        price: 26.90,
        image: FOOD_IMAGES.fisch,
        isAvailable: true,
        preparationTime: 25
      }
    ],
    'Desserts': [
      {
        name: 'Tiramisu',
        description: 'Klassisches italienisches Dessert',
        price: 7.90,
        image: FOOD_IMAGES.tiramisu,
        isAvailable: true,
        preparationTime: 5,
        isVegetarian: true
      },
      {
        name: 'Panna Cotta',
        description: 'Mit Beerensauce',
        price: 6.90,
        image: FOOD_IMAGES.tiramisu,
        isAvailable: true,
        preparationTime: 5,
        isVegetarian: true
      },
      {
        name: 'Schokoladenkuchen',
        description: 'Warmer Schokoladenkuchen mit flüssigem Kern',
        price: 8.90,
        image: FOOD_IMAGES.kuchen,
        isAvailable: true,
        preparationTime: 10,
        isVegetarian: true
      }
    ],
    'Getränke': [
      {
        name: 'Coca Cola',
        description: '0.33l',
        price: 3.90,
        image: FOOD_IMAGES.saft,
        isAvailable: true,
        preparationTime: 2,
        variants: [
          { name: '0.33l', price: 3.90 },
          { name: '0.5l', price: 4.90 }
        ]
      },
      {
        name: 'Orangensaft',
        description: 'Frisch gepresst',
        price: 4.90,
        image: FOOD_IMAGES.saft,
        isAvailable: true,
        preparationTime: 5,
        isVegetarian: true
      },
      {
        name: 'Cappuccino',
        description: 'Italienischer Kaffee',
        price: 3.50,
        image: FOOD_IMAGES.kaffee,
        isAvailable: true,
        preparationTime: 5,
        isVegetarian: true
      }
    ]
  };

  return items[categoryName] || [];
}

// Hilfsfunktion für arabische Menü-Items
function getArabicItemsForCategory(categoryName) {
  const items = {
    'المقبلات': [
      {
        name: 'حمص',
        description: 'حمص مع زيت الزيتون والطحينة',
        price: 2.50,
        image: FOOD_IMAGES.hummus,
        isAvailable: true,
        preparationTime: 5,
        isVegetarian: true
      },
      {
        name: 'متبل',
        description: 'باذنجان مشوي مع الطحينة',
        price: 2.75,
        image: FOOD_IMAGES.hummus,
        isAvailable: true,
        preparationTime: 5,
        isVegetarian: true
      },
      {
        name: 'فلافل',
        description: '6 قطع فلافل مع الطحينة',
        price: 3.00,
        image: FOOD_IMAGES.falafel,
        isAvailable: true,
        preparationTime: 10,
        isVegetarian: true
      }
    ],
    'الشوربات': [
      {
        name: 'شوربة العدس',
        description: 'شوربة عدس أحمر بالطريقة التقليدية',
        price: 2.00,
        image: FOOD_IMAGES.suppe,
        isAvailable: true,
        preparationTime: 10,
        isVegetarian: true
      },
      {
        name: 'شوربة الدجاج',
        description: 'شوربة دجاج بالخضار',
        price: 2.50,
        image: FOOD_IMAGES.suppe,
        isAvailable: true,
        preparationTime: 10
      }
    ],
    'السلطات': [
      {
        name: 'سلطة فتوش',
        description: 'خضار طازجة مع الخبز المحمص ودبس الرمان',
        price: 3.50,
        image: FOOD_IMAGES.salat,
        isAvailable: true,
        preparationTime: 10,
        isVegetarian: true
      },
      {
        name: 'تبولة',
        description: 'بقدونس، برغل، طماطم، نعناع',
        price: 3.00,
        image: FOOD_IMAGES.salat,
        isAvailable: true,
        preparationTime: 10,
        isVegetarian: true
      }
    ],
    'المشاوي': [
      {
        name: 'كباب لحم',
        description: 'سيخين كباب لحم مع الأرز والخضار',
        price: 8.50,
        image: FOOD_IMAGES.kebab,
        isAvailable: true,
        preparationTime: 20
      },
      {
        name: 'شيش طاووق',
        description: 'قطع دجاج مشوية متبلة',
        price: 7.00,
        image: FOOD_IMAGES.kebab,
        isAvailable: true,
        preparationTime: 20
      },
      {
        name: 'مشاوي مشكلة',
        description: 'تشكيلة من اللحوم المشوية',
        price: 12.00,
        image: FOOD_IMAGES.kebab,
        isAvailable: true,
        preparationTime: 25,
        variants: [
          { name: 'شخص واحد', price: 12.00 },
          { name: 'شخصين', price: 22.00 },
          { name: 'عائلي', price: 40.00 }
        ]
      }
    ],
    'الأطباق الرئيسية': [
      {
        name: 'منسف أردني',
        description: 'لحم خاروف مع الأرز واللبن الجميد',
        price: 15.00,
        image: FOOD_IMAGES.mansaf,
        isAvailable: true,
        preparationTime: 30,
        isFeatured: true
      },
      {
        name: 'مقلوبة',
        description: 'أرز مع الدجاج والخضار المقلية',
        price: 10.00,
        image: FOOD_IMAGES.mansaf,
        isAvailable: true,
        preparationTime: 25
      },
      {
        name: 'محاشي',
        description: 'كوسا وباذنجان وورق عنب محشي',
        price: 9.00,
        image: FOOD_IMAGES.mansaf,
        isAvailable: true,
        preparationTime: 25,
        isVegetarian: true
      }
    ],
    'الساندويشات': [
      {
        name: 'شاورما لحم',
        description: 'شاورما لحم بالخبز العربي',
        price: 3.50,
        image: FOOD_IMAGES.shawarma,
        isAvailable: true,
        preparationTime: 10,
        variants: [
          { name: 'عادي', price: 3.50 },
          { name: 'سوبر', price: 4.50 },
          { name: 'دبل', price: 5.50 }
        ]
      },
      {
        name: 'شاورما دجاج',
        description: 'شاورما دجاج بالثوم',
        price: 3.00,
        image: FOOD_IMAGES.shawarma,
        isAvailable: true,
        preparationTime: 10
      },
      {
        name: 'فلافل ساندويش',
        description: 'فلافل بالخبز مع الخضار والطحينة',
        price: 2.00,
        image: FOOD_IMAGES.falafel,
        isAvailable: true,
        preparationTime: 10,
        isVegetarian: true
      }
    ],
    'الحلويات': [
      {
        name: 'كنافة',
        description: 'كنافة نابلسية بالجبنة',
        price: 4.00,
        image: FOOD_IMAGES.kuchen,
        isAvailable: true,
        preparationTime: 10,
        isVegetarian: true
      },
      {
        name: 'بقلاوة',
        description: 'بقلاوة مشكلة',
        price: 3.50,
        image: FOOD_IMAGES.kuchen,
        isAvailable: true,
        preparationTime: 5,
        isVegetarian: true
      },
      {
        name: 'مهلبية',
        description: 'حلوى الحليب بالورد',
        price: 2.50,
        image: FOOD_IMAGES.tiramisu,
        isAvailable: true,
        preparationTime: 5,
        isVegetarian: true
      }
    ],
    'المشروبات': [
      {
        name: 'عصير ليمون بالنعناع',
        description: 'عصير طازج',
        price: 2.00,
        image: FOOD_IMAGES.saft,
        isAvailable: true,
        preparationTime: 5,
        isVegetarian: true
      },
      {
        name: 'شاي أردني',
        description: 'شاي بالميرمية',
        price: 1.50,
        image: FOOD_IMAGES.tee,
        isAvailable: true,
        preparationTime: 5,
        isVegetarian: true,
        variants: [
          { name: 'صغير', price: 1.00 },
          { name: 'كبير', price: 1.50 }
        ]
      },
      {
        name: 'قهوة عربية',
        description: 'قهوة عربية أصيلة',
        price: 2.00,
        image: FOOD_IMAGES.kaffee,
        isAvailable: true,
        preparationTime: 5,
        isVegetarian: true
      }
    ]
  };

  return items[categoryName] || [];
}

// Script ausführen
createDemoRestaurants().catch(console.error);