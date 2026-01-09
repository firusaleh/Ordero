import { NextRequest, NextResponse } from 'next/server'
import { PaymentFactory } from '@/lib/payment/factory'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Schema für die Validierung der Eingaben
const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment Intent ID ist erforderlich'),
  orderId: z.string().min(1, 'Bestell-ID ist erforderlich'),
  restaurantId: z.string().min(1, 'Restaurant-ID ist erforderlich'),
  country: z.string().length(2, 'Land muss 2 Zeichen haben').default('DE'),
  currency: z.string().length(3, 'Währung muss 3 Zeichen haben').default('EUR')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validiere die Eingabedaten
    const validationResult = confirmPaymentSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige Eingabedaten',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Prüfe ob die Bestellung existiert
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        restaurant: true
      }
    })

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bestellung nicht gefunden'
        },
        { status: 404 }
      )
    }

    // Prüfe ob die Bestellung bereits bezahlt wurde
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        {
          success: false,
          error: 'Bestellung wurde bereits bezahlt'
        },
        { status: 400 }
      )
    }

    // Hole den passenden Payment Provider
    let paymentProvider
    try {
      paymentProvider = await PaymentFactory.getProvider(
        data.country, 
        data.currency, 
        'stripe'
      )
    } catch (error) {
      console.error('Payment provider not available:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Zahlungsanbieter nicht verfügbar'
        },
        { status: 503 }
      )
    }

    // Bestätige die Zahlung beim Provider
    const confirmResult = await paymentProvider.confirmPayment(data.paymentIntentId)

    if (!confirmResult.success) {
      console.error('Payment confirmation failed:', confirmResult.error)
      
      // Aktualisiere die Bestellung als fehlgeschlagen
      await prisma.order.update({
        where: { id: data.orderId },
        data: {
          paymentStatus: 'FAILED',
          paymentIntentId: data.paymentIntentId,
          updatedAt: new Date()
        }
      })

      return NextResponse.json(
        {
          success: false,
          error: confirmResult.error || 'Zahlungsbestätigung fehlgeschlagen'
        },
        { status: 400 }
      )
    }

    // Aktualisiere die Bestellung als erfolgreich bezahlt
    const updatedOrder = await prisma.order.update({
      where: { id: data.orderId },
      data: {
        paymentStatus: 'PAID',
        paymentIntentId: data.paymentIntentId,
        paymentMethod: paymentProvider.name === 'stripe' ? 'CARD' : 'CASH',
        paidAt: new Date(),
        status: 'CONFIRMED', // Ändere Status zu bestätigt
        updatedAt: new Date()
      }
    })

    // Optional: Sende Bestätigungs-E-Mail oder Push-Notification
    // Das könnte hier implementiert werden

    console.log(`Zahlung bestätigt für Bestellung ${data.orderId}, Payment Intent: ${data.paymentIntentId}`)

    return NextResponse.json({
      success: true,
      orderId: data.orderId,
      paymentIntentId: data.paymentIntentId,
      orderStatus: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
      paidAt: updatedOrder.paidAt
    })

  } catch (error) {
    console.error('Confirm payment error:', error)
    
    // Bei einem Datenbankfehler versuchen wir trotzdem die Bestellung zu finden und zu aktualisieren
    try {
      const body = await request.json()
      if (body.orderId && body.paymentIntentId) {
        await prisma.order.update({
          where: { id: body.orderId },
          data: {
            paymentStatus: 'FAILED',
            paymentIntentId: body.paymentIntentId,
            updatedAt: new Date()
          }
        })
      }
    } catch (dbError) {
      console.error('Failed to update order status after error:', dbError)
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Interner Server-Fehler bei der Zahlungsbestätigung'
      },
      { status: 500 }
    )
  }
}

// GET Endpoint um Zahlungsstatus zu prüfen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get('paymentIntentId')
    const orderId = searchParams.get('orderId')

    if (!paymentIntentId && !orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment Intent ID oder Order ID ist erforderlich'
        },
        { status: 400 }
      )
    }

    // Suche Bestellung
    let order = null
    if (orderId) {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          paymentIntentId: true,
          paymentMethod: true,
          paidAt: true,
          total: true
        }
      })
    } else if (paymentIntentId) {
      order = await prisma.order.findFirst({
        where: { paymentIntentId },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          paymentIntentId: true,
          paymentMethod: true,
          paidAt: true,
          total: true
        }
      })
    }

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bestellung nicht gefunden'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentIntentId: order.paymentIntentId,
        paymentMethod: order.paymentMethod,
        paidAt: order.paidAt,
        total: order.total
      }
    })

  } catch (error) {
    console.error('Get payment status error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Fehler beim Abrufen des Zahlungsstatus'
      },
      { status: 500 }
    )
  }
}