'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock, CheckCircle, XCircle, Truck, ChefHat, RefreshCw, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { toast } from 'sonner'

interface Order {
  id: string
  orderNumber: number
  tableNumber?: number
  status: string
  total: number
  items: any[]
  createdAt: string
  updatedAt: string
}

interface LiveOrdersFallbackProps {
  restaurantId: string
}

export function LiveOrdersFallback({ restaurantId }: LiveOrdersFallbackProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Lade Bestellungen
  const loadOrders = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch(`/api/restaurants/${restaurantId}/orders`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      } else {
        console.error('Fehler beim Laden der Bestellungen')
      }
    } catch (error) {
      console.error('Fehler beim Laden der Bestellungen:', error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  // Auto-Refresh alle 10 Sekunden (da keine Realtime-Updates)
  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 10000)
    return () => clearInterval(interval)
  }, [restaurantId])

  // Status Update
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (response.ok) {
        toast.success('Status aktualisiert')
        loadOrders() // Reload orders
      } else {
        throw new Error('Fehler beim Aktualisieren')
      }
    } catch (error) {
      console.error('Fehler beim Statusupdate:', error)
      toast.error('Fehler beim Aktualisieren des Status')
    }
  }

  // Filtere Bestellungen
  const filteredOrders = filter === 'ALL' 
    ? orders 
    : orders.filter(order => order.status === filter)

  // Status Badge
  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      PENDING: { label: 'Ausstehend', variant: 'secondary' as const, icon: Clock },
      CONFIRMED: { label: 'Bestätigt', variant: 'default' as const, icon: CheckCircle },
      PREPARING: { label: 'In Zubereitung', variant: 'default' as const, icon: ChefHat },
      READY: { label: 'Fertig', variant: 'default' as const, icon: CheckCircle },
      DELIVERED: { label: 'Geliefert', variant: 'outline' as const, icon: Truck },
      CANCELLED: { label: 'Storniert', variant: 'destructive' as const, icon: XCircle }
    }[status] || { label: status, variant: 'secondary' as const, icon: Clock }
    
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  // Status Actions
  const StatusActions = ({ order }: { order: Order }) => {
    const nextStatus = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'PREPARING',
      PREPARING: 'READY',
      READY: 'DELIVERED'
    }[order.status]

    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return null
    }

    return (
      <div className="flex gap-2">
        {nextStatus && (
          <Button
            size="sm"
            onClick={() => updateOrderStatus(order.id, nextStatus)}
          >
            {nextStatus === 'CONFIRMED' && 'Bestätigen'}
            {nextStatus === 'PREPARING' && 'Zubereitung starten'}
            {nextStatus === 'READY' && 'Fertig'}
            {nextStatus === 'DELIVERED' && 'Ausgeliefert'}
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
        >
          Stornieren
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="flex items-center gap-2 py-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            Real-time Updates sind deaktiviert. Die Seite aktualisiert sich automatisch alle 10 Sekunden.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={loadOrders}
            disabled={isRefreshing}
            className="ml-auto"
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-2">
        {['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === 'ALL' ? 'Alle' : status}
          </Button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Keine Bestellungen gefunden</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Bestellung #{order.orderNumber}
                    </CardTitle>
                    <CardDescription>
                      {order.tableNumber && `Tisch ${order.tableNumber} • `}
                      {formatDistanceToNow(new Date(order.createdAt), { 
                        addSuffix: true, 
                        locale: de 
                      })}
                    </CardDescription>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">
                    {order.items.length} Artikel
                  </p>
                  <p className="text-lg font-bold">€{order.total.toFixed(2)}</p>
                </div>
                <StatusActions order={order} />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}