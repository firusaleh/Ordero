"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useSession } from "next-auth/react"
import PusherClient from "pusher-js"
import { Channel } from "pusher-js"
import { getPusherKey, getPusherCluster } from "@/lib/pusher-config"

interface PusherContextType {
  pusher: PusherClient | null
  isConnected: boolean
  subscribe: (channelName: string) => Channel | null
  unsubscribe: (channelName: string) => void
}

const PusherContext = createContext<PusherContextType>({
  pusher: null,
  isConnected: false,
  subscribe: () => null,
  unsubscribe: () => {}
})

export function PusherProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [pusher, setPusher] = useState<PusherClient | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user) return

    // Hole Pusher Konfiguration
    const pusherKey = getPusherKey()
    const pusherCluster = getPusherCluster()
    
    console.log("Pusher Konfiguration - Key:", !!pusherKey, "Cluster:", pusherCluster)
    
    // Prüfe ob Pusher konfiguriert ist
    if (!pusherKey) {
      console.error("Pusher Key fehlt - Echtzeit-Features sind deaktiviert")
      return
    }

    try {
      // Initialisiere Pusher Client
      const client = new PusherClient(pusherKey, {
        cluster: pusherCluster || "eu",
        authEndpoint: "/api/pusher/auth",
        auth: {
          headers: {
            "Content-Type": "application/json",
          }
        }
      })

      // Connection Event Handlers
      client.connection.bind("connected", () => {
        console.log("Pusher verbunden")
        setIsConnected(true)
      })

      client.connection.bind("disconnected", () => {
        console.log("Pusher getrennt")
        setIsConnected(false)
      })

      client.connection.bind("error", (error: any) => {
        // Nur warnen, nicht als Fehler loggen
        console.warn("Pusher Verbindung nicht möglich - Echtzeit-Features deaktiviert", error)
        setIsConnected(false)
      })

      setPusher(client)

      // Cleanup
      return () => {
        client.disconnect()
        setPusher(null)
        setIsConnected(false)
      }
    } catch (error) {
      console.warn("Pusher konnte nicht initialisiert werden:", error)
    }
  }, [session, status])

  const subscribe = (channelName: string): Channel | null => {
    if (!pusher) return null
    
    try {
      // Prüfe ob bereits subscribed
      const existingChannel = pusher.channel(channelName)
      if (existingChannel) {
        return existingChannel
      }
      
      // Subscribe zu neuem Channel
      const channel = pusher.subscribe(channelName)
      
      channel.bind("pusher:subscription_succeeded", () => {
        console.log(`Erfolgreich zu ${channelName} subscribed`)
      })
      
      channel.bind("pusher:subscription_error", (error: any) => {
        console.error(`Fehler beim Subscriben zu ${channelName}:`, error)
      })
      
      return channel
    } catch (error) {
      console.error("Subscribe Fehler:", error)
      return null
    }
  }

  const unsubscribe = (channelName: string) => {
    if (!pusher) return
    
    try {
      pusher.unsubscribe(channelName)
      console.log(`Unsubscribed von ${channelName}`)
    } catch (error) {
      console.error("Unsubscribe Fehler:", error)
    }
  }

  return (
    <PusherContext.Provider value={{ pusher, isConnected, subscribe, unsubscribe }}>
      {children}
    </PusherContext.Provider>
  )
}

export const usePusher = () => {
  const context = useContext(PusherContext)
  if (!context) {
    throw new Error("usePusher muss innerhalb von PusherProvider verwendet werden")
  }
  return context
}