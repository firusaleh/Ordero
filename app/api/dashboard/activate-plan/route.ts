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
    
    // Validiere Plan basierend auf Land
    let updateData: any = {
      subscriptionStatus: 'ACTIVE',
      updatedAt: new Date()
    }
    
    if (restaurant.country === 'JO' && plan === 'JO_PAY_PER_ORDER') {
      updateData = {
        ...updateData,
        subscriptionPlan: 'JO_PAY_PER_ORDER',
        billingEnabled: true,
        payPerOrderEnabled: true,
        payPerOrderRate: 0.10, // 0.10 JD pro Bestellung
      }
    } else if (restaurant.country === 'DE' && plan === 'DE_PAY_PER_ORDER') {
      updateData = {
        ...updateData,
        subscriptionPlan: 'DE_PAY_PER_ORDER',
        billingEnabled: true,
        payPerOrderEnabled: true,
        payPerOrderRate: 0.45, // 0.45 € pro Bestellung
      }
    } else if (restaurant.country === 'DE' && (plan === 'DE_MONTHLY' || plan === 'DE_YEARLY')) {
      updateData = {
        ...updateData,
        subscriptionPlan: plan,
        billingEnabled: true,
        payPerOrderEnabled: false, // Bei Flatrate keine Pay-per-Order Gebühren
        payPerOrderRate: null,
      }
    } else {
      return NextResponse.json({ error: "Dieser Plan ist für Ihr Land nicht verfügbar" }, { status: 400 })
    }
    
    // Aktiviere den Plan
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: updateData
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