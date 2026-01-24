"use client"

import { useState, useEffect } from "react"
import { useRealtimeOrders, type RealtimeOrder } from "@/hooks/use-realtime-orders"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Clock, CheckCircle, XCircle, Truck, ChefHat, Volume2, VolumeX } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { de, ar, enUS } from "date-fns/locale"
import { useNotificationSound } from "@/lib/hooks/use-notification-sound"
import { useToast } from "@/hooks/use-toast"
import { usePusher } from "@/components/providers/pusher-provider"
import { LiveOrdersFallback } from "./live-orders-fallback"
import { useLanguage } from "@/contexts/language-context"
import { useRestaurantCurrency } from "@/hooks/use-restaurant-currency"

interface LiveOrdersProps {
  restaurantId: string
}

export function LiveOrders({ restaurantId }: LiveOrdersProps) {
  const { t, language } = useLanguage()
  const [filter, setFilter] = useState<string>("ALL")
  const [previousOrderCount, setPreviousOrderCount] = useState(0)
  const { playSound, isEnabled: soundEnabled, toggleSound } = useNotificationSound()
  const { toast } = useToast()
  const { pusher } = usePusher()
  const { formatPrice } = useRestaurantCurrency()
  
  // Select date-fns locale based on language
  const getLocale = () => {
    switch(language) {
      case 'ar': return ar
      case 'de': return de
      default: return enUS
    }
  }
  
  const { orders, isListening, updateOrderStatus, cancelOrder } = useRealtimeOrders({
    restaurantId,
    showNotifications: true
  })
  
  // Wenn Pusher nicht verfügbar ist, verwende Fallback
  const isPusherConfigured = Boolean(process.env.NEXT_PUBLIC_PUSHER_KEY && 
    process.env.NEXT_PUBLIC_PUSHER_KEY !== 'your-pusher-key' && 
    process.env.NEXT_PUBLIC_PUSHER_KEY !== 'local-key')
  
  if (!isPusherConfigured && !isListening) {
    return <LiveOrdersFallback restaurantId={restaurantId} />
  }

  // Sound bei neuen Bestellungen abspielen
  useEffect(() => {
    if (orders.length > previousOrderCount && previousOrderCount > 0) {
      // Neue Bestellung erkannt
      playSound()
      
      // Finde neue Bestellung(en)
      const newOrders = orders.slice(0, orders.length - previousOrderCount)
      newOrders.forEach(order => {
        toast({
          title: `🔔 ${t('orders.newOrder')}`,
          description: t('orders.newOrderDesc').replace('{{table}}', order.tableNumber?.toString() || t('orders.takeaway')),
          duration: 5000,
        })
      })
    }
    setPreviousOrderCount(orders.length)
  }, [orders, previousOrderCount, playSound, toast])

  // Filtere Bestellungen basierend auf Status
  const filteredOrders = filter === "ALL" 
    ? orders 
    : orders.filter(order => order.status === filter)

  // Status-Badge-Komponente
  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      PENDING: { label: t('orders.status.pending'), variant: "secondary" as const, icon: Clock },
      CONFIRMED: { label: t('orders.status.confirmed'), variant: "default" as const, icon: CheckCircle },
      PREPARING: { label: t('orders.status.preparing'), variant: "default" as const, icon: ChefHat },
      READY: { label: t('orders.status.ready'), variant: "default" as const, icon: Bell },
      DELIVERED: { label: t('orders.status.delivered'), variant: "outline" as const, icon: Truck },
      CANCELLED: { label: t('orders.status.cancelled'), variant: "destructive" as const, icon: XCircle }
    }[status] || { label: status, variant: "secondary" as const, icon: Clock }
    
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  // Status-Update-Buttons
  const StatusActions = ({ order }: { order: RealtimeOrder }) => {
    const nextStatus = {
      PENDING: "CONFIRMED",
      CONFIRMED: "PREPARING",
      PREPARING: "READY",
      READY: "DELIVERED"
    }[order.status as keyof { PENDING: string; CONFIRMED: string; PREPARING: string; READY: string }]

    if (order.status === "DELIVERED" || order.status === "CANCELLED") {
      return null
    }

    return (
      <div className="flex gap-2">
        {nextStatus && (
          <Button
            size="sm"
            onClick={() => updateOrderStatus(order.id, nextStatus)}
          >
            {nextStatus === "CONFIRMED" && t('orders.actions.confirm')}
            {nextStatus === "PREPARING" && t('orders.actions.startPreparing')}
            {nextStatus === "READY" && t('orders.actions.markReady')}
            {nextStatus === "DELIVERED" && t('orders.actions.markDelivered')}
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {
            if (confirm(t('orders.actions.cancelConfirm'))) {
              cancelOrder(order.id, t('orders.actions.cancelledByStaff'))
            }
          }}
        >
          {t('orders.actions.cancel')}
        </Button>
      </div>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 rtl:gap-x-reverse">
              {t('orders.liveOrders')}
              {isListening ? (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {t('orders.offline')}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {isListening 
                ? t('orders.realtime')
                : t('orders.noRealtime')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleSound}
              title={soundEnabled ? t('orders.soundDisabled') : t('orders.soundEnabled')}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {filteredOrders.length} {t('orders.title')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter-Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            size="sm"
            variant={filter === "ALL" ? "default" : "outline"}
            onClick={() => setFilter("ALL")}
          >
            {t('orders.filter.all')}
          </Button>
          <Button
            size="sm"
            variant={filter === "PENDING" ? "default" : "outline"}
            onClick={() => setFilter("PENDING")}
          >
            {t('orders.filter.pending')}
          </Button>
          <Button
            size="sm"
            variant={filter === "CONFIRMED" ? "default" : "outline"}
            onClick={() => setFilter("CONFIRMED")}
          >
            {t('orders.filter.confirmed')}
          </Button>
          <Button
            size="sm"
            variant={filter === "PREPARING" ? "default" : "outline"}
            onClick={() => setFilter("PREPARING")}
          >
            {t('orders.filter.preparing')}
          </Button>
          <Button
            size="sm"
            variant={filter === "READY" ? "default" : "outline"}
            onClick={() => setFilter("READY")}
          >
            {t('orders.filter.ready')}
          </Button>
        </div>

        {/* Bestellungen-Liste */}
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {filter === "ALL" 
                  ? t('orders.noOrders') 
                  : t('orders.noOrders')}
              </div>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 rtl:gap-x-reverse">
                        <span className="font-semibold">
                          {order.tableNumber ? `${t('orders.table')} ${order.tableNumber}` : (order.type === 'TAKEAWAY' ? t('orders.takeaway') : t('orders.unknownTable'))}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      {order.customerName && (
                        <p className="text-sm text-gray-500">
                          {order.customerName}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(order.createdAt), {
                          addSuffix: true,
                          locale: getLocale()
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{formatPrice(order.total)}</p>
                      <p className="text-xs text-gray-500">
                        #{order.id.slice(-6).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Bestellte Artikel */}
                  <div className="border-t border-b py-2 my-3">
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span>{formatPrice(item.quantity * item.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Aktionen */}
                  <StatusActions order={order} />
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}