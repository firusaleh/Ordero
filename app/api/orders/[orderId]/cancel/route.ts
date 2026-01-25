import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { pusherServer, getRestaurantChannel } from "@/lib/pusher"

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
    
    // Storniere Bestellung
    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        paymentStatus: order.paymentStatus === "PENDING" ? "CANCELLED" : order.paymentStatus,
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
      order: cancelledOrder
    })
  } catch (error) {
    console.error("Fehler beim Stornieren:", error)
    return NextResponse.json(
      { error: "Fehler beim Stornieren der Bestellung" },
      { status: 500 }
    )
  }
}