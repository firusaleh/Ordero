"use client"

import { useState, useEffect } from 'react'
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
  ArrowDown,
  Loader2
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'
import { toast } from 'sonner'

interface StatsClientProps {
  restaurantId: string
}

interface Stats {
  revenue: {
    total: string
    change: number
    trend: 'up' | 'down'
  }
  orders: {
    total: string
    change: number
    trend: 'up' | 'down'
  }
  avgOrder: {
    total: string
    change: number
    trend: 'up' | 'down'
  }
  customers: {
    total: string
    change: number
    trend: 'up' | 'down'
  }
}

interface StatsData {
  stats: Stats
  topDishes: Array<{ name: string; orders: number; revenue: string }>
  hourlyData: Array<{ hour: string; orders: number }>
  categoryRevenue: Array<{ category: string; revenue: string; percentage: number }>
  dailyRevenue: { [key: string]: number }
}

export default function StatsClient({ restaurantId }: StatsClientProps) {
  const { language, t } = useLanguage()
  const { formatPrice } = useRestaurantCurrency()
  const [timeRange, setTimeRange] = useState('7days')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<StatsData | null>(null)
  
  useEffect(() => {
    fetchStats()
  }, [timeRange, restaurantId])
  
  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/stats?range=${timeRange}`)
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const statsData = await response.json()
      setData(statsData)
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error(t('statistics.errorLoading') || 'Fehler beim Laden der Statistiken')
    } finally {
      setLoading(false)
    }
  }
  
  const exportData = () => {
    if (!data) return
    
    const csv = [
      ['Metrik', 'Wert', 'Änderung'],
      ['Umsatz', data.stats.revenue.total, `${data.stats.revenue.change}%`],
      ['Bestellungen', data.stats.orders.total, `${data.stats.orders.change}%`],
      ['Durchschnittlicher Bestellwert', data.stats.avgOrder.total, `${data.stats.avgOrder.change}%`],
      ['Kunden', data.stats.customers.total, `${data.stats.customers.change}%`],
      [],
      ['Top Gerichte'],
      ['Name', 'Bestellungen', 'Umsatz'],
      ...data.topDishes.map(dish => [dish.name, dish.orders.toString(), dish.revenue])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `statistiken-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }
  
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">{t('statistics.noData') || 'Keine Daten verfügbar'}</p>
      </div>
    )
  }

  const { stats, topDishes, hourlyData, categoryRevenue, dailyRevenue } = data
  const maxHourlyOrders = Math.max(...hourlyData.map(d => d.orders), 1)

  return (
    <div className={`p-6 space-y-6 ${language === 'ar' ? 'rtl:space-x-reverse' : ''}`}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('statistics.title') || 'Statistiken'}</h1>
          <p className="text-gray-600">{t('statistics.subtitle') || 'Übersicht über Ihre Restaurant-Performance'}</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t('statistics.today') || 'Heute'}</SelectItem>
              <SelectItem value="yesterday">{t('statistics.yesterday') || 'Gestern'}</SelectItem>
              <SelectItem value="7days">{t('statistics.last7days') || 'Letzte 7 Tage'}</SelectItem>
              <SelectItem value="30days">{t('statistics.last30days') || 'Letzte 30 Tage'}</SelectItem>
              <SelectItem value="90days">{t('statistics.last90days') || 'Letzte 90 Tage'}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            {t('statistics.export') || 'Exportieren'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statistics.totalRevenue') || 'Gesamtumsatz'}</CardTitle>
            <Euro className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(parseFloat(stats.revenue.total))}</div>
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
              <span className="text-xs text-gray-500 ml-1">{t('statistics.vsPreviousPeriod') || 'vs. vorheriger Zeitraum'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statistics.orders') || 'Bestellungen'}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders.total}</div>
            <div className="flex items-center mt-1">
              {stats.orders.trend === 'up' ? (
                <>
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-500">+{stats.orders.change}%</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-xs text-red-500">{stats.orders.change}%</span>
                </>
              )}
              <span className="text-xs text-gray-500 ml-1">{t('statistics.vsPreviousPeriod') || 'vs. vorheriger Zeitraum'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statistics.avgOrderValue') || 'Ø Bestellwert'}</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(parseFloat(stats.avgOrder.total))}</div>
            <div className="flex items-center mt-1">
              {stats.avgOrder.trend === 'up' ? (
                <>
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-500">+{stats.avgOrder.change}%</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-xs text-red-500">{stats.avgOrder.change}%</span>
                </>
              )}
              <span className="text-xs text-gray-500 ml-1">{t('statistics.vsPreviousPeriod') || 'vs. vorheriger Zeitraum'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statistics.customers') || 'Kunden'}</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customers.total}</div>
            <div className="flex items-center mt-1">
              {stats.customers.trend === 'up' ? (
                <>
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-500">+{stats.customers.change}%</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-xs text-red-500">{stats.customers.change}%</span>
                </>
              )}
              <span className="text-xs text-gray-500 ml-1">{t('statistics.vsPreviousPeriod') || 'vs. vorheriger Zeitraum'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('statistics.overview') || 'Übersicht'}</TabsTrigger>
          <TabsTrigger value="products">{t('statistics.products') || 'Produkte'}</TabsTrigger>
          <TabsTrigger value="time">{t('statistics.timeline') || 'Zeitverlauf'}</TabsTrigger>
          <TabsTrigger value="categories">{t('statistics.categories') || 'Kategorien'}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('statistics.ordersByHour') || 'Bestellungen nach Uhrzeit'}</CardTitle>
                <CardDescription>{t('statistics.orderDistribution') || 'Verteilung über den Tag'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {hourlyData.length > 0 ? hourlyData.map((data) => (
                    <div key={data.hour} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{data.hour}</span>
                      <div className="flex items-center gap-2 flex-1 ml-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(data.orders / maxHourlyOrders) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{data.orders}</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-4">{t('statistics.noData') || 'Keine Daten'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('statistics.revenueBreakdown') || 'Umsatzaufschlüsselung'}</CardTitle>
                <CardDescription>{t('statistics.revenueByCategory') || 'Umsatz nach Kategorie'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryRevenue.length > 0 ? categoryRevenue.map((cat) => (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{cat.category}</span>
                        <span className="font-medium">{formatPrice(parseFloat(cat.revenue))}</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">{cat.percentage}% {t('statistics.totalRevenueDays') || 'des Gesamtumsatzes'}</div>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-4">{t('statistics.noData') || 'Keine Daten'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('statistics.topProducts') || 'Top Produkte'}</CardTitle>
              <CardDescription>{t('statistics.bestSellingDishes') || 'Meistverkaufte Gerichte'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topDishes.length > 0 ? topDishes.map((dish, index) => (
                  <div key={dish.name} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{dish.name}</p>
                        <p className="text-sm text-gray-500">{dish.orders} {t('statistics.orders') || 'Bestellungen'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(parseFloat(dish.revenue))}</p>
                      <p className="text-sm text-gray-500">{t('statistics.revenue') || 'Umsatz'}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-4">{t('statistics.noData') || 'Keine Daten'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('statistics.revenueGrowth') || 'Umsatzentwicklung'}</CardTitle>
              <CardDescription>{t('statistics.dailyRevenueLast7Days') || 'Täglicher Umsatz der letzten 7 Tage'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {Object.entries(dailyRevenue).map(([day, revenue]) => {
                  const maxRevenue = Math.max(...Object.values(dailyRevenue), 1)
                  const height = (revenue / maxRevenue) * 100
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs text-gray-600">{formatPrice(revenue)}</span>
                      <div 
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-gray-600">{t(`statistics.${day.toLowerCase()}`) || day}</span>
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
                <CardTitle>{t('statistics.popularCategories') || 'Beliebte Kategorien'}</CardTitle>
                <CardDescription>{t('statistics.byOrderCount') || 'Nach Bestellanzahl'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryRevenue.length > 0 ? categoryRevenue.slice(0, 5).map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <span>{cat.category}</span>
                      <Badge>{cat.percentage}%</Badge>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-4">{t('statistics.noData') || 'Keine Daten'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('statistics.averageValues') || 'Durchschnittswerte'}</CardTitle>
                <CardDescription>{t('statistics.perCategory') || 'Pro Kategorie'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryRevenue.length > 0 ? categoryRevenue.map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <span className="text-sm">{cat.category}</span>
                      <span className="text-sm font-medium">{formatPrice(parseFloat(cat.revenue))}</span>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-4">{t('statistics.noData') || 'Keine Daten'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}