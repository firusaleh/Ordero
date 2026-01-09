"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChefHat,
  Package,
  Truck,
  DollarSign,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import EmptyState from '@/components/shared/empty-state'
import Loading from '@/components/ui/loading'
import ErrorBoundary from '@/components/error-boundary'
import { cn } from '@/lib/utils'

interface OrderItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string | null
  menuItem: {
    name: string
  }
}

interface Order {
  id: string
  orderNumber: number
  status: string
  type: string
  total: number
  createdAt: string
  table?: {
    number: number
    name?: string | null
  } | null
  items: OrderItem[]
  guestName?: string | null
  guestPhone?: string | null
  notes?: string | null
}

interface OrdersViewProps {
  initialOrders: Order[]
  restaurantId: string
}

const statusConfig = {
  PENDING: { label: 'Ausstehend', color: 'bg-yellow-500', icon: AlertCircle },
  CONFIRMED: { label: 'Bestätigt', color: 'bg-blue-500', icon: CheckCircle },
  PREPARING: { label: 'In Zubereitung', color: 'bg-orange-500', icon: ChefHat },
  READY: { label: 'Fertig', color: 'bg-green-500', icon: Package },
  DELIVERED: { label: 'Serviert', color: 'bg-gray-500', icon: Truck },
  CANCELLED: { label: 'Storniert', color: 'bg-red-500', icon: XCircle },
  PAID: { label: 'Bezahlt', color: 'bg-purple-500', icon: DollarSign },
}

export default function OrdersView({ initialOrders, restaurantId }: OrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [filter, setFilter] = useState('all')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  // Simuliere Realtime Updates (in Produktion würde hier Supabase Realtime verwendet)
  useEffect(() => {
    const interval = setInterval(() => {
      // Hier würden normalerweise neue Bestellungen abgerufen
    }, 10000) // Alle 10 Sekunden

    return () => clearInterval(interval)
  }, [])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId)
    
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren')
      }

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ))

      toast.success('Status aktualisiert')
      
      // Sound abspielen
      if (newStatus === 'READY') {
        playNotificationSound()
      }
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Status')
    } finally {
      setIsUpdating(null)
    }
  }

  const playNotificationSound = () => {
    // Spiele einen Ton ab wenn eine Bestellung fertig ist
    const audio = new Audio('/sounds/notification.mp3')
    audio.play().catch(() => {})
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    return order.status === filter
  })

  const getNextStatus = (currentStatus: string) => {
    const statusFlow: { [key: string]: string } = {
      'PENDING': 'CONFIRMED',
      'CONFIRMED': 'PREPARING',
      'PREPARING': 'READY',
      'READY': 'DELIVERED',
      'DELIVERED': 'PAID',
    }
    return statusFlow[currentStatus] || null
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bestellungen</h1>
          <p className="text-gray-600">Verwalten Sie eingehende Bestellungen</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Package}
              title="Noch keine Bestellungen"
              description="Sobald Gäste über Ihre QR-Codes bestellen, erscheinen die Bestellungen hier."
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bestellungen</h1>
          <p className="text-gray-600">Verwalten Sie eingehende Bestellungen</p>
        </div>
        <Button variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ausstehend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Bearbeitung</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {orders.filter(o => ['CONFIRMED', 'PREPARING'].includes(o.status)).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fertig</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'READY').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Heute Total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{orders.reduce((sum, o) => sum + Number(o.total), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="PENDING">Ausstehend</TabsTrigger>
          <TabsTrigger value="CONFIRMED">Bestätigt</TabsTrigger>
          <TabsTrigger value="PREPARING">In Zubereitung</TabsTrigger>
          <TabsTrigger value="READY">Fertig</TabsTrigger>
          <TabsTrigger value="DELIVERED">Serviert</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <div className="grid gap-4">
            {filteredOrders.map((order) => {
              const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || AlertCircle
              const nextStatus = getNextStatus(order.status)
              
              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <CardTitle>Bestellung #{order.orderNumber}</CardTitle>
                          <Badge 
                            className={cn(
                              statusConfig[order.status as keyof typeof statusConfig]?.color,
                              'text-white'
                            )}
                          >
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig[order.status as keyof typeof statusConfig]?.label}
                          </Badge>
                          {order.type === 'TAKEAWAY' && (
                            <Badge variant="outline">Zum Mitnehmen</Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {order.table ? `Tisch ${order.table.number}` : 'Takeaway'}
                          {' • '}
                          <Clock className="inline h-3 w-3" />
                          {' '}
                          {format(new Date(order.createdAt), 'HH:mm', { locale: de })}
                          {' • '}
                          €{Number(order.total).toFixed(2)}
                        </CardDescription>
                      </div>
                      
                      <div className="flex gap-2">
                        {nextStatus && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, nextStatus)}
                            disabled={isUpdating === order.id}
                          >
                            {isUpdating === order.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                {nextStatus === 'CONFIRMED' && 'Bestätigen'}
                                {nextStatus === 'PREPARING' && 'Zubereiten'}
                                {nextStatus === 'READY' && 'Fertig'}
                                {nextStatus === 'DELIVERED' && 'Serviert'}
                                {nextStatus === 'PAID' && 'Bezahlt'}
                              </>
                            )}
                          </Button>
                        )}
                        
                        {order.status !== 'CANCELLED' && order.status !== 'PAID' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                            disabled={isUpdating === order.id}
                          >
                            Stornieren
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {item.quantity}x {item.menuItem.name}
                            </p>
                            {item.notes && (
                              <p className="text-sm text-gray-500">{item.notes}</p>
                            )}
                          </div>
                          <span className="text-sm">€{Number(item.totalPrice).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {order.notes && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm">
                          <strong>Notiz:</strong> {order.notes}
                        </p>
                      </div>
                    )}
                    
                    {order.guestName && (
                      <div className="mt-4 text-sm text-gray-600">
                        <p><strong>Gast:</strong> {order.guestName}</p>
                        {order.guestPhone && <p><strong>Tel:</strong> {order.guestPhone}</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}