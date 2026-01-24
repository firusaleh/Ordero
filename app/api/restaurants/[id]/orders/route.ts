import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendOrderEmails } from "@/lib/email-service"
import { sendOrderToPOS } from "@/lib/pos-integrations"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }
    
    // Await params
    const { id } = await params
    
    // Prüfe Berechtigung
    if (session.user.role !== "SUPER_ADMIN") {
      const hasAccess = await prisma.restaurant.findFirst({
        where: {
          id: id,
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
    
    // Query-Parameter für Filter
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const date = searchParams.get("date")
    const limit = parseInt(searchParams.get("limit") || "50")
    
    // Baue Where-Clause
    const where: any = {
      restaurantId: id
    }
    
    if (status && status !== "ALL") {
      where.status = status
    }
    
    if (date) {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      
      where.createdAt = {
        gte: startDate,
        lte: endDate
      }
    } else {
      // Standardmäßig nur Bestellungen von heute
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      where.createdAt = {
        gte: today
      }
    }
    
    // Hole Bestellungen
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        table: true // Include table relation
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    })
    
    // Formatiere Daten für Frontend
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.table?.number || order.tableNumber, // Use table.number if available, fallback to tableNumber
      type: order.type, // Include order type
      customerName: order.guestName,
      customerEmail: order.guestEmail,
      customerPhone: order.guestPhone,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      items: order.items.map(item => ({
        id: item.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.unitPrice,
        extras: item.extras || [],
        variant: item.variant,
        notes: item.notes
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }))
    
    return NextResponse.json(formattedOrders)
  } catch (error) {
    console.error("Fehler beim Abrufen der Bestellungen:", error)
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Bestellungen" },
      { status: 500 }
    )
  }
}

// POST - Neue Bestellung erstellen (für Gäste)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    const body = await req.json()
    
    console.log("Creating order for restaurant:", restaurantId, body)
    
    // Validiere Restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { settings: true }
    })
    
    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant nicht gefunden" },
        { status: 404 }
      )
    }
    
    // Generiere Bestellnummer
    const orderCount = await prisma.order.count({
      where: { restaurantId }
    })
    const orderNumber = `${restaurant.settings?.orderPrefix || 'ORD'}-${String(orderCount + 1).padStart(5, '0')}`
    
    // Erstelle Bestellung
    const order = await prisma.order.create({
      data: {
        restaurantId,
        orderNumber,
        status: restaurant.settings?.autoAcceptOrders ? "CONFIRMED" : "PENDING",
        paymentMethod: body.paymentMethod || "CASH",
        paymentStatus: body.paymentMethod === "CASH" ? "PENDING" : "PROCESSING",
        type: body.orderType || "DINE_IN",
        tableNumber: body.tableNumber,
        guestName: body.customerName || "Gast",
        guestEmail: body.customerEmail,
        guestPhone: body.customerPhone,
        subtotal: body.subtotal || 0,
        tax: body.tax || 0,
        tip: body.tip || 0,
        total: body.total || 0,
        notes: body.notes,
        items: {
          create: body.items?.map((item: any) => ({
            menuItemId: item.id,
            name: item.name,
            quantity: item.quantity || 1,
            unitPrice: item.price,
            totalPrice: (item.price * (item.quantity || 1)),
            variant: item.variant,
            variantPrice: item.variantPrice,
            extras: item.extras || [],
            notes: item.notes
          })) || []
        }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })
    
    // Sende E-Mail-Benachrichtigungen wenn aktiviert
    if (restaurant.settings?.emailNotifications && restaurant.email) {
      try {
        await sendOrderEmails({
          order,
          restaurant,
          customerEmail: body.customerEmail
        })
      } catch (emailError) {
        console.error("Failed to send email notifications:", emailError)
        // Fahre trotzdem fort, E-Mail-Fehler sollten die Bestellung nicht blockieren
      }
    }
    
    // Sende Bestellung an POS-System wenn konfiguriert
    if (restaurant.settings?.posSyncEnabled) {
      try {
        const posSent = await sendOrderToPOS(order, restaurant.settings)
        if (posSent) {
          console.log(`Order ${order.orderNumber} sent to POS system ${restaurant.settings.posSystem}`)
          // POS sync successful - metadata update removed as field doesn't exist
        }
      } catch (posError) {
        console.error("Failed to send order to POS:", posError)
        // Fahre trotzdem fort, POS-Fehler sollten die Bestellung nicht blockieren
      }
    }
    
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total
      }
    })
    
  } catch (error) {
    console.error("Fehler beim Erstellen der Bestellung:", error)
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Bestellung" },
      { status: 500 }
    )
  }
}