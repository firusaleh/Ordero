'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Store, 
  Users, 
  Euro, 
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Package
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface DashboardProps {
  stats: {
    totalRestaurants: number
    activeRestaurants: number
    trialRestaurants: number
    suspendedRestaurants: number
    totalUsers: number
    totalRevenue: number
    totalOrders: number
    paidOrders: number
  }
  topRestaurants: Array<{
    id: string
    name: string
    status: string
    plan: string
    orderCount: number
  }>
  recentActivities: Array<{
    id: string
    type: string
    message: string
    time: Date
    details?: string
  }>
  restaurants: Array<any>
}

export default function AdminDashboardView({ stats, topRestaurants, recentActivities }: DashboardProps) {
  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'restaurant_created':
        return { icon: Store, color: 'text-green-500' }
      case 'new_order':
        return { icon: ShoppingCart, color: 'text-blue-500' }
      case 'payment_received':
        return { icon: Euro, color: 'text-emerald-500' }
      case 'subscription_cancelled':
        return { icon: XCircle, color: 'text-red-500' }
      default:
        return { icon: Activity, color: 'text-gray-500' }
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      ACTIVE: { color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Aktiv' },
      TRIAL: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Trial' },
      PENDING: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'Ausstehend' },
      SUSPENDED: { color: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Gesperrt' }
    }
    return config[status as keyof typeof config] || config.PENDING
  }

  const getPlanBadge = (plan: string) => {
    const config: Record<string, { color: string; label: string }> = {
      FREE: { color: 'bg-gray-700 text-gray-300', label: 'Free' },
      TRIAL: { color: 'bg-blue-700 text-blue-300', label: 'Trial' },
      STANDARD: { color: 'bg-purple-700 text-purple-300', label: 'Standard' },
      PREMIUM: { color: 'bg-orange-700 text-orange-300', label: 'Premium' },
      // German Plans
      PAY_PER_ORDER_DE: { color: 'bg-green-700 text-green-300', label: 'DE Pay per Order' },
      FLATRATE_MONTHLY_DE: { color: 'bg-indigo-700 text-indigo-300', label: 'DE Flatrate Monatlich' },
      FLATRATE_YEARLY_DE: { color: 'bg-indigo-700 text-indigo-300', label: 'DE Flatrate Jährlich' },
      // Jordan Plans  
      PAY_PER_ORDER_JO: { color: 'bg-yellow-700 text-yellow-300', label: 'JO Pay per Order' },
      FLATRATE_MONTHLY_JO: { color: 'bg-pink-700 text-pink-300', label: 'JO Flatrate Monthly' },
      FLATRATE_YEARLY_JO: { color: 'bg-pink-700 text-pink-300', label: 'JO Flatrate Yearly' }
    }
    return config[plan] || { color: 'bg-gray-700 text-gray-300', label: plan || 'Free' }
  }

  // System Health (kann später mit echten Daten verbunden werden)
  const systemHealth = [
    { service: 'Database', status: 'operational', latency: '12ms' },
    { service: 'API Server', status: 'operational', latency: '45ms' },
    { service: 'Stripe', status: 'operational', latency: '230ms' },
    { service: 'Email Service', status: 'operational', latency: '180ms' },
    { service: 'MongoDB', status: 'operational', latency: '25ms' }
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-1">Übersicht über die gesamte Plattform</p>
      </div>

      {/* Statistik-Karten */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Restaurants Gesamt</CardTitle>
            <Store className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalRestaurants}</div>
            <div className="flex items-center mt-2 gap-1">
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                {stats.activeRestaurants} Aktiv
              </Badge>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">
                {stats.trialRestaurants} Trial
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Benutzer</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">Registrierte Nutzer</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Monatsumsatz</CardTitle>
            <Euro className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalRevenue.toLocaleString()} €</div>
            <p className="text-xs text-green-500 mt-2">
              {stats.paidOrders} bezahlte Bestellungen
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Bestellungen</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalOrders}</div>
            <p className="text-xs text-gray-400 mt-1">Diesen Monat</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Letzte Aktivitäten */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Letzte Aktivitäten</CardTitle>
            <CardDescription className="text-gray-400">
              Wichtige Ereignisse auf der Plattform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => {
                const { icon: Icon, color } = getActivityIcon(activity.type)
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-2 bg-gray-700/50 rounded-lg ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-300">{activity.message}</p>
                      {activity.details && (
                        <p className="text-xs text-gray-500 mt-0.5">{activity.details}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: de })}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-gray-500 text-center py-8">Keine Aktivitäten vorhanden</p>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">System Status</CardTitle>
            <CardDescription className="text-gray-400">
              Überwachung aller Services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemHealth.map((service) => (
              <div key={service.service} className="flex items-center justify-between p-2 rounded-lg bg-gray-700/30">
                <div className="flex items-center gap-3">
                  {service.status === 'operational' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : service.status === 'degraded' ? (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-300">{service.service}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{service.latency}</span>
                  <Badge 
                    variant="outline" 
                    className={
                      service.status === 'operational' 
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : service.status === 'degraded'
                        ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }
                  >
                    {service.status === 'operational' ? 'Online' : service.status === 'degraded' ? 'Eingeschränkt' : 'Offline'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Restaurants */}
      {topRestaurants.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Top Restaurants</CardTitle>
            <CardDescription className="text-gray-400">
              Die aktivsten Restaurants nach Bestellungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRestaurants.map((restaurant, index) => {
                const statusConfig = getStatusBadge(restaurant.status)
                const planConfig = getPlanBadge(restaurant.plan)
                
                return (
                  <div key={restaurant.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-white">{restaurant.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                          <Badge variant="outline" className={planConfig.color}>
                            {planConfig.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{restaurant.orderCount}</p>
                      <p className="text-xs text-gray-500">Bestellungen</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}