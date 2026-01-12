import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
      id
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
        }
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
      tableNumber: order.tableNumber,
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