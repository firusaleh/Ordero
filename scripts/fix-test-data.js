const { MongoClient } = require('mongodb')

async function fixTestData() {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017/ordero?replicaSet=rs0')
  
  try {
    await client.connect()
    const db = client.db()
    
    console.log('Fixing test data...')
    
    // Fix categories with admin text as description
    const result1 = await db.collection('Category').updateMany(
      { description: 'إدارة فئات وأصناف قائمتك' },
      { $set: { description: '' } }
    )
    console.log(`Fixed ${result1.modifiedCount} categories with admin text`)
    
    // Fix categories named "قائمة الطعام" - should have proper category names
    const categoriesResult = await db.collection('Category').find({ name: 'قائمة الطعام' }).toArray()
    
    if (categoriesResult.length > 0) {
      console.log(`Found ${categoriesResult.length} categories named 'قائمة الطعام'`)
      
      // If this is the only category, rename it to something proper
      for (const category of categoriesResult) {
        const restaurant = await db.collection('Restaurant').findOne({ _id: category.restaurantId })
        if (restaurant) {
          // Get all categories for this restaurant
          const allCategories = await db.collection('Category').find({ restaurantId: category.restaurantId }).toArray()
          
          if (allCategories.length === 1) {
            // If it's the only category, rename it to "Main Dishes" or similar
            await db.collection('Category').updateOne(
              { _id: category._id },
              { $set: { 
                name: 'الأطباق الرئيسية',
                description: ''
              }}
            )
            console.log(`Renamed category to 'الأطباق الرئيسية' for restaurant ${restaurant.name}`)
          } else {
            // If there are multiple categories with this name, give them unique names
            console.log(`Restaurant ${restaurant.name} has multiple categories, please check manually`)
          }
        }
      }
    }
    
    // Fix restaurants with "قائمة الطعام" as name
    const result2 = await db.collection('Restaurant').updateMany(
      { name: 'قائمة الطعام' },
      { $set: { name: 'مطعم تجريبي' } } // Demo Restaurant in Arabic
    )
    console.log(`Fixed ${result2.modifiedCount} restaurants with 'قائمة الطعام' as name`)
    
    // Remove any admin/dashboard text from category descriptions
    const adminTexts = [
      'إدارة فئات وأصناف قائمتك',
      'Manage your menu categories and items',
      'Verwalten Sie Ihre Menükategorien und -artikel'
    ]
    
    for (const text of adminTexts) {
      const result = await db.collection('Category').updateMany(
        { description: text },
        { $set: { description: '' } }
      )
      if (result.modifiedCount > 0) {
        console.log(`Removed admin text "${text}" from ${result.modifiedCount} categories`)
      }
    }
    
    console.log('Test data fixed successfully!')
    
  } catch (error) {
    console.error('Error fixing test data:', error)
  } finally {
    await client.close()
  }
}

fixTestData()