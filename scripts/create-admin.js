const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

async function createSuperAdmin() {
  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/ordero?replicaSet=rs0'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('Verbunden mit MongoDB')

    const db = client.db('ordero')
    const usersCollection = db.collection('User')

    // Prüfe ob Admin bereits existiert
    const existingAdmin = await usersCollection.findOne({ 
      email: 'admin@ordero.de' 
    })

    if (existingAdmin) {
      console.log('Super-Admin existiert bereits!')
      
      // Update auf SUPER_ADMIN Rolle falls nötig
      if (existingAdmin.role !== 'SUPER_ADMIN') {
        await usersCollection.updateOne(
          { email: 'admin@ordero.de' },
          { 
            $set: { 
              role: 'SUPER_ADMIN',
              updatedAt: new Date()
            } 
          }
        )
        console.log('Rolle auf SUPER_ADMIN aktualisiert')
      }
      
      return
    }

    // Erstelle neuen Super-Admin
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const superAdmin = {
      email: 'admin@ordero.de',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      emailVerified: new Date(),
      onboardingCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await usersCollection.insertOne(superAdmin)
    
    console.log('Super-Admin erfolgreich erstellt!')
    console.log('----------------------------------------')
    console.log('E-Mail: admin@ordero.de')
    console.log('Passwort: admin123')
    console.log('Rolle: SUPER_ADMIN')
    console.log('----------------------------------------')
    console.log('ID:', result.insertedId)

  } catch (error) {
    console.error('Fehler beim Erstellen des Super-Admins:', error)
  } finally {
    await client.close()
  }
}

createSuperAdmin()