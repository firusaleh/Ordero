import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Webhook-Handler für verschiedene POS-Systeme
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-webhook-signature')
    const posSystem = req.headers.get('x-pos-system')
    
    // Validiere Webhook basierend auf POS-System
    let isValid = false
    let webhookData: any = null

    switch (posSystem) {
      case 'ready2order':
        isValid = validateReady2OrderWebhook(body, signature)
        webhookData = JSON.parse(body)
        break
      
      case 'orderbird':
        isValid = validateOrderbirdWebhook(body, signature)
        webhookData = JSON.parse(body)
        break
      
      case 'square':
        isValid = validateSquareWebhook(body, signature)
        webhookData = JSON.parse(body)
        break
      
      default:
        // Unbekanntes POS-System oder Test-Webhook
        if (process.env.NODE_ENV === 'development') {
          isValid = true
          webhookData = JSON.parse(body)
        }
    }

    if (!isValid) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verarbeite Webhook-Event
    const eventType = webhookData.type || webhookData.event_type
    console.log(`[POS WEBHOOK] Received ${eventType} from ${posSystem}`)

    switch (eventType) {
      case 'order.updated':
      case 'order_updated':
        await handleOrderUpdate(webhookData, posSystem!)
        break
      
      case 'order.cancelled':
      case 'order_cancelled':
        await handleOrderCancellation(webhookData, posSystem!)
        break
      
      case 'menu.updated':
      case 'menu_updated':
        await handleMenuUpdate(webhookData, posSystem!)
        break
      
      case 'inventory.updated':
      case 'inventory_updated':
        await handleInventoryUpdate(webhookData, posSystem!)
        break
      
      default:
        console.log(`Unhandled webhook event: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Validierungs-Funktionen für verschiedene POS-Systeme
function validateReady2OrderWebhook(body: string, signature: string | null): boolean {
  if (!signature) return false
  
  const secret = process.env.READY2ORDER_WEBHOOK_SECRET
  if (!secret) return false
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  
  return signature === expectedSignature
}

function validateOrderbirdWebhook(body: string, signature: string | null): boolean {
  if (!signature) return false
  
  const secret = process.env.ORDERBIRD_WEBHOOK_SECRET
  if (!secret) return false
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  
  return signature === expectedSignature
}

function validateSquareWebhook(body: string, signature: string | null): boolean {
  if (!signature) return false
  
  const secret = process.env.SQUARE_WEBHOOK_SECRET
  if (!secret) return false
  
  // Square verwendet eine andere Signatur-Methode
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64')
  
  return signature === hash
}

// Event-Handler
async function handleOrderUpdate(data: any, posSystem: string) {
  try {
    // Finde Bestellung anhand der externen ID
    const externalId = data.external_id || data.order_id || data.id
    const order = await prisma.order.findFirst({
      where: { 
        OR: [
          { id: externalId },
          { posOrderId: externalId }
        ]
      }
    })

    if (!order) {
      console.error(`Order not found: ${externalId}`)
      return
    }

    // Aktualisiere Bestellstatus basierend auf POS-Status
    const newStatus = mapPOSStatusToOrderStatus(data.status, posSystem)
    
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        posOrderId: externalId,
        posSyncStatus: 'SYNCED',
        posSyncedAt: new Date()
      }
    })

    console.log(`[POS WEBHOOK] Order ${order.orderNumber} status updated to ${newStatus}`)
  } catch (error) {
    console.error('Error handling order update:', error)
  }
}

async function handleOrderCancellation(data: any, posSystem: string) {
  try {
    const externalId = data.external_id || data.order_id || data.id
    const order = await prisma.order.findFirst({
      where: { 
        OR: [
          { id: externalId },
          { posOrderId: externalId }
        ]
      }
    })

    if (!order) {
      console.error(`Order not found: ${externalId}`)
      return
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: data.reason || 'Cancelled via POS'
      }
    })

    console.log(`[POS WEBHOOK] Order ${order.orderNumber} cancelled`)
  } catch (error) {
    console.error('Error handling order cancellation:', error)
  }
}

async function handleMenuUpdate(data: any, posSystem: string) {
  try {
    // Finde Restaurant anhand der POS Restaurant ID
    const restaurantId = data.restaurant_id || data.location_id
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        settings: {
          posRestaurantId: restaurantId
        }
      }
    })

    if (!restaurant) {
      console.error(`Restaurant not found for POS ID: ${restaurantId}`)
      return
    }

    // Markiere Menü als nicht synchronisiert
    await prisma.restaurantSettings.update({
      where: { restaurantId: restaurant.id },
      data: {
        posMenuOutOfSync: true,
        posLastMenuChange: new Date()
      }
    })

    console.log(`[POS WEBHOOK] Menu update detected for restaurant ${restaurant.name}`)
    
    // TODO: Trigger automatische Menü-Synchronisation
  } catch (error) {
    console.error('Error handling menu update:', error)
  }
}

async function handleInventoryUpdate(data: any, posSystem: string) {
  try {
    const itemId = data.item_id || data.product_id
    const isAvailable = data.available || data.in_stock
    
    // Finde Menü-Item anhand der POS ID
    const menuItem = await prisma.menuItem.findFirst({
      where: { posId: itemId }
    })

    if (!menuItem) {
      console.error(`Menu item not found for POS ID: ${itemId}`)
      return
    }

    // Aktualisiere Verfügbarkeit
    await prisma.menuItem.update({
      where: { id: menuItem.id },
      data: {
        isAvailable: isAvailable
      }
    })

    console.log(`[POS WEBHOOK] Item ${menuItem.name} availability updated to ${isAvailable}`)
  } catch (error) {
    console.error('Error handling inventory update:', error)
  }
}

// Hilfsfunktion zum Mappen von POS-Status zu Order-Status
function mapPOSStatusToOrderStatus(posStatus: string, posSystem: string): string {
  const statusMap: { [key: string]: { [key: string]: string } } = {
    ready2order: {
      'new': 'PENDING',
      'in_progress': 'PREPARING',
      'ready': 'READY',
      'completed': 'COMPLETED',
      'cancelled': 'CANCELLED'
    },
    orderbird: {
      'open': 'PENDING',
      'in_progress': 'PREPARING',
      'ready': 'READY',
      'closed': 'COMPLETED',
      'cancelled': 'CANCELLED'
    },
    square: {
      'PROPOSED': 'PENDING',
      'OPEN': 'CONFIRMED',
      'COMPLETED': 'COMPLETED',
      'CANCELED': 'CANCELLED'
    }
  }

  return statusMap[posSystem]?.[posStatus] || 'PENDING'
}