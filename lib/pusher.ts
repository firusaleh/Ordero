import Pusher from "pusher"
import PusherClient from "pusher-js"
import { getPusherKey, getPusherCluster, getPusherAppId, getPusherSecret } from "./pusher-config"

// Server-seitiger Pusher Client
export const pusherServer = new Pusher({
  appId: getPusherAppId(),
  key: getPusherKey(),
  secret: getPusherSecret(),
  cluster: getPusherCluster(),
  useTLS: true
})

// Client-seitiger Pusher Client (wird in Komponenten verwendet)
export const getPusherClient = () => {
  if (typeof window === "undefined") {
    throw new Error("Pusher Client kann nur im Browser verwendet werden")
  }
  
  return new PusherClient(
    getPusherKey(),
    {
      cluster: getPusherCluster(),
      authEndpoint: "/api/pusher/auth",
      auth: {
        headers: {
          "Content-Type": "application/json",
        }
      }
    }
  )
}

// Event-Typen für Type-Safety
export type OrderEvent = {
  NEW_ORDER: {
    orderId: string
    restaurantId: string
    tableNumber: string
    items: number
    total: number
    customerName?: string
  }
  ORDER_UPDATED: {
    orderId: string
    status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED"
    updatedBy?: string
  }
  ORDER_CANCELLED: {
    orderId: string
    reason?: string
  }
}

// Channel-Namen
export const getRestaurantChannel = (restaurantId: string) => 
  `private-restaurant-${restaurantId}`

export const getTableChannel = (restaurantId: string, tableNumber: string) => 
  `private-table-${restaurantId}-${tableNumber}`

// Helper-Funktionen für Events
export const triggerOrderEvent = async <K extends keyof OrderEvent>(
  channel: string,
  event: K,
  data: OrderEvent[K]
) => {
  try {
    await pusherServer.trigger(channel, event, data)
  } catch (error) {
    console.error("Fehler beim Senden von Pusher Event:", error)
  }
}