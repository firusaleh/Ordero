import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }
    
    const body = await req.json()
    const { restaurantId, plan } = body
    
    // Prüfe ob der Benutzer Zugriff auf dieses Restaurant hat
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        ownerId: session.user.id
      }
    })
    
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant nicht gefunden oder keine Berechtigung" }, { status: 403 })
    }
    
    // Nur für Jordanien erlaubt
    if (restaurant.country !== 'JO' || plan !== 'JO_PAY_PER_ORDER') {
      return NextResponse.json({ error: "Dieser Plan ist für Ihr Land nicht verfügbar" }, { status: 400 })
    }
    
    // Aktiviere den Plan
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        subscriptionPlan: 'JO_PAY_PER_ORDER',
        subscriptionStatus: 'ACTIVE',
        billingEnabled: true,
        payPerOrderEnabled: true,
        payPerOrderRate: 0.10, // 0.10 JD pro Bestellung
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({
      success: true,
      restaurant: updatedRestaurant
    })
  } catch (error) {
    console.error("Fehler bei der Plan-Aktivierung:", error)
    return NextResponse.json(
      { error: "Fehler bei der Aktivierung des Plans" },
      { status: 500 }
    )
  }
}