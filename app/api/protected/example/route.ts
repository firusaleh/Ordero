import { NextResponse } from "next/server"
import { withAuth, withRestaurantAccess } from "@/lib/auth-utils"

// Beispiel 1: Einfache geschützte Route (nur Auth erforderlich)
export const GET = withAuth(async (req, session) => {
  return NextResponse.json({
    message: "Dies ist eine geschützte Route",
    user: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role
    }
  })
})

// Beispiel 2: Route nur für Restaurant-Besitzer und Super-Admins
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json()
    
    return NextResponse.json({
      message: "Nur Restaurant-Besitzer und Admins können dies sehen",
      data: body,
      user: session.user
    })
  },
  {
    roles: ["RESTAURANT_OWNER", "SUPER_ADMIN"]
  }
)

// Beispiel 3: Route mit Restaurant-Zugriffsprüfung
export const PUT = withRestaurantAccess(
  async (req, session, restaurantId) => {
    const body = await req.json()
    
    return NextResponse.json({
      message: "Zugriff auf Restaurant gewährt",
      restaurantId,
      userId: session.user.id,
      data: body
    })
  },
  // Extrahiere Restaurant-ID aus Request
  (req) => {
    const url = new URL(req.url)
    return url.searchParams.get("restaurantId")
  }
)