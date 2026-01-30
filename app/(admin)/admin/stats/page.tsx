import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
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
  ArrowDown,
  DollarSign
} from 'lucide-react'

async function getAdminStats() {
  const session = await auth()
  
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/login')
  }

  // Get current date info
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - 7)

  // Get restaurants count
  const [totalRestaurants, activeRestaurants, newRestaurantsThisWeek] = await Promise.all([
    prisma.restaurant.count(),
    prisma.restaurant.count({
      where: { status: 'ACTIVE' }
    }),
    prisma.restaurant.count({
      where: {
        createdAt: { gte: startOfWeek }
      }
    })
  ])

  // Get orders statistics
  const [totalOrdersThisMonth, totalOrdersLastMonth, totalOrdersThisWeek] = await Promise.all([
    prisma.order.count({
      where: {
        createdAt: { gte: startOfMonth }
      }
    }),
    prisma.order.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: startOfWeek }
      }
    })
  ])

  // Get revenue (sum of all orders including CASH)
  const [revenueThisMonth, revenueLastMonth] = await Promise.all([
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfMonth },
        OR: [
          { status: { in: ['COMPLETED', 'READY', 'DELIVERED'] } },
          { paymentStatus: 'PAID' }
        ]
      },
      _sum: {
        total: true
      }
    }),
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        },
        OR: [
          { status: { in: ['COMPLETED', 'READY', 'DELIVERED'] } },
          { paymentStatus: 'PAID' }
        ]
      },
      _sum: {
        total: true
      }
    })
  ])

  const monthlyRevenue = revenueThisMonth._sum.total || 0
  const lastMonthRevenue = revenueLastMonth._sum.total || 0
  const revenueGrowth = lastMonthRevenue > 0 
    ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : 0

  // Get new users count
  const [totalUsersThisWeek, totalUsersLastWeek] = await Promise.all([
    prisma.user.count({
      where: {
        createdAt: { gte: startOfWeek }
      }
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          lt: startOfWeek
        }
      }
    })
  ])

  const userGrowth = totalUsersLastWeek > 0
    ? ((totalUsersThisWeek - totalUsersLastWeek) / totalUsersLastWeek * 100).toFixed(1)
    : 0

  // Get top performing restaurants
  const topRestaurants = await prisma.restaurant.findMany({
    take: 5,
    include: {
      _count: {
        select: { orders: true }
      },
      orders: {
        where: {
          createdAt: { gte: startOfMonth },
          OR: [
            { status: { in: ['COMPLETED', 'READY', 'DELIVERED'] } },
            { paymentStatus: 'PAID' }
          ]
        },
        select: {
          total: true
        }
      }
    },
    orderBy: {
      orders: {
        _count: 'desc'
      }
    }
  })

  const topPerformers = topRestaurants.map(restaurant => ({
    name: restaurant.name,
    orders: restaurant._count.orders,
    revenue: restaurant.orders.reduce((sum, order) => sum + (order.total || 0), 0)
  }))

  // Get subscription plan distribution (use plan field as it's the main field)
  const planDistribution = await prisma.restaurant.groupBy({
    by: ['plan'],
    _count: true
  })

  return {
    totalRestaurants,
    activeRestaurants,
    newRestaurantsThisWeek,
    totalOrdersThisMonth,
    totalOrdersThisWeek,
    orderGrowth: totalOrdersLastMonth > 0
      ? ((totalOrdersThisMonth - totalOrdersLastMonth) / totalOrdersLastMonth * 100).toFixed(1)
      : 0,
    monthlyRevenue,
    revenueGrowth,
    totalUsersThisWeek,
    userGrowth,
    topPerformers,
    planDistribution
  }
}

