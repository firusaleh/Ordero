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

    // Hole die letzten 20 Bestellungen
    const orders = await prisma.order.findMany({
      where: {
        restaurantId: { in: restaurantIds },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Letzte 24 Stunden
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        restaurant: {
          select: { name: true }
        },
        table: {
          select: { number: true }
        }
      }
    })

    // Hole die letzten Reservierungen
    const reservations = await prisma.reservation.findMany({
      where: {
        restaurantId: { in: restaurantIds },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Letzte 24 Stunden
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        restaurant: {
          select: { name: true }
        },
        table: {
          select: { number: true }
        }
      }
    })

    // Hole die letzten Vorbestellungen
    const preOrders = await prisma.preOrder.findMany({
      where: {
        restaurantId: { in: restaurantIds },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Letzte 24 Stunden
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        restaurant: {
          select: { name: true }
        }
      }
    })

    // Konvertiere alle zu Benachrichtigungen
    const orderNotifications = orders.map(order => ({
      id: order.id,
      type: 'order' as const,
      title: getOrderNotificationTitle(order.status),
      message: getOrderNotificationMessage(order),
      timestamp: order.createdAt.toISOString(),
      read: false,
      restaurantName: order.restaurant?.name || 'Restaurant'
    }))

    const reservationNotifications = reservations.map(reservation => ({
      id: reservation.id,
      type: 'reservation' as const,
      title: getReservationNotificationTitle(reservation.status),
      message: getReservationNotificationMessage(reservation),
      timestamp: reservation.createdAt.toISOString(),
      read: false,
      restaurantName: reservation.restaurant?.name || 'Restaurant'
    }))

    const preOrderNotifications = preOrders.map(preOrder => ({
      id: preOrder.id,
      type: 'preorder' as const,
      title: getPreOrderNotificationTitle(preOrder.status),
      message: getPreOrderNotificationMessage(preOrder),
      timestamp: preOrder.createdAt.toISOString(),
      read: false,
      restaurantName: preOrder.restaurant?.name || 'Restaurant'
    }))

    // Kombiniere und sortiere alle Benachrichtigungen nach Zeit
    const notifications = [
      ...orderNotifications,
      ...reservationNotifications,
      ...preOrderNotifications
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20) // Maximal 20 Benachrichtigungen

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Fehler beim Laden der Benachrichtigungen:', error)
    return NextResponse.json({ notifications: [] })
  }
}

// Helper-Funktionen für Bestellungen
function getOrderNotificationTitle(status: string): string {
  switch (status) {
    case 'PENDING': return '🛍️ Neue Bestellung'
    case 'CONFIRMED': return '✅ Bestellung bestätigt'
    case 'PREPARING': return '👨‍🍳 In Zubereitung'
    case 'READY': return '✨ Bestellung fertig'
    case 'DELIVERED': return '✓ Ausgeliefert'
    case 'CANCELLED': return '❌ Storniert'
    default: return '📦 Bestellungs-Update'
  }
}

function getOrderNotificationMessage(order: any): string {
  const tableInfo = order.table?.number 
    ? `Tisch ${order.table.number}` 
    : order.type === 'TAKEAWAY' ? 'Abholung' : 'Lieferung'
  
  const total = order.total?.toFixed(2) || '0.00'
  
  return `${tableInfo} - ${total} €`
}

// Helper-Funktionen für Reservierungen
function getReservationNotificationTitle(status: string): string {
  switch (status) {
    case 'PENDING': return '📅 Neue Reservierung'
    case 'CONFIRMED': return '✅ Reservierung bestätigt'
    case 'CANCELLED': return '❌ Reservierung storniert'
    case 'NO_SHOW': return '⚠️ Nicht erschienen'
    default: return '📅 Reservierungs-Update'
  }
}

function getReservationNotificationMessage(reservation: any): string {
  // Verwende die korrekten Feldnamen aus dem Prisma Schema
  const date = reservation.reservationDate 
    ? new Date(reservation.reservationDate).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : 'Datum unbekannt'
  
  const time = reservation.reservationTime || 'Zeit unbekannt'
  const guests = reservation.numberOfGuests || 0
  const customerName = reservation.customerName || 'Gast'
  const table = reservation.table?.number ? ` - Tisch ${reservation.table.number}` : ''
  
  return `${customerName} - ${date} um ${time} - ${guests} ${guests === 1 ? 'Gast' : 'Gäste'}${table}`
}

// Helper-Funktionen für Vorbestellungen
function getPreOrderNotificationTitle(status: string): string {
  switch (status) {
    case 'PENDING': return '📱 Neue Vorbestellung'
    case 'CONFIRMED': return '✅ Vorbestellung bestätigt'
    case 'PREPARING': return '👨‍🍳 Wird vorbereitet'
    case 'READY': return '✨ Abholbereit'
    case 'COMPLETED': return '✓ Abgeholt'
    case 'CANCELLED': return '❌ Storniert'
    default: return '📱 Vorbestellungs-Update'
  }
}

function getPreOrderNotificationMessage(preOrder: any): string {
  // Formatiere Pickup-Zeit
  const pickupDateTime = preOrder.pickupTime 
    ? new Date(preOrder.pickupTime)
    : null
    
  const pickupDate = pickupDateTime
    ? pickupDateTime.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit'
      })
    : 'Datum unbekannt'
    
  const pickupTime = pickupDateTime
    ? pickupDateTime.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Zeit unbekannt'
  
  // Berechne Total aus subtotal + tax (da es kein total Feld gibt)
  const total = ((preOrder.subtotal || 0) + (preOrder.tax || 0)).toFixed(2)
  const customerName = preOrder.customerName || 'Kunde'
  const orderType = preOrder.orderType === 'PICKUP' ? 'Abholung' : 'Vor Ort'
  
  return `${customerName} - ${orderType}: ${pickupDate} um ${pickupTime} - ${total} €`
}