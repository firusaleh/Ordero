'use client'

import { LiveOrders } from '@/components/dashboard/live-orders'
import { useLanguage } from '@/contexts/language-context'

interface OrdersViewRealtimeProps {
  restaurantId: string
}

export default function OrdersViewRealtime({ restaurantId }: OrdersViewRealtimeProps) {
  const { t } = useLanguage()
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('orders.title')}</h1>
        <p className="text-gray-600">{t('orders.subtitle')}</p>
      </div>
      
      <LiveOrders restaurantId={restaurantId} />
    </div>
  )
}