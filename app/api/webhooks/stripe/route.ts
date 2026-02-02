import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// Webhook muss raw body erhalten
export const runtime = 'nodejs'

// Initialize Stripe only if key is available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const isValidKey = stripeSecretKey &&
  stripeSecretKey !== 'sk_test_...' &&
  stripeSecretKey.startsWith('sk_')

const stripe = isValidKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2024-11-20.acacia' as any,
}) : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  if (!stripe) {
    console.error('Stripe not configured')
    return NextResponse.json(
      { error: 'Stripe nicht konfiguriert' },
      { status: 503 }
    )
  }

  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('No Stripe signature found')
    return NextResponse.json(
      { error: 'Keine Stripe-Signatur' },
      { status: 400 }
    )
  }

  if (!webhookSecret) {
    console.error('Webhook secret not configured')
    return NextResponse.json(
      { error: 'Webhook secret nicht konfiguriert' },
      { status: 503 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook Signatur-Fehler:', err)
    return NextResponse.json(
      { error: 'Webhook Signatur ungültig' },
      { status: 400 }
    )
  }

  console.log('Webhook received:', event.type)

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('=== PAYMENT_INTENT.SUCCEEDED START ===')
        console.log('Payment Intent ID:', paymentIntent.id)
        console.log('Metadata:', JSON.stringify(paymentIntent.metadata))

        // Get pendingPaymentId from metadata
        const pendingPaymentId = paymentIntent.metadata?.pendingPaymentId
        console.log('pendingPaymentId:', pendingPaymentId)

        if (!pendingPaymentId) {
          console.log('SKIP: No pendingPaymentId in metadata')
          break
        }

        // Find the pending payment
        console.log('Finding PendingPayment...')
        const pendingPayment = await prisma.pendingPayment.findUnique({
          where: { id: pendingPaymentId }
        })
        console.log('PendingPayment found:', pendingPayment ? 'YES' : 'NO')

        if (!pendingPayment) {
          console.error('SKIP: PendingPayment not found:', pendingPaymentId)
          break
        }

        console.log('PendingPayment data:', JSON.stringify({
          id: pendingPayment.id,
          restaurantId: pendingPayment.restaurantId,
          orderId: pendingPayment.orderId,
          total: pendingPayment.total,
          itemsCount: (pendingPayment.items as any[])?.length
        }))

        // Check if order already exists (avoid duplicates)
        if (pendingPayment.orderId) {
          console.log('SKIP: Order already created:', pendingPayment.orderId)
          break
        }

        console.log('Creating order...')

        // Generate order number
        const orderCount = await prisma.order.count({
          where: { restaurantId: pendingPayment.restaurantId }
        })
        const orderNumber = `ORD-${String(orderCount + 1).padStart(5, '0')}`

        // Create the order
        const order = await prisma.order.create({
          data: {
            orderNumber,
            restaurantId: pendingPayment.restaurantId,
            tableId: pendingPayment.tableId,
            tableNumber: pendingPayment.tableNumber,
            status: 'PENDING',
            paymentStatus: 'PAID',
            paymentMethod: 'CARD',
            paymentIntentId: paymentIntent.id, // Store for refunds
            paidAt: new Date(),
            subtotal: pendingPayment.subtotal,
            tax: pendingPayment.tax,
            tip: pendingPayment.tip,
            total: pendingPayment.total,
            items: {
              create: (pendingPayment.items as any[]).map((item: any) => ({
                menuItemId: item.menuItemId,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice,
                notes: item.notes || null,
                selectedVariant: item.variantName ? {
                  id: item.variantId,
                  name: item.variantName
                } : undefined,
                selectedExtras: item.extraNames?.length > 0 ? item.extraNames.map((name: string, idx: number) => ({
                  id: item.extraIds[idx],
                  name: name,
                  price: item.extraPrices[idx]
                })) : undefined
              }))
            }
          }
        })

        console.log('Order created successfully:', order.id, order.orderNumber)

        // Update pending payment with order info
        console.log('Updating PendingPayment with orderId...')
        await prisma.pendingPayment.update({
          where: { id: pendingPaymentId },
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber
          }
        })
        console.log('PendingPayment updated')

        // Create payment record for revenue tracking
        console.log('Creating Payment record...')
        await prisma.payment.create({
          data: {
            restaurantId: pendingPayment.restaurantId,
            stripePaymentId: paymentIntent.id,
            amount: pendingPayment.total,
            currency: paymentIntent.currency,
            status: 'SUCCESS',
            type: 'ORDER',
            description: `Bestellung ${order.orderNumber}${pendingPayment.tableNumber ? ` - Tisch ${pendingPayment.tableNumber}` : ''}`
          }
        })

        console.log('=== PAYMENT_INTENT.SUCCEEDED COMPLETE ===')
        console.log('Order:', order.orderNumber, 'Total:', pendingPayment.total)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment Intent Failed:', paymentIntent.id)
        // Payment failed - the pending payment will expire naturally
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Update Restaurant mit Subscription-Daten
        if (session.metadata?.restaurantId) {
          await prisma.restaurant.update({
            where: { id: session.metadata.restaurantId },
            data: {
              stripeSubscriptionId: session.subscription as string,
              subscriptionStatus: 'ACTIVE',
              subscriptionPlan: session.metadata.plan || 'STANDARD',
              subscriptionCurrentPeriodEnd: session.expires_at
                ? new Date(session.expires_at * 1000)
                : undefined,
            }
          })
        }

        // Update User mit Customer ID falls noch nicht vorhanden
        if (session.metadata?.userId && session.customer) {
          await prisma.user.update({
            where: { id: session.metadata.userId },
            data: { stripeCustomerId: session.customer as string }
          })
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Finde Restaurant anhand der Subscription ID
        const restaurant = await prisma.restaurant.findFirst({
          where: { stripeSubscriptionId: subscription.id }
        })

        if (restaurant) {
          await prisma.restaurant.update({
            where: { id: restaurant.id },
            data: {
              subscriptionStatus: mapStripeStatus(subscription.status),
              subscriptionCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            }
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Setze Subscription auf FREE wenn gelöscht
        const restaurant = await prisma.restaurant.findFirst({
          where: { stripeSubscriptionId: subscription.id }
        })

        if (restaurant) {
          await prisma.restaurant.update({
            where: { id: restaurant.id },
            data: {
              subscriptionStatus: 'CANCELLED',
              subscriptionPlan: 'FREE',
              subscriptionCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            }
          })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        // Speichere erfolgreiche Zahlung
        if ((invoice as any).subscription && (invoice as any).metadata?.restaurantId) {
          await prisma.payment.create({
            data: {
              restaurantId: (invoice as any).metadata.restaurantId,
              stripePaymentId: (invoice as any).payment_intent as string,
              amount: (invoice as any).amount_paid / 100, // Cent zu Euro
              currency: (invoice as any).currency,
              status: 'SUCCESS',
              type: 'SUBSCRIPTION',
              description: `Abonnement-Zahlung für ${(invoice as any).period_start ? new Date((invoice as any).period_start * 1000).toLocaleDateString('de-DE') : 'unbekannt'}`,
            }
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        // Speichere fehlgeschlagene Zahlung
        if ((invoice as any).subscription && (invoice as any).metadata?.restaurantId) {
          await prisma.payment.create({
            data: {
              restaurantId: (invoice as any).metadata.restaurantId,
              stripePaymentId: (invoice as any).payment_intent as string,
              amount: (invoice as any).amount_due / 100,
              currency: (invoice as any).currency,
              status: 'FAILED',
              type: 'SUBSCRIPTION',
              description: 'Fehlgeschlagene Abonnement-Zahlung',
            }
          })
        }
        break
      }

      default:
        console.log(`Unbehandelter Event-Typ: ${event.type}`)
    }

    console.log('Webhook processed successfully, returning 200')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('=== WEBHOOK ERROR ===')
    console.error('Error:', error)
    console.error('Error message:', (error as any)?.message)
    console.error('Error stack:', (error as any)?.stack)
    return NextResponse.json(
      { error: 'Webhook Verarbeitung fehlgeschlagen', details: (error as any)?.message },
      { status: 500 }
    )
  }
}

function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  const statusMap: Record<Stripe.Subscription.Status, string> = {
    active: 'ACTIVE',
    canceled: 'CANCELLED',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'EXPIRED',
    past_due: 'PAST_DUE',
    paused: 'PAUSED',
    trialing: 'TRIALING',
    unpaid: 'UNPAID',
  }

  return statusMap[stripeStatus] || 'UNKNOWN'
}
