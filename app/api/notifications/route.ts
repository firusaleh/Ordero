import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Hole die neuesten Bestellungen für die Restaurants des Nutzers
    const restaurants = await prisma.restaurant.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      },
      select: { id: true }
    })

    if (restaurants.length === 0) {
      return NextResponse.json({ notifications: [] })
    }

    const restaurantIds = restaurants.map(r => r.id)

    // Hole die letzten 20 Bestellungen als Benachrichtigungen
    const orders = await prisma.order.findMany({
      where: {
        restaurantId: { in: restaurantIds },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Letzte 24 Stunden
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        restaurant: {
          select: { name: true }
        },
        table: {
          select: { number: true }
        }
      }
    })

    // Konvertiere Bestellungen zu Benachrichtigungen
    const notifications = orders.map(order => ({
      id: order.id,
      type: order.status === 'CANCELLED' ? 'alert' : 
            order.status === 'COMPLETED' ? 'payment' : 'order',
      title: getNotificationTitle(order.status),
      message: getNotificationMessage(order),
      timestamp: order.createdAt.toISOString(),
      read: false, // In einer echten App würde man das tracken
      restaurantName: order.restaurant?.name || 'Restaurant'
    }))

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Fehler beim Laden der Benachrichtigungen:', error)
    return NextResponse.json({ notifications: [] })
  }
}

function getNotificationTitle(status: string): string {
  switch (status) {
    case 'PENDING': return 'Neue Bestellung'
    case 'CONFIRMED': return 'Bestellung bestätigt'
    case 'PREPARING': return 'Bestellung in Zubereitung'
    case 'READY': return 'Bestellung fertig'
    case 'DELIVERED': return 'Bestellung ausgeliefert'
    case 'COMPLETED': return 'Bestellung abgeschlossen'
    case 'CANCELLED': return 'Bestellung storniert'
    default: return 'Bestellungs-Update'
  }
}

function getNotificationMessage(order: any): string {
  const tableInfo = order.table?.number 
    ? `Tisch ${order.table.number}` 
    : order.type === 'TAKEAWAY' ? 'Abholung' : 'Lieferung'
  
  const total = order.total?.toFixed(2) || '0.00'
  
  return `${tableInfo} - ${total} €`
}