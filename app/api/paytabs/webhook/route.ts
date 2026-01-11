import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPayTabsSignature } from '@/lib/paytabs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('PayTabs Webhook received:', body)

    // Verifiziere Signature (wenn vorhanden)
    const signature = req.headers.get('signature')
    if (signature && !verifyPayTabsSignature(body, signature)) {
      console.error('PayTabs Webhook: Ungültige Signatur')
      return NextResponse.json(
        { error: 'Ungültige Signatur' },
        { status: 401 }
      )
    }

    const {
      tran_ref,
      cart_id,
      payment_result,
      response_status,
      response_code,
      response_message,
      acquirer_message,
      customer_details,
      payment_info
    } = body

    // Finde Bestellung
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: cart_id },
          { paymentIntentId: tran_ref }
        ]
      }
    })

    if (!order) {
      console.error('PayTabs Webhook: Bestellung nicht gefunden', { cart_id, tran_ref })
      return NextResponse.json(
        { error: 'Bestellung nicht gefunden' },
        { status: 404 }
      )
    }

    // Update Bestellstatus basierend auf Payment Result
    if (response_status === 'A' && response_code === '000') {
      // Zahlung erfolgreich
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          paidAt: new Date(),
          status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
          paymentMethod: 'PAYTABS',
          paymentIntentId: tran_ref // Speichere PayTabs Transaction Reference
        }
      })

      console.log('PayTabs Payment erfolgreich:', order.id, {
        tranRef: tran_ref,
        paymentInfo: payment_info,
        responseMessage: response_message,
        acquirerMessage: acquirer_message
      })

      // TODO: Sende Bestätigungs-Email
      // TODO: Benachrichtige Restaurant

    } else if (response_status === 'D') {
      // Zahlung abgelehnt
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          paymentIntentId: tran_ref
        }
      })

      console.log('PayTabs Payment abgelehnt:', order.id, {
        responseCode: response_code,
        responseMessage: response_message,
        acquirerMessage: acquirer_message
      })

    } else if (response_status === 'V') {
      // Zahlung wurde storniert
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'REFUNDED',
          status: 'CANCELLED',
          cancelledAt: new Date(),
          paymentIntentId: tran_ref
        }
      })

      console.log('PayTabs Payment storniert:', order.id, {
        tranRef: tran_ref,
        responseMessage: response_message
      })
    }

    // PayTabs erwartet eine bestimmte Antwort
    return NextResponse.json({ 
      result: 'received',
      order_id: order.id 
    })

  } catch (error: any) {
    console.error('PayTabs Webhook Error:', error)
    return NextResponse.json(
      { 
        error: 'Webhook Verarbeitung fehlgeschlagen',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// GET für PayTabs Return URL
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const tranRef = searchParams.get('tranRef')
  const respStatus = searchParams.get('respStatus')
  const respCode = searchParams.get('respCode')
  const respMessage = searchParams.get('respMessage')
  const cartId = searchParams.get('cartId')

  // Redirect basierend auf Status
  if (respStatus === 'A' && respCode === '000') {
    // Erfolgreich - Redirect zur Erfolgsseite
    return NextResponse.redirect(
      new URL(`/orders/${cartId}/success?payment=paytabs`, req.url)
    )
  } else {
    // Fehlgeschlagen - Redirect zur Fehlerseite
    return NextResponse.redirect(
      new URL(`/orders/${cartId}/failed?reason=${respMessage}`, req.url)
    )
  }
}