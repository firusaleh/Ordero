'use client'

import { LiveOrders } from '@/components/dashboard/live-orders'

interface OrdersViewRealtimeProps {
  restaurantId: string
}

export default function OrdersViewRealtime({ restaurantId }: OrdersViewRealtimeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bestellungen</h1>
        <p className="text-gray-600">Live-Übersicht aller eingehenden Bestellungen</p>
      </div>
      
      <LiveOrders restaurantId={restaurantId} />
    </div>
  )
}