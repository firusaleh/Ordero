"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TrendingUp, 
  Users, 
  Euro, 
  ShoppingCart,
  Activity,
  PieChart,
  BarChart3,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

export default function AdminStatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Statistiken</h1>
        <p className="text-gray-400 mt-1">Detaillierte Plattform-Analytics</p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Monatsumsatz</CardTitle>
            <Euro className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">€48,352</div>
            <div className="flex items-center text-xs text-green-500 mt-2">
              <ArrowUp className="h-3 w-3 mr-1" />
              +12.5% zum Vormonat
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Aktive Restaurants</CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">127</div>
            <div className="flex items-center text-xs text-green-500 mt-2">
              <ArrowUp className="h-3 w-3 mr-1" />
              +8 diese Woche
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Gesamtbestellungen</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">15,842</div>
            <div className="flex items-center text-xs text-green-500 mt-2">
              <ArrowUp className="h-3 w-3 mr-1" />
              +23% diese Woche
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Neue User</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">342</div>
            <div className="flex items-center text-xs text-red-500 mt-2">
              <ArrowDown className="h-3 w-3 mr-1" />
              -5% diese Woche
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Umsatzentwicklung
            </CardTitle>
            <CardDescription className="text-gray-400">
              Letzte 12 Monate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>[Chart würde hier angezeigt werden]</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Umsatz nach Plan
            </CardTitle>
            <CardDescription className="text-gray-400">
              Verteilung der Abo-Pläne
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Premium</span>
                </div>
                <span className="text-white font-medium">45%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-300">Standard</span>
                </div>
                <span className="text-white font-medium">35%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-300">Trial</span>
                </div>
                <span className="text-white font-medium">20%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Top Performance Restaurants</CardTitle>
          <CardDescription className="text-gray-400">
            Nach Bestellvolumen diesen Monat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Pizza Roma', orders: 1245, revenue: '€15,680' },
              { name: 'Burger Palace', orders: 987, revenue: '€12,340' },
              { name: 'Bella Italia', orders: 876, revenue: '€10,950' },
              { name: 'Sushi Bar', orders: 654, revenue: '€9,810' },
              { name: 'Döner King', orders: 543, revenue: '€6,516' }
            ].map((restaurant, index) => (
              <div key={restaurant.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-white">{restaurant.name}</p>
                    <p className="text-sm text-gray-400">{restaurant.orders} Bestellungen</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">{restaurant.revenue}</p>
                  <div className="flex items-center text-xs text-green-500">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{Math.floor(Math.random() * 30 + 10)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}