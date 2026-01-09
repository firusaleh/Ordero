"use client"

import { useState, useEffect } from 'react'
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
  Clock
} from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRestaurants: 12,
    activeRestaurants: 10,
    totalUsers: 45,
    totalRevenue: 15680,
    totalOrders: 1234,
    pendingInvoices: 3
  })

  const recentActivities = [
    {
      id: 1,
      type: 'restaurant_created',
      message: 'Neues Restaurant "Bella Italia" registriert',
      time: 'vor 2 Stunden',
      icon: Store,
      color: 'text-green-500'
    },
    {
      id: 2,
      type: 'payment_received',
      message: 'Zahlung von "Burger Palace" erhalten (79€)',
      time: 'vor 3 Stunden',
      icon: Euro,
      color: 'text-blue-500'
    },
    {
      id: 3,
      type: 'subscription_cancelled',
      message: 'Restaurant "Sushi Bar" hat gekündigt',
      time: 'vor 5 Stunden',
      icon: XCircle,
      color: 'text-red-500'
    },
    {
      id: 4,
      type: 'order_milestone',
      message: 'Pizza Roma hat 1000 Bestellungen erreicht',
      time: 'vor 1 Tag',
      icon: TrendingUp,
      color: 'text-purple-500'
    }
  ]

  const restaurantStatus = [
    { name: 'Pizza Roma', status: 'active', plan: 'Premium', revenue: 3420 },
    { name: 'Burger Palace', status: 'active', plan: 'Standard', revenue: 2180 },
    { name: 'Bella Italia', status: 'trial', plan: 'Trial', revenue: 0 },
    { name: 'Sushi Bar', status: 'suspended', plan: 'Standard', revenue: 1890 },
    { name: 'Döner King', status: 'active', plan: 'Premium', revenue: 4560 }
  ]

  const systemHealth = [
    { service: 'Database', status: 'operational', latency: '12ms' },
    { service: 'API Server', status: 'operational', latency: '45ms' },
    { service: 'Stripe', status: 'operational', latency: '230ms' },
    { service: 'Email Service', status: 'degraded', latency: '1200ms' },
    { service: 'POS Integration', status: 'operational', latency: '180ms' }
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-1">Übersicht über die gesamte Plattform</p>
      </div>

      {/* Statistik-Karten */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Restaurants Gesamt</CardTitle>
            <Store className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalRestaurants}</div>
            <div className="flex items-center mt-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                {stats.activeRestaurants} Aktiv
              </Badge>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 ml-2">
                {stats.totalRestaurants - stats.activeRestaurants} Inaktiv
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Monatsumsatz</CardTitle>
            <Euro className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalRevenue.toLocaleString()} €</div>
            <p className="text-xs text-green-500 mt-2">+12% gegenüber Vormonat</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Gesamtbestellungen</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-gray-400 mt-2">Diesen Monat</p>
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
            {recentActivities.map((activity) => {
              const Icon = activity.icon
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`p-2 bg-gray-700/50 rounded-lg ${activity.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              )
            })}
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
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Top Restaurants</CardTitle>
          <CardDescription className="text-gray-400">
            Übersicht der aktivsten Restaurants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {restaurantStatus.map((restaurant) => (
              <div key={restaurant.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                    <Store className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{restaurant.name}</p>
                    <p className="text-xs text-gray-400">Plan: {restaurant.plan}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{restaurant.revenue.toLocaleString()} €</p>
                    <p className="text-xs text-gray-500">Umsatz</p>
                  </div>
                  <Badge 
                    variant="outline"
                    className={
                      restaurant.status === 'active'
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : restaurant.status === 'trial'
                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }
                  >
                    {restaurant.status === 'active' ? 'Aktiv' : restaurant.status === 'trial' ? 'Trial' : 'Gesperrt'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}