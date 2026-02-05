#!/usr/bin/env node

// Test Notification System
require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testNotifications() {
  try {
    console.log('🧪 Testing Notification System...')
    
    // Find a test user (you can change this to a specific user ID)
    const user = await prisma.user.findFirst({
      where: {
        email: { contains: 'demo' }
      }
    })
    
    if (!user) {
      console.error('❌ No test user found. Please create a user first.')
      return
    }
    
    console.log(`✓ Found user: ${user.email}`)
    
    // Create test notifications
    const notifications = [
      {
        userId: user.id,
        type: 'order',
        title: '🛍️ Neue Bestellung',
        message: 'Tisch 5 - 35.00 €',
        read: false
      },
      {
        userId: user.id,
        type: 'reservation',
        title: '📅 Neue Reservierung',
        message: 'Max Mustermann - 05.02.2026 um 19:00 - 4 Gäste',
        read: false
      },
      {
        userId: user.id,
        type: 'preorder',
        title: '📱 Neue Vorbestellung',
        message: 'Anna Schmidt - Abholung: 06.02 um 12:30 - 28.50 €',
        read: true // One read notification for testing
      }
    ]
    
    console.log('📝 Creating test notifications...')
    
    for (const notification of notifications) {
      const created = await prisma.notification.create({
        data: notification
      })
      console.log(`  ✓ Created ${notification.type} notification (read: ${notification.read})`)
    }
    
    // Test reading notifications
    console.log('\n📖 Testing read status...')
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false
      }
    })
    console.log(`  ✓ Unread notifications: ${unreadCount}`)
    
    // Test marking as read
    console.log('\n✅ Testing mark as read...')
    const firstUnread = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        read: false
      }
    })
    
    if (firstUnread) {
      await prisma.notification.update({
        where: { id: firstUnread.id },
        data: { read: true }
      })
      console.log(`  ✓ Marked notification ${firstUnread.id} as read`)
    }
    
    // Final count
    const finalUnreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false
      }
    })
    console.log(`\n📊 Final unread count: ${finalUnreadCount}`)
    
    console.log('\n✨ Test completed successfully!')
    console.log('📌 Visit http://localhost:3000 and check the notification bell icon')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testNotifications()