export default async function AdminStatsPage() {
  const stats = await getAdminStats()
  
  // Format currency based on most common currency in system
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Statistiken</h1>
        <p className="text-gray-400 mt-1">Echtzeit Plattform-Analytics</p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Monatsumsatz</CardTitle>
            <Euro className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(stats.monthlyRevenue)}</div>
            <div className={`flex items-center text-xs mt-2 ${Number(stats.revenueGrowth) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Number(stats.revenueGrowth) >= 0 ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(Number(stats.revenueGrowth))}% zum Vormonat
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Aktive Restaurants</CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeRestaurants}</div>
            <div className="flex items-center text-xs text-green-500 mt-2">
              <ArrowUp className="h-3 w-3 mr-1" />
              +{stats.newRestaurantsThisWeek} diese Woche
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Bestellungen (Monat)</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalOrdersThisMonth.toLocaleString('de-DE')}</div>
            <div className={`flex items-center text-xs mt-2 ${Number(stats.orderGrowth) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Number(stats.orderGrowth) >= 0 ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(Number(stats.orderGrowth))}% zum Vormonat
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Neue User</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsersThisWeek}</div>
            <div className={`flex items-center text-xs mt-2 ${Number(stats.userGrowth) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Number(stats.userGrowth) >= 0 ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(Number(stats.userGrowth))}% zur Vorwoche
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
              Restaurant-Übersicht
            </CardTitle>
            <CardDescription className="text-gray-400">
              Verteilung nach Status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Gesamt Restaurants</span>
                <span className="text-white font-medium">{stats.totalRestaurants}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Aktiv</span>
                <span className="text-green-500 font-medium">{stats.activeRestaurants}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">In Testphase</span>
                <span className="text-yellow-500 font-medium">
                  {stats.totalRestaurants - stats.activeRestaurants}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Abo-Plan Verteilung
            </CardTitle>
            <CardDescription className="text-gray-400">
              Verteilung der Abo-Pläne
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.planDistribution.map(plan => {
                const planName = plan.plan || 'FREE'
                const percentage = ((plan._count / stats.totalRestaurants) * 100).toFixed(1)
                
                const planConfig: Record<string, { color: string; label: string }> = {
                  'FREE': { color: 'bg-gray-500', label: 'Free' },
                  'TRIAL': { color: 'bg-yellow-500', label: 'Trial' },
                  'STANDARD': { color: 'bg-blue-500', label: 'Standard' },
                  'PREMIUM': { color: 'bg-green-500', label: 'Premium' },
                  // German Plans (with underscores - as stored in DB)
                  'DE_PAY_PER_ORDER': { color: 'bg-emerald-500', label: 'DE Pay per Order' },
                  'DE_MONTHLY': { color: 'bg-indigo-500', label: 'DE Flatrate Monatlich' },
                  'DE_YEARLY': { color: 'bg-purple-500', label: 'DE Flatrate Jährlich' },
                  // Jordan Plans (with underscores - as stored in DB)
                  'JO_PAY_PER_ORDER': { color: 'bg-orange-500', label: 'JO Pay per Order' },
                  'JO_MONTHLY': { color: 'bg-pink-500', label: 'JO Flatrate Monthly' },
                  'JO_YEARLY': { color: 'bg-rose-500', label: 'JO Flatrate Yearly' },
                  // Alternative naming (with hyphens)
                  'PAY_PER_ORDER_DE': { color: 'bg-emerald-500', label: 'DE Pay per Order' },
                  'FLATRATE_MONTHLY_DE': { color: 'bg-indigo-500', label: 'DE Flatrate Monatlich' },
                  'FLATRATE_YEARLY_DE': { color: 'bg-purple-500', label: 'DE Flatrate Jährlich' },
                  'PAY_PER_ORDER_JO': { color: 'bg-orange-500', label: 'JO Pay per Order' },
                  'FLATRATE_MONTHLY_JO': { color: 'bg-pink-500', label: 'JO Flatrate Monthly' },
                  'FLATRATE_YEARLY_JO': { color: 'bg-rose-500', label: 'JO Flatrate Yearly' }
                }
                
                const config = planConfig[planName] || { color: 'bg-gray-500', label: planName }
                
                return (
                  <div key={planName} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 ${config.color} rounded-full`}></div>
                      <span className="text-gray-300">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{plan._count}</span>
                      <span className="text-gray-400 text-sm">({percentage}%)</span>
                    </div>
                  </div>
                )
              })}
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
            {stats.topPerformers.length > 0 ? (
              stats.topPerformers.map((restaurant, index) => (
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
                    <p className="font-medium text-white">{formatCurrency(restaurant.revenue)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">Noch keine Daten verfügbar</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}