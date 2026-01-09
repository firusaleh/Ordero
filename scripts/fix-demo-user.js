const { MongoClient } = require('mongodb')

async function fixDemoUser() {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017/ordero?replicaSet=rs0')
  
  try {
    await client.connect()
    console.log('🔧 Fixing demo user restaurant ownership...')
    
    const db = client.db('ordero')
    
    // Find demo user
    const demoUser = await db.collection('User').findOne({ email: 'demo@ordero.de' })
    if (!demoUser) {
      console.error('❌ Demo user not found!')
      return
    }
    
    console.log('✅ Found demo user:', demoUser._id)
    
    // Find Bella Vista restaurant
    const restaurant = await db.collection('Restaurant').findOne({ name: 'Bella Vista Restaurant' })
    if (!restaurant) {
      console.error('❌ Bella Vista Restaurant not found!')
      return
    }
    
    console.log('✅ Found restaurant:', restaurant.name)
    console.log('   Current owner:', restaurant.ownerId)
    console.log('   Demo user ID:', demoUser._id)
    
    // Update restaurant owner to demo user
    const result = await db.collection('Restaurant').updateOne(
      { _id: restaurant._id },
      { $set: { ownerId: demoUser._id } }
    )
    
    if (result.modifiedCount > 0) {
      console.log('✅ Successfully linked restaurant to demo user!')
    } else {
      console.log('⚠️ Restaurant was already linked to user')
    }
    
    console.log('\n📝 Demo-Account jetzt funktionsfähig:')
    console.log('   Email: demo@ordero.de')
    console.log('   Passwort: demo123')
    console.log('\n🔗 Direkt zum Dashboard:')
    console.log('   http://localhost:3000/dashboard')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
  }
}

fixDemoUser()