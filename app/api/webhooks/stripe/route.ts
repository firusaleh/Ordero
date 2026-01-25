import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { webhookRateLimiter, checkRateLimit } from '@/lib/rate-limit'

// Prüfe ob Stripe konfiguriert ist
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const isValidKey = stripeSecretKey && 
  stripeSecretKey !== 'sk_test_...' && 
  stripeSecretKey.startsWith('sk_')

if (!isValidKey) {
  console.error('STRIPE_SECRET_KEY ist nicht konfiguriert oder ungültig')
}

const stripe = isValidKey ? new Stripe(stripeSecretKey!, {
  apiVersion: '2024-11-20.acacia' as any
}) : null as any

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  // Rate Limiting für Webhooks (identifiziere über Stripe Signature)
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!
  const rateLimitResult = await checkRateLimit(webhookRateLimiter, signature || 'unknown')
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many webhook requests' },
      { status: 429 }
    )
  }
  
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { orderId, restaurantId, tableNumber } = paymentIntent.metadata || {}

  if (!orderId) {
    console.error('No orderId in payment metadata')
    return
  }

  // Check if orderId is a valid MongoDB ObjectId
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderId)
  if (!isObjectId) {
    console.error(`Invalid orderId format: ${orderId}. Expected MongoDB ObjectId.`)
    return
  }

  // Find order first to ensure it exists
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  })

  if (!order) {
    console.error(`Order not found: ${orderId}`)
    return
  }

  // Update order status to PAID
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      paymentIntentId: paymentIntent.id,
      paidAt: new Date(),
      status: 'CONFIRMED'
    }
  })

  // Create invoice
  await createInvoice(orderId)

  console.log(`Order ${orderId} marked as paid (Table: ${tableNumber || 'N/A'})`)
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { orderId, subscriptionType, restaurantId } = session.metadata || {}

  if (subscriptionType) {
    // Handle subscription payment
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: subscriptionType as any,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string
      }
    })
  } else if (orderId) {
    // Handle one-time order payment
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: 'CARD',
        checkoutSessionId: session.id,
        paidAt: new Date()
      }
    })

    await createInvoice(orderId)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const { restaurantId } = invoice.metadata || {}
  
  if (restaurantId) {
    // Update subscription payment record
    await prisma.payment.create({
      data: {
        restaurantId,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: 'SUCCESS',
        type: 'SUBSCRIPTION',
        stripeInvoiceId: invoice.id,
        description: `Subscription payment for ${new Date(invoice.period_start * 1000).toLocaleDateString()}`
      }
    })
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  const restaurant = await prisma.restaurant.findFirst({
    where: { stripeCustomerId: customerId }
  })

  if (restaurant) {
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        subscriptionStatus: subscription.status === 'active' ? 'ACTIVE' : 'INACTIVE',
        stripeSubscriptionId: subscription.id,
        subscriptionCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000)
      }
    })
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  const restaurant = await prisma.restaurant.findFirst({
    where: { stripeCustomerId: customerId }
  })

  if (restaurant) {
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        subscriptionStatus: 'CANCELLED',
        subscriptionCurrentPeriodEnd: new Date()
      }
    })
  }
}

async function createInvoice(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      restaurant: {
        include: {
          settings: true
        }
      }
    }
  })

  if (!order) return

  // Create invoice record
  const invoice = await prisma.invoice.create({
    data: {
      orderId,
      restaurantId: order.restaurantId,
      invoiceNumber: generateInvoiceNumber(),
      subtotal: order.subtotal,
      tax: order.tax || 0,
      tip: order.tip || 0,
      total: order.total,
      status: 'PAID',
      paidAt: new Date(),
      dueDate: new Date(),
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.unitPrice,
        total: item.totalPrice,
        tax: 0
      }))
    }
  })

  // Send invoice email if customer email exists
  if (order.guestEmail) {
    // TODO: Send invoice email via Resend
  }

  return invoice
}

function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `INV-${year}${month}-${random}`
}