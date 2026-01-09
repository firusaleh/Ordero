import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

type UserRole = "SUPER_ADMIN" | "ADMIN" | "RESTAURANT_OWNER" | "RESTAURANT_STAFF"

// API Route Protection
export function withAuth(
  handler: (req: Request, session: any) => Promise<NextResponse>,
  options?: {
    roles?: UserRole[]
  }
) {
  return async (req: Request) => {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      )
    }

    // Rolle prüfen wenn spezifiziert
    if (options?.roles && !options.roles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      )
    }

    return handler(req, session)
  }
}

// Restaurant Access Check für API Routes
export function withRestaurantAccess(
  handler: (req: Request, session: any, restaurantId: string) => Promise<NextResponse>,
  restaurantIdExtractor: (req: Request) => string | null
) {
  return withAuth(async (req, session) => {
    const restaurantId = restaurantIdExtractor(req)
    
    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant-ID fehlt" },
        { status: 400 }
      )
    }

    // Super Admin hat immer Zugriff
    if (session.user.role === "SUPER_ADMIN") {
      return handler(req, session, restaurantId)
    }

    // Prüfe Restaurant-Zugriff
    const { prisma } = await import("@/lib/prisma")
    const hasAccess = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Kein Zugriff auf dieses Restaurant" },
        { status: 403 }
      )
    }

    return handler(req, session, restaurantId)
  })
}

// Session Refresh Helper
export async function refreshSession() {
  const session = await auth()
  if (!session) return null
  
  const { prisma } = await import("@/lib/prisma")
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      ownedRestaurants: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  })
  
  return user
}

// Check specific permissions
export function hasPermission(
  session: any,
  permission: 
    | "manage_restaurants"
    | "manage_users" 
    | "manage_billing"
    | "view_analytics"
    | "manage_orders"
): boolean {
  if (!session?.user) return false
  
  const permissions: Record<UserRole, string[]> = {
    SUPER_ADMIN: [
      "manage_restaurants",
      "manage_users",
      "manage_billing",
      "view_analytics",
      "manage_orders"
    ],
    ADMIN: [
      "manage_restaurants",
      "manage_users",
      "manage_billing",
      "view_analytics",
      "manage_orders"
    ],
    RESTAURANT_OWNER: [
      "manage_orders",
      "view_analytics"
    ],
    RESTAURANT_STAFF: [
      "manage_orders"
    ]
  }
  
  return permissions[session.user.role as UserRole]?.includes(permission) || false
}