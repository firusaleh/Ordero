import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { pusherServer, getRestaurantChannel } from "@/lib/pusher"
import { sendOrderStatusUpdate } from "@/lib/email"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }
    
    const body = await req.json()
    const { status } = body
    
    // Validiere Status
    const validStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "CANCELLED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 })
    }
    
    // Hole Bestellung mit Restaurant-Info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true }
    })
    
    if (!order) {
      return NextResponse.json({ error: "Bestellung nicht gefunden" }, { status: 404 })
    }
    
    // Prüfe Berechtigung
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
    
    // Update Bestellung
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
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
    
    // Sende Pusher Event
    await pusherServer.trigger(
      getRestaurantChannel(order.restaurantId),
      "ORDER_UPDATED",
      {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        updatedBy: session.user.name || session.user.email
      }
    )
    
    // Sende auch an Table Channel für Gäste
    if (order.tableNumber) {
      await pusherServer.trigger(
        `private-table-${order.restaurantId}-${order.tableNumber}`,
        "ORDER_UPDATED",
        {
          orderId: updatedOrder.id,
          status: updatedOrder.status
        }
      )
    }
    
    // Sende E-Mail-Benachrichtigung bei wichtigen Status-Änderungen
    try {
      // Prüfe ob Gast-E-Mail vorhanden ist (später implementiert)
      // Für jetzt: Sende an Restaurant-Besitzer bei wichtigen Status
      if (["CONFIRMED", "READY", "CANCELLED"].includes(status)) {
        const restaurant = await prisma.restaurant.findUnique({
          where: { id: order.restaurantId },
          include: { owner: true }
        })
        
        const restaurantOwner = restaurant?.owner
        
        if (restaurantOwner?.email) {
          const statusTextMap: Record<string, string> = {
            CONFIRMED: "bestätigt",
            PREPARING: "wird zubereitet",
            READY: "fertig",
            DELIVERED: "ausgeliefert",
            CANCELLED: "storniert"
          }
          
          await sendOrderStatusUpdate({
            email: restaurantOwner.email,
            orderNumber: order.orderNumber.toString(),
            restaurantName: order.restaurant.name,
            status,
            estimatedTime: statusTextMap[status] || status.toLowerCase()
          })
        }
      }
    } catch (emailError) {
      console.error('Error sending status update email:', emailError)
      // E-Mail-Fehler sollten das Update nicht verhindern
    }
    
    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Fehler beim Status-Update:", error)
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Status" },
      { status: 500 }
    )
  }
}