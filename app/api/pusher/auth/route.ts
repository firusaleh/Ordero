import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pusherServer } from "@/lib/pusher"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }
    
    const body = await req.json()
    const { socket_id, channel_name } = body
    
    // Validiere Channel-Zugriff
    const channelParts = channel_name.split("-")
    
    if (channelParts[0] !== "private") {
      return NextResponse.json({ error: "Nur private Channels erlaubt" }, { status: 403 })
    }
    
    // Restaurant-Channel: private-restaurant-{restaurantId}
    if (channelParts[1] === "restaurant") {
      const restaurantId = channelParts[2]
      
      // Prüfe ob User Zugriff auf dieses Restaurant hat
      if (session.user.role === "SUPER_ADMIN") {
        // Super Admin hat immer Zugriff
      } else {
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
          return NextResponse.json({ error: "Kein Zugriff auf dieses Restaurant" }, { status: 403 })
        }
      }
    }
    
    // Table-Channel: private-table-{restaurantId}-{tableNumber}
    if (channelParts[1] === "table") {
      const restaurantId = channelParts[2]
      const tableNumber = channelParts[3]
      
      // Öffentlicher Zugriff für Gäste (Session wird über Cookie validiert)
      // Hier könnte man zusätzliche Validierung hinzufügen
    }
    
    // Autorisiere den Channel
    const authResponse = pusherServer.authorizeChannel(socket_id, channel_name, {
      user_id: session.user.id,
      user_info: {
        name: session.user.name || session.user.email,
        role: session.user.role
      }
    })
    
    return NextResponse.json(authResponse)
  } catch (error) {
    console.error("Pusher Auth Fehler:", error)
    return NextResponse.json(
      { error: "Autorisierung fehlgeschlagen" }, 
      { status: 500 }
    )
  }
}