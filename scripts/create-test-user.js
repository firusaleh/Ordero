const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    console.log('🧪 Creating test user for onboarding...')
    
    const hashedPassword = await bcrypt.hash('test123', 12)
    
    // Lösche existierenden Test-User
    try {
      await prisma.user.delete({
        where: { email: 'test@ordero.de' }
      })
    } catch (e) {
      // User existiert nicht, das ist OK
    }
    
    // Erstelle neuen Test-User
    const user = await prisma.user.create({
      data: {
        email: 'test@ordero.de',
        password: hashedPassword,
        name: 'Test User',
        role: 'RESTAURANT_OWNER'
      }
    })
    
    console.log('✅ Test user created!')
    console.log('\n📝 Test-Account für Onboarding:')
    console.log('   Email: test@ordero.de')
    console.log('   Passwort: test123')
    console.log('\n🔗 Login: http://localhost:3000/login')
    console.log('🎯 Onboarding: http://localhost:3000/onboarding')
    
  } catch (error) {
    console.error('❌ Error creating test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()