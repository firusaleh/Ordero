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
import { useLanguage } from '@/contexts/language-context'

export default function StatsTranslated() {
  const { language, t } = useLanguage()
  const [timeRange, setTimeRange] = useState('7days')

  // Diese Daten sollten aus der Datenbank kommen
  const stats = {
    revenue: {
      total: '0',
      change: 0,
      trend: 'up' as const
    },
    orders: {
      total: '0',
      change: 0,
      trend: 'up' as const
    },
    avgOrder: {
      total: '0',
      change: 0,
      trend: 'down' as const
    },
    customers: {
      total: '0',
      change: 0,
      trend: 'up' as const
    }
  }

  // Diese Daten sollten aus der Datenbank kommen
  const topDishes: Array<{ name: string; orders: number; revenue: string }> = []

  // Diese Daten sollten aus der Datenbank kommen
  const hourlyData: Array<{ hour: string; orders: number }> = []

  // Diese Daten sollten aus der Datenbank kommen
  const categoryRevenue: Array<{ category: string; revenue: string; percentage: number }> = []

  return (
    <div className={`p-6 space-y-6 ${language === 'ar' ? 'rtl:space-x-reverse' : ''}`}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('statistics.title')}</h1>
          <p className="text-gray-600">{t('statistics.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t('statistics.today')}</SelectItem>
              <SelectItem value="yesterday">{t('statistics.yesterday')}</SelectItem>
              <SelectItem value="7days">{t('statistics.last7days')}</SelectItem>
              <SelectItem value="30days">{t('statistics.last30days')}</SelectItem>
              <SelectItem value="90days">{t('statistics.last90days')}</SelectItem>
              <SelectItem value="custom">{t('statistics.custom')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            {t('statistics.export')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statistics.totalRevenue')}</CardTitle>
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
              <span className="text-xs text-gray-500 ml-1">{t('statistics.vsPreviousPeriod')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statistics.orders')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders.total}</div>
            <div className="flex items-center mt-1">
              <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+{stats.orders.change}%</span>
              <span className="text-xs text-gray-500 ml-1">{t('statistics.vsPreviousPeriod')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statistics.avgOrderValue')}</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgOrder.total} €</div>
            <div className="flex items-center mt-1">
              <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-xs text-red-500">{stats.avgOrder.change}%</span>
              <span className="text-xs text-gray-500 ml-1">{t('statistics.vsPreviousPeriod')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statistics.customers')}</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customers.total}</div>
            <div className="flex items-center mt-1">
              <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+{stats.customers.change}%</span>
              <span className="text-xs text-gray-500 ml-1">{t('statistics.vsPreviousPeriod')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('statistics.overview')}</TabsTrigger>
          <TabsTrigger value="products">{t('statistics.products')}</TabsTrigger>
          <TabsTrigger value="time">{t('statistics.timeline')}</TabsTrigger>
          <TabsTrigger value="categories">{t('statistics.categories')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('statistics.ordersByHour')}</CardTitle>
                <CardDescription>{t('statistics.orderDistribution')}</CardDescription>
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
                <CardTitle>{t('statistics.revenueBreakdown')}</CardTitle>
                <CardDescription>{t('statistics.revenueByCategory')}</CardDescription>
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
                      <div className="text-xs text-gray-500">{cat.percentage}% {t('statistics.totalRevenueDays')}</div>
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
              <CardTitle>{t('statistics.topProducts')}</CardTitle>
              <CardDescription>{t('statistics.bestSellingDishes')}</CardDescription>
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
                        <p className="text-sm text-gray-500">{dish.orders} {t('statistics.orders')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{dish.revenue}</p>
                      <p className="text-sm text-gray-500">{t('statistics.revenue')}</p>
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
              <CardTitle>{t('statistics.revenueGrowth')}</CardTitle>
              <CardDescription>{t('statistics.dailyRevenueLast7Days')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {[
                  t('statistics.monday'),
                  t('statistics.tuesday'),
                  t('statistics.wednesday'),
                  t('statistics.thursday'),
                  t('statistics.friday'),
                  t('statistics.saturday'),
                  t('statistics.sunday')
                ].map((day, index) => {
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
                <CardTitle>{t('statistics.popularCategories')}</CardTitle>
                <CardDescription>{t('statistics.byOrderCount')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>{t('statistics.mainCourses')}</span>
                    <Badge>185 {t('statistics.orders')}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('statistics.drinks')}</span>
                    <Badge>142 {t('statistics.orders')}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('statistics.appetizers')}</span>
                    <Badge>89 {t('statistics.orders')}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('statistics.desserts')}</span>
                    <Badge>76 {t('statistics.orders')}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('statistics.averageValues')}</CardTitle>
                <CardDescription>{t('statistics.perCategory')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center text-gray-500 py-4">
                    <p>{t('statistics.noData')}</p>
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