"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  TrendingUp,
  TrendingDown,
  Euro,
  ShoppingCart,
  Users,
  Clock,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

export default function StatsPage() {
  const [timeRange, setTimeRange] = useState('7days')

  const stats = {
    revenue: {
      total: '12.450',
      change: 12.5,
      trend: 'up'
    },
    orders: {
      total: '342',
      change: 8.2,
      trend: 'up'
    },
    avgOrder: {
      total: '36,40',
      change: -2.1,
      trend: 'down'
    },
    customers: {
      total: '289',
      change: 15.3,
      trend: 'up'
    }
  }

  const topDishes = [
    { name: 'Pizza Margherita', orders: 89, revenue: '801 €' },
    { name: 'Spaghetti Carbonara', orders: 76, revenue: '912 €' },
    { name: 'Caesar Salat', orders: 65, revenue: '520 €' },
    { name: 'Burger Classic', orders: 58, revenue: '754 €' },
    { name: 'Tiramisu', orders: 52, revenue: '364 €' }
  ]

  const hourlyData = [
    { hour: '11:00', orders: 5 },
    { hour: '12:00', orders: 18 },
    { hour: '13:00', orders: 25 },
    { hour: '14:00', orders: 15 },
    { hour: '15:00', orders: 8 },
    { hour: '16:00', orders: 6 },
    { hour: '17:00', orders: 10 },
    { hour: '18:00', orders: 22 },
    { hour: '19:00', orders: 35 },
    { hour: '20:00', orders: 38 },
    { hour: '21:00', orders: 28 },
    { hour: '22:00', orders: 12 }
  ]

  const categoryRevenue = [
    { category: 'Vorspeisen', revenue: '1.250 €', percentage: 10 },
    { category: 'Hauptgerichte', revenue: '6.890 €', percentage: 55 },
    { category: 'Desserts', revenue: '1.560 €', percentage: 13 },
    { category: 'Getränke', revenue: '2.750 €', percentage: 22 }
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Statistiken</h1>
          <p className="text-gray-600">Analysieren Sie Ihre Geschäftsdaten</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Heute</SelectItem>
              <SelectItem value="yesterday">Gestern</SelectItem>
              <SelectItem value="7days">Letzte 7 Tage</SelectItem>
              <SelectItem value="30days">Letzte 30 Tage</SelectItem>
              <SelectItem value="90days">Letzte 90 Tage</SelectItem>
              <SelectItem value="custom">Benutzerdefiniert</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
            <Euro className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.revenue.total} €</div>
            <div className="flex items-center mt-1">
              {stats.revenue.trend === 'up' ? (
                <>
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-500">+{stats.revenue.change}%</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-xs text-red-500">{stats.revenue.change}%</span>
                </>
              )}
              <span className="text-xs text-gray-500 ml-1">vs. Vorperiode</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bestellungen</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders.total}</div>
            <div className="flex items-center mt-1">
              <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+{stats.orders.change}%</span>
              <span className="text-xs text-gray-500 ml-1">vs. Vorperiode</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ø Bestellwert</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgOrder.total} €</div>
            <div className="flex items-center mt-1">
              <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-xs text-red-500">{stats.avgOrder.change}%</span>
              <span className="text-xs text-gray-500 ml-1">vs. Vorperiode</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kunden</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customers.total}</div>
            <div className="flex items-center mt-1">
              <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+{stats.customers.change}%</span>
              <span className="text-xs text-gray-500 ml-1">vs. Vorperiode</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="products">Produkte</TabsTrigger>
          <TabsTrigger value="time">Zeitverlauf</TabsTrigger>
          <TabsTrigger value="categories">Kategorien</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Bestellungen nach Stunden</CardTitle>
                <CardDescription>Verteilung der Bestellungen über den Tag</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {hourlyData.map((data) => (
                    <div key={data.hour} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{data.hour}</span>
                      <div className="flex items-center gap-2 flex-1 ml-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(data.orders / 38) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{data.orders}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Umsatzaufteilung</CardTitle>
                <CardDescription>Umsatz nach Kategorien</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryRevenue.map((cat) => (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{cat.category}</span>
                        <span className="font-medium">{cat.revenue}</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">{cat.percentage}% des Gesamtumsatzes</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Produkte</CardTitle>
              <CardDescription>Meistverkaufte Gerichte im ausgewählten Zeitraum</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topDishes.map((dish, index) => (
                  <div key={dish.name} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{dish.name}</p>
                        <p className="text-sm text-gray-500">{dish.orders} Bestellungen</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{dish.revenue}</p>
                      <p className="text-sm text-gray-500">Umsatz</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Umsatzentwicklung</CardTitle>
              <CardDescription>Täglicher Umsatz der letzten 7 Tage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, index) => {
                  const height = Math.random() * 100 + 20
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-gray-600">{day}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Beliebteste Kategorien</CardTitle>
                <CardDescription>Nach Anzahl der Bestellungen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Hauptgerichte</span>
                    <Badge>185 Bestellungen</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Getränke</span>
                    <Badge>142 Bestellungen</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Vorspeisen</span>
                    <Badge>89 Bestellungen</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Desserts</span>
                    <Badge>76 Bestellungen</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Durchschnittswerte</CardTitle>
                <CardDescription>Pro Kategorie</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Hauptgerichte</span>
                    <span className="font-medium">18,50 €</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Vorspeisen</span>
                    <span className="font-medium">8,90 €</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Desserts</span>
                    <span className="font-medium">7,20 €</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Getränke</span>
                    <span className="font-medium">4,50 €</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}