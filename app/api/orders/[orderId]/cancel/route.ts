import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { pusherServer, getRestaurantChannel } from "@/lib/pusher"
import Stripe from "stripe"

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey && stripeSecretKey.startsWith('sk_')
  ? new Stripe(stripeSecretKey, { apiVersion: '2024-11-20.acacia' as any })
  : null

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const session = await auth()

    const body = await req.json()
    const { reason } = body

    // Hole Bestellung mit Restaurant-Info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true }
    })

    if (!order) {
      return NextResponse.json({ error: "Bestellung nicht gefunden" }, { status: 404 })
    }

    // Prüfe ob Bestellung bereits storniert ist
    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "Bestellung ist bereits storniert" }, { status: 400 })
    }

    // Allow unauthenticated cancellation ONLY for unpaid orders (payment failed/cancelled)
    const isUnpaidOrder = order.paymentStatus === "PENDING" && order.status === "PENDING"

    if (!session?.user && !isUnpaidOrder) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    // For authenticated users, check permissions (skip for unpaid order cancellation)
    if (session?.user && !isUnpaidOrder) {
      if (session.user.role !== "SUPER_ADMIN") {
        const hasAccess = await prisma.restaurant.findFirst({
          where: {
            id: order.restaurantId,
            OR: [
              { ownerId: session.user.id },
              { staff: { some: { userId: session.user.id } } }
            ]
          }
        })

        if (!hasAccess) {
          return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
        }
      }
    }

    // ============================================
    // STRIPE REFUND: Issue refund if order was paid via Stripe
    // ============================================
    let refundResult: { success: boolean; refundId?: string; error?: string } = { success: false }
    let newPaymentStatus = order.paymentStatus === "PENDING" ? "CANCELLED" : order.paymentStatus

    if (order.paymentStatus === "PAID" && order.paymentIntentId && stripe) {
      console.log(`Processing refund for order ${orderId}, PaymentIntent: ${order.paymentIntentId}`)

      try {
        // Retrieve the PaymentIntent to get the charge
        const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId)

        if (paymentIntent.status === 'succeeded') {
          // Get the latest charge from the PaymentIntent
          const latestChargeId = paymentIntent.latest_charge as string

          if (latestChargeId) {
            // Create refund with reverse_transfer to also refund the connected account
            const refund = await stripe.refunds.create({
              charge: latestChargeId,
              reason: 'requested_by_customer',
              reverse_transfer: true, // Reverse the transfer to the connected restaurant account
              refund_application_fee: true, // Also refund the platform fee
              metadata: {
                orderId: orderId,
                restaurantId: order.restaurantId,
                reason: reason || 'Order cancelled'
              }
            })

            refundResult = {
              success: true,
              refundId: refund.id
            }
            newPaymentStatus = "REFUNDED"

            console.log(`Refund successful: ${refund.id} for order ${orderId}`)
          } else {
            console.warn(`No charge found for PaymentIntent ${order.paymentIntentId}`)
            refundResult = { success: false, error: 'Keine Charge gefunden' }
          }
        } else {
          console.warn(`PaymentIntent ${order.paymentIntentId} status is ${paymentIntent.status}, not succeeded`)
          refundResult = { success: false, error: `Zahlung Status: ${paymentIntent.status}` }
        }
      } catch (stripeError: any) {
        console.error('Stripe refund error:', stripeError)

        // Handle specific Stripe errors
        if (stripeError.code === 'charge_already_refunded') {
          // Already refunded - update status anyway
          newPaymentStatus = "REFUNDED"
          refundResult = { success: true, error: 'Bereits erstattet' }
        } else {
          refundResult = {
            success: false,
            error: stripeError.message || 'Rückerstattung fehlgeschlagen'
          }
        }
      }
    } else if (order.paymentStatus === "PAID" && !order.paymentIntentId) {
      console.warn(`Order ${orderId} was paid but has no paymentIntentId - possibly cash payment`)
    }

    // Storniere Bestellung
    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        paymentStatus: newPaymentStatus,
        notes: reason ? `Storniert: ${reason}` : "Bestellung storniert",
        updatedAt: new Date()
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })
    
    // Sende Pusher Events
    await pusherServer.trigger(
      getRestaurantChannel(order.restaurantId),
      "ORDER_CANCELLED",
      {
        orderId: cancelledOrder.id,
        reason: reason || "Keine Begründung angegeben",
        cancelledBy: session?.user?.name || session?.user?.email || "Guest"
      }
    )
    
    // Sende auch an Table Channel für Gäste
    if (order.tableNumber) {
      await pusherServer.trigger(
        `private-table-${order.restaurantId}-${order.tableNumber}`,
        "ORDER_CANCELLED",
        {
          orderId: cancelledOrder.id,
          reason: reason
        }
      )
    }
    
    return NextResponse.json({
      success: true,
      order: cancelledOrder,
      refund: order.paymentStatus === "PAID" && order.paymentIntentId ? {
        attempted: true,
        success: refundResult.success,
        refundId: refundResult.refundId,
        error: refundResult.error
      } : {
        attempted: false,
        reason: order.paymentStatus !== "PAID" ? "Bestellung war nicht bezahlt" : "Keine Stripe PaymentIntent ID"
      }
    })
  } catch (error) {
    console.error("Fehler beim Stornieren:", error)
    return NextResponse.json(
      { error: "Fehler beim Stornieren der Bestellung" },
      { status: 500 }
    )
  }
}