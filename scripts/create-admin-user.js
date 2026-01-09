const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  console.log('🔧 Creating Super Admin Account...')

  try {
    const hashedPassword = await bcrypt.hash('Admin2024!', 10)
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@ordero.de' },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date()
      },
      create: {
        email: 'admin@ordero.de',
        name: 'Super Admin',
        password: hashedPassword,
        emailVerified: new Date(),
        role: 'ADMIN'
      }
    })

    console.log('✅ Super Admin account created/updated successfully!')
    console.log('\n' + '='.repeat(50))
    console.log('🔐 SUPER ADMIN LOGIN CREDENTIALS:')
    console.log('='.repeat(50))
    console.log('Email: admin@ordero.de')
    console.log('Password: Admin2024!')
    console.log('='.repeat(50))

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createAdminUser()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })