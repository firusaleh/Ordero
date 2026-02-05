import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Hole existierende Benachrichtigungen aus der Datenbank
    const existingNotifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        restaurant: {
          select: { name: true }
        }
      }
    })

    // Konvertiere zu Frontend-Format
    const notifications = existingNotifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      timestamp: n.createdAt.toISOString(),
      read: n.read,
      restaurantName: n.restaurant?.name || 'Restaurant'
    }))

    return NextResponse.json({ notifications })

  } catch (error) {
    console.error('Fehler beim Laden der Benachrichtigungen:', error)
    return NextResponse.json({ notifications: [] })
  }
}

// Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { notificationId, markAllRead } = await request.json()

    if (markAllRead) {
      // Mark all notifications as read for this user
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          read: false
        },
        data: {
          read: true
        }
      })
      return NextResponse.json({ success: true })
    } else if (notificationId) {
      // Mark single notification as read
      await prisma.notification.update({
        where: {
          id: notificationId,
          userId: session.user.id
        },
        data: {
          read: true
        }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}

// Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    const clearAll = searchParams.get('clearAll') === 'true'

    if (clearAll) {
      // Delete all notifications for this user
      await prisma.notification.deleteMany({
        where: {
          userId: session.user.id
        }
      })
      return NextResponse.json({ success: true })
    } else if (notificationId) {
      // Delete single notification
      await prisma.notification.delete({
        where: {
          id: notificationId,
          userId: session.user.id
        }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}

