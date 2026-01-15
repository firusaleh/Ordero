'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Receipt, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChefHat,
  AlertCircle,
  Package,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface OrderItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  variant?: string | null
  extras?: any[]
  notes?: string | null
}

interface Order {
  id: string
  orderNumber: string
  status: string
  type: string
  subtotal: number
  tax: number
  tip: number
  total: number
  paymentMethod: string
  paymentStatus: string
  items: OrderItem[]
  createdAt: string
  confirmedAt?: string | null
  preparedAt?: string | null
  readyAt?: string | null
  deliveredAt?: string | null
}

interface OrderHistorySheetProps {
  restaurantSlug: string
  tableNumber: number
  currency?: string
  primaryColor?: string
}

export default function OrderHistorySheet({ 
  restaurantSlug, 
  tableNumber,
  currency = 'EUR',
  primaryColor = '#FF6B35'
}: OrderHistorySheetProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  
  const currencySymbol = currency === 'JOD' ? 'JD' : 
                        currency === 'USD' ? '$' : 
                        currency === 'AED' ? 'AED' : '€'
  
  const formatPrice = (price: number) => `${currencySymbol}${price.toFixed(2)}`

  // Load orders from localStorage and fetch updates
  const loadOrders = async () => {
    setLoading(true)
    try {
      // Get order IDs from localStorage
      const sessionKey = `orders-${restaurantSlug}-table-${tableNumber}`
      const storedOrderIds = JSON.parse(localStorage.getItem(sessionKey) || '[]')
      
      if (storedOrderIds.length > 0) {
        // Fetch order details for each ID
        const orderPromises = storedOrderIds.map(async (orderId: string) => {
          const response = await fetch(`/api/public/${restaurantSlug}/orders/${orderId}`)
          if (response.ok) {
            return response.json()
          }
          return null
        })
        
        const fetchedOrders = await Promise.all(orderPromises)
        const validOrders = fetchedOrders.filter(order => order !== null)
        setOrders(validOrders)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Add new order to history
  const addOrderToHistory = (orderNumber: string, orderId: string) => {
    const sessionKey = `orders-${restaurantSlug}-table-${tableNumber}`
    const storedOrderIds = JSON.parse(localStorage.getItem(sessionKey) || '[]')
    
    if (!storedOrderIds.includes(orderId)) {
      storedOrderIds.push(orderId)
      localStorage.setItem(sessionKey, JSON.stringify(storedOrderIds))
      loadOrders() // Reload to get the new order
    }
  }

  useEffect(() => {
    if (open) {
      loadOrders()
    }
  }, [open])

  // Listen for new orders being added
  useEffect(() => {
    const handleNewOrder = (event: CustomEvent) => {
      const { orderNumber, orderId } = event.detail
      addOrderToHistory(orderNumber, orderId)
    }

    window.addEventListener('orderCreated' as any, handleNewOrder as EventListener)
    return () => {
      window.removeEventListener('orderCreated' as any, handleNewOrder as EventListener)
    }
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'CONFIRMED':
        return <CheckCircle className="h-4 w-4" />
      case 'PREPARING':
        return <ChefHat className="h-4 w-4" />
      case 'READY':
        return <Package className="h-4 w-4" />
      case 'DELIVERED':
      case 'PAID':
        return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'PREPARING':
        return 'bg-orange-100 text-orange-800'
      case 'READY':
        return 'bg-green-100 text-green-800'
      case 'DELIVERED':
      case 'PAID':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Ausstehend'
      case 'CONFIRMED':
        return 'Bestätigt'
      case 'PREPARING':
        return 'In Zubereitung'
      case 'READY':
        return 'Fertig'
      case 'DELIVERED':
        return 'Geliefert'
      case 'PAID':
        return 'Bezahlt'
      case 'CANCELLED':
        return 'Storniert'
      default:
        return status
    }
  }

  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40"
          style={{ 
            backgroundColor: primaryColor,
            borderColor: primaryColor,
            color: 'white'
          }}
        >
          <Receipt className="h-6 w-6" />
          {orders.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {orders.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[90vw] sm:w-[450px] p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="flex items-center justify-between">
            <span>Meine Bestellungen</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadOrders()}
              disabled={loading}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
          <div className="px-6 pb-6">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Noch keine Bestellungen</p>
                <p className="text-sm text-gray-400 mt-1">
                  Ihre Bestellungen werden hier angezeigt
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 space-y-3">
                    {/* Order Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-lg">
                          {order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(order.createdAt), 'HH:mm', { locale: de })} Uhr
                        </div>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {getStatusText(order.status)}
                        </span>
                      </Badge>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2 pt-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <div className="flex-1">
                            <span className="text-gray-500">{item.quantity}x</span>{' '}
                            <span>{item.name}</span>
                            {item.variant && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({item.variant})
                              </span>
                            )}
                            {item.extras && item.extras.length > 0 && (
                              <div className="text-xs text-gray-500 ml-4">
                                + {item.extras.map((e: any) => e.name).join(', ')}
                              </div>
                            )}
                          </div>
                          <span className="font-medium">
                            {formatPrice(item.totalPrice)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Total */}
                    <Separator />
                    <div className="flex justify-between items-center pt-1">
                      <span className="font-semibold">Gesamt</span>
                      <span className="font-semibold text-lg" style={{ color: primaryColor }}>
                        {formatPrice(order.total)}
                      </span>
                    </div>

                    {/* Payment Status */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Zahlung</span>
                      <Badge variant={order.paymentStatus === 'PAID' ? 'default' : 'outline'}>
                        {order.paymentStatus === 'PAID' ? 'Bezahlt' : 'Ausstehend'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with total */}
        {orders.length > 0 && (
          <div className="border-t p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Gesamtbetrag</span>
              <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                {formatPrice(totalAmount)}
              </span>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Tisch {tableNumber} • {orders.length} {orders.length === 1 ? 'Bestellung' : 'Bestellungen'}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}