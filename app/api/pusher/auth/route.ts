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

    // Pusher can send data as either form-urlencoded or JSON
    const contentType = req.headers.get("content-type") || ""
    let socket_id: string | undefined
    let channel_name: string | undefined

    // Read body as text first to handle both formats
    const bodyText = await req.text()

    // Try JSON first if content type suggests it
    if (contentType.includes("application/json") && bodyText.startsWith("{")) {
      try {
        const body = JSON.parse(bodyText)
        socket_id = body.socket_id
        channel_name = body.channel_name
      } catch {
        // JSON parsing failed, will try form-urlencoded
      }
    }

    // If not JSON or JSON parsing failed, try form-urlencoded
    if (!socket_id || !channel_name) {
      const params = new URLSearchParams(bodyText)
      socket_id = params.get("socket_id") || undefined
      channel_name = params.get("channel_name") || undefined
    }

    if (!socket_id || !channel_name) {
      console.error("Pusher Auth: Missing params. ContentType:", contentType, "Body:", bodyText.substring(0, 200))
      return NextResponse.json({ error: "socket_id und channel_name erforderlich" }, { status: 400 })
    }
    
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
    // For private channels, we use authenticate instead of authorizeChannel
    const authResponse = pusherServer.authenticate(socket_id, channel_name)
    
    return NextResponse.json(authResponse)
  } catch (error: any) {
    console.error("Pusher Auth Fehler:", error?.message || error)
    console.error("Pusher Auth Stack:", error?.stack)
    return NextResponse.json(
      { error: "Autorisierung fehlgeschlagen", details: error?.message || "Unknown error" },
      { status: 500 }
    )
  }
}