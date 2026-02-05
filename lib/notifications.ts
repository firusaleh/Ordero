import { prisma } from '@/lib/prisma'

// Helper-Funktionen für Benachrichtigungs-Titel
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

function getReservationNotificationTitle(status: string): string {
  switch (status) {
    case 'PENDING': return '📅 Neue Reservierung'
    case 'CONFIRMED': return '✅ Reservierung bestätigt'
    case 'CANCELLED': return '❌ Reservierung storniert'
    case 'NO_SHOW': return '⚠️ Nicht erschienen'
    default: return '📅 Reservierungs-Update'
  }
}

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

// Erstelle Benachrichtigung für neue Bestellung
export async function createOrderNotification(order: any, restaurantOwnerId: string) {
  try {
    const tableInfo = order.table?.number 
      ? `Tisch ${order.table.number}` 
      : order.type === 'TAKEAWAY' ? 'Abholung' : 'Lieferung'
    
    const total = order.total?.toFixed(2) || '0.00'
    const message = `${tableInfo} - ${total} €`
    
    await prisma.notification.create({
      data: {
        userId: restaurantOwnerId,
        type: 'order',
        title: getOrderNotificationTitle(order.status),
        message,
        restaurantId: order.restaurantId,
        orderId: order.id,
        read: false
      }
    })
  } catch (error) {
    console.error('Fehler beim Erstellen der Order-Benachrichtigung:', error)
  }
}

// Erstelle Benachrichtigung für neue Reservierung
export async function createReservationNotification(reservation: any, restaurantOwnerId: string) {
  try {
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
    
    const message = `${customerName} - ${date} um ${time} - ${guests} ${guests === 1 ? 'Gast' : 'Gäste'}${table}`
    
    await prisma.notification.create({
      data: {
        userId: restaurantOwnerId,
        type: 'reservation',
        title: getReservationNotificationTitle(reservation.status),
        message,
        restaurantId: reservation.restaurantId,
        reservationId: reservation.id,
        read: false
      }
    })
  } catch (error) {
    console.error('Fehler beim Erstellen der Reservierungs-Benachrichtigung:', error)
  }
}

// Erstelle Benachrichtigung für neue Vorbestellung
export async function createPreOrderNotification(preOrder: any, restaurantOwnerId: string) {
  try {
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
    
    const total = ((preOrder.subtotal || 0) + (preOrder.tax || 0)).toFixed(2)
    const customerName = preOrder.customerName || 'Kunde'
    const orderType = preOrder.orderType === 'PICKUP' ? 'Abholung' : 'Vor Ort'
    
    const message = `${customerName} - ${orderType}: ${pickupDate} um ${pickupTime} - ${total} €`
    
    await prisma.notification.create({
      data: {
        userId: restaurantOwnerId,
        type: 'preorder',
        title: getPreOrderNotificationTitle(preOrder.status),
        message,
        restaurantId: preOrder.restaurantId,
        preOrderId: preOrder.id,
        read: false
      }
    })
  } catch (error) {
    console.error('Fehler beim Erstellen der Vorbestellungs-Benachrichtigung:', error)
  }
}

// Erstelle Benachrichtigungen für alle Restaurant-Besitzer und Staff
export async function notifyRestaurantUsers(restaurantId: string, notificationData: {
  type: string
  title: string
  message: string
  orderId?: string
  reservationId?: string
  preOrderId?: string
}) {
  try {
    // Finde Restaurant mit Owner und Staff
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        owner: true,
        staff: true
      }
    })
    
    if (!restaurant) return
    
    // Erstelle Benachrichtigung für Owner
    await prisma.notification.create({
      data: {
        userId: restaurant.ownerId,
        restaurantId,
        ...notificationData,
        read: false
      }
    })
    
    // Erstelle Benachrichtigungen für Staff
    for (const staffMember of restaurant.staff) {
      await prisma.notification.create({
        data: {
          userId: staffMember.userId,
          restaurantId,
          ...notificationData,
          read: false
        }
      })
    }
  } catch (error) {
    console.error('Fehler beim Benachrichtigen der Restaurant-Nutzer:', error)
  }
}