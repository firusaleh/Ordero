import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import RestaurantFinanceDetailView from '@/components/admin/restaurant-finance-detail-view'

interface RestaurantFinanceDetailProps {
  params: Promise<{
    restaurantId: string
  }>
}

async function getRestaurantFinanceData(restaurantId: string) {
  const session = await auth()
  
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/login')
  }

  // Get current date info for different periods
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  // Get restaurant with detailed order information
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      owner: {
        select: {
          email: true,
          name: true
        }
      },
      orders: {
        where: {
          createdAt: {
            gte: startOfYear, // Get orders from start of year
            lte: endOfMonth
          }
        },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          createdAt: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          items: {
            select: {
              id: true,
              quantity: true,
              menuItem: {
                select: {
                  name: true,
                  price: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!restaurant) {
    notFound()
  }

  // Filter orders by different periods (nur bestätigte/bezahlte)
  const thisMonthOrders = restaurant.orders.filter(order => {
    const orderDate = new Date(order.createdAt)
    return orderDate >= startOfMonth && orderDate <= endOfMonth &&
           (['CONFIRMED', 'READY', 'DELIVERED', 'COMPLETED'].includes(order.status) || order.paymentStatus === 'PAID')
  })

  const lastMonthOrders = restaurant.orders.filter(order => {
    const orderDate = new Date(order.createdAt)
    return orderDate >= startOfLastMonth && orderDate <= endOfLastMonth &&
           (['CONFIRMED', 'READY', 'DELIVERED', 'COMPLETED'].includes(order.status) || order.paymentStatus === 'PAID')
  })

  const allValidOrders = restaurant.orders.filter(order => 
    ['CONFIRMED', 'READY', 'DELIVERED', 'COMPLETED'].includes(order.status) || order.paymentStatus === 'PAID'
  )

  // Calculate payment method breakdown for this month
  const cashOrders = thisMonthOrders.filter(order => order.paymentMethod === 'CASH')
  const onlineOrders = thisMonthOrders.filter(order => order.paymentMethod !== 'CASH')

  // Calculate statistics
  const totalCashRevenue = cashOrders.reduce((sum, order) => sum + (order.total || 0), 0)
  const totalOnlineRevenue = onlineOrders.reduce((sum, order) => sum + (order.total || 0), 0)
  const totalThisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0)
  const totalLastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0)

  // Determine billing rate
  let orderRate = 0
  let currency = 'EUR'
  
  if (restaurant.country === 'JO') {
    currency = 'JOD'
    // TRIAL und PAY_PER_ORDER Pläne zahlen pro Bestellung
    if (restaurant.plan?.includes('PAY_PER_ORDER') || restaurant.plan === 'TRIAL') {
      orderRate = 0.10
    }
  } else if (restaurant.country === 'DE') {
    currency = 'EUR'
    // TRIAL und PAY_PER_ORDER Pläne zahlen pro Bestellung
    if (restaurant.plan?.includes('PAY_PER_ORDER') || restaurant.plan === 'TRIAL') {
      orderRate = 0.45
    }
  }

  const totalFeesThisMonth = thisMonthOrders.length * orderRate
  const totalFeesLastMonth = lastMonthOrders.length * orderRate

  // Group orders by month for trend analysis
  const ordersByMonth = allValidOrders.reduce((acc, order) => {
    const month = new Date(order.createdAt).toISOString().slice(0, 7) // YYYY-MM
    if (!acc[month]) {
      acc[month] = []
    }
    acc[month].push(order)
    return acc
  }, {} as Record<string, typeof allValidOrders>)

  // Calculate monthly statistics
  const monthlyStats = Object.entries(ordersByMonth).map(([month, orders]) => ({
    month,
    orderCount: orders.length,
    revenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
    fees: orders.length * orderRate,
    cashOrders: orders.filter(order => order.paymentMethod === 'CASH').length,
    onlineOrders: orders.filter(order => order.paymentMethod !== 'CASH').length
  })).sort((a, b) => b.month.localeCompare(a.month))

  return {
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      owner: restaurant.owner,
      country: restaurant.country,
      plan: restaurant.plan || 'FREE',
      status: restaurant.status,
      orderRate,
      currency,
      billingEnabled: restaurant.billingEnabled,
      payPerOrderEnabled: restaurant.payPerOrderEnabled,
      lastBillingDate: restaurant.lastBillingDate
    },
    currentPeriod: {
      start: startOfMonth,
      end: endOfMonth
    },
    thisMonth: {
      orderCount: thisMonthOrders.length,
      revenue: totalThisMonthRevenue,
      fees: totalFeesThisMonth,
      cashOrders: cashOrders.length,
      onlineOrders: onlineOrders.length,
      cashRevenue: totalCashRevenue,
      onlineRevenue: totalOnlineRevenue,
      orders: thisMonthOrders
    },
    lastMonth: {
      orderCount: lastMonthOrders.length,
      revenue: totalLastMonthRevenue,
      fees: totalFeesLastMonth
    },
    monthlyStats,
    allOrders: allValidOrders.slice(0, 50) // Limit for performance
  }
}

export default async function RestaurantFinanceDetailPage({ params }: RestaurantFinanceDetailProps) {
  const { restaurantId } = await params
  const financeData = await getRestaurantFinanceData(restaurantId)
  
  return <RestaurantFinanceDetailView data={financeData} />
}