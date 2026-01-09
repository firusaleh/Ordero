"use client"

import { useEffect, useState, useCallback } from "react"
import { usePusher } from "@/components/providers/pusher-provider"
import { toast } from "sonner"

export interface RealtimeOrder {
  id: string
  restaurantId: string
  tableNumber: string
  customerName?: string
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED"
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
  total: number
  createdAt: Date
  updatedAt: Date
}

interface UseRealtimeOrdersOptions {
  restaurantId: string
  onNewOrder?: (order: RealtimeOrder) => void
  onOrderUpdate?: (orderId: string, status: string) => void
  onOrderCancelled?: (orderId: string, reason?: string) => void
  showNotifications?: boolean
}

export function useRealtimeOrders({
  restaurantId,
  onNewOrder,
  onOrderUpdate,
  onOrderCancelled,
  showNotifications = true
}: UseRealtimeOrdersOptions) {
  const { subscribe, unsubscribe } = usePusher()
  const [orders, setOrders] = useState<RealtimeOrder[]>([])
  const [isListening, setIsListening] = useState(false)

  // Lade initiale Bestellungen
  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/orders`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error("Fehler beim Laden der Bestellungen:", error)
    }
  }, [restaurantId])

  useEffect(() => {
    if (!restaurantId) return

    loadOrders()

    // Überprüfe ob Pusher verfügbar ist
    if (!subscribe || !unsubscribe) {
      console.log("Pusher ist nicht konfiguriert - Real-time Updates deaktiviert")
      return
    }

    const channelName = `private-restaurant-${restaurantId}`
    const channel = subscribe(channelName)

    if (!channel) {
      console.log("Real-time Updates nicht verfügbar - Pusher nicht konfiguriert")
      return
    }

    setIsListening(true)

    // Event: Neue Bestellung
    channel.bind("NEW_ORDER", (data: any) => {
      console.log("Neue Bestellung erhalten:", data)
      
      setOrders(prev => [data, ...prev])
      
      if (showNotifications) {
        toast.success("Neue Bestellung!", {
          description: `Tisch ${data.tableNumber} - ${data.items} Artikel - €${data.total}`
        })
      }
      
      onNewOrder?.(data)
    })

    // Event: Bestellungs-Update
    channel.bind("ORDER_UPDATED", (data: any) => {
      console.log("Bestellung aktualisiert:", data)
      
      setOrders(prev => prev.map(order => 
        order.id === data.orderId 
          ? { ...order, status: data.status, updatedAt: new Date() }
          : order
      ))
      
      if (showNotifications) {
        const statusText = {
          CONFIRMED: "bestätigt",
          PREPARING: "wird zubereitet",
          READY: "fertig",
          DELIVERED: "geliefert",
          CANCELLED: "storniert"
        }[data.status as keyof { CONFIRMED: string; PREPARING: string; READY: string; DELIVERED: string; CANCELLED: string }] || data.status
        
        toast.info(`Bestellung ${statusText}`, {
          description: `Bestellnummer: ${data.orderId.slice(-6)}`
        })
      }
      
      onOrderUpdate?.(data.orderId, data.status)
    })

    // Event: Bestellung storniert
    channel.bind("ORDER_CANCELLED", (data: any) => {
      console.log("Bestellung storniert:", data)
      
      setOrders(prev => prev.map(order => 
        order.id === data.orderId 
          ? { ...order, status: "CANCELLED" as const, updatedAt: new Date() }
          : order
      ))
      
      if (showNotifications) {
        toast.error("Bestellung storniert", {
          description: data.reason || "Keine Begründung angegeben"
        })
      }
      
      onOrderCancelled?.(data.orderId, data.reason)
    })

    // Cleanup
    return () => {
      channel.unbind_all()
      unsubscribe(channelName)
      setIsListening(false)
    }
  }, [restaurantId, subscribe, unsubscribe, onNewOrder, onOrderUpdate, onOrderCancelled, showNotifications, loadOrders])

  // Funktion zum Aktualisieren des Bestellstatus
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      
      if (!response.ok) {
        throw new Error("Fehler beim Aktualisieren")
      }
      
      // Update wird über Pusher Event empfangen
    } catch (error) {
      console.error("Fehler beim Statusupdate:", error)
      toast.error("Fehler beim Aktualisieren des Status")
    }
  }

  // Funktion zum Stornieren einer Bestellung
  const cancelOrder = async (orderId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      })
      
      if (!response.ok) {
        throw new Error("Fehler beim Stornieren")
      }
      
      // Update wird über Pusher Event empfangen
    } catch (error) {
      console.error("Fehler beim Stornieren:", error)
      toast.error("Fehler beim Stornieren der Bestellung")
    }
  }

  return {
    orders,
    isListening,
    updateOrderStatus,
    cancelOrder,
    refresh: loadOrders
  }
}