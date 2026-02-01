import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminFinanceView from '@/components/admin/finance-view'

async function getFinanceData() {
  const session = await auth()
  
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/login')
  }

  // Get current date info for billing period
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  // Get all restaurants with their billing information
  const restaurants = await prisma.restaurant.findMany({
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
            gte: startOfMonth,
            lte: endOfMonth
          },
          // Nur abgeschlossene/bezahlte Bestellungen zählen (CONFIRMED, READY, DELIVERED, COMPLETED)
          AND: [
            {
              OR: [
                { status: { in: ['CONFIRMED', 'READY', 'DELIVERED', 'COMPLETED'] } },
                { paymentStatus: 'PAID' }
              ]
            }
          ]
        },
        select: {
          id: true,
          total: true,
          createdAt: true,
          paymentMethod: true,
          status: true,
          paymentStatus: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Calculate billing for each restaurant
  const billingData = restaurants.map(restaurant => {
    // Determine the billing rate based on country and plan
    let orderRate = 0
    let currency = 'EUR'
    
    if (restaurant.country === 'JO') {
      currency = 'JOD'
      // TRIAL und PAY_PER_ORDER Pläne zahlen pro Bestellung
      if (restaurant.plan?.includes('PAY_PER_ORDER') || restaurant.plan === 'TRIAL') {
        orderRate = 0.10 // 0.10 JOD per order
      }
    } else if (restaurant.country === 'DE') {
      currency = 'EUR'
      // TRIAL und PAY_PER_ORDER Pläne zahlen pro Bestellung
      if (restaurant.plan?.includes('PAY_PER_ORDER') || restaurant.plan === 'TRIAL') {
        orderRate = 0.45 // 0.45 EUR per order
      }
    }

    // Calculate totals
    const orderCount = restaurant.orders.length
    const totalRevenue = restaurant.orders.reduce((sum, order) => sum + (order.total || 0), 0)
    const totalFees = orderCount * orderRate
    const isPaid = !!(restaurant.lastBillingDate && restaurant.lastBillingDate >= startOfMonth)
    
    return {
      id: restaurant.id,
      name: restaurant.name,
      owner: restaurant.owner,
      country: restaurant.country || 'DE',
      plan: restaurant.plan || 'FREE',
      status: restaurant.status,
      orderCount,
      totalRevenue,
      orderRate,
      totalFees,
      currency,
      isPaid,
      lastBillingDate: restaurant.lastBillingDate,
      billingEnabled: restaurant.billingEnabled,
      payPerOrderEnabled: restaurant.payPerOrderEnabled
    }
  })

  // Get summary statistics
  const totalRestaurants = billingData.length
  const activeRestaurants = billingData.filter(r => r.status === 'ACTIVE').length
  const totalOrdersThisMonth = billingData.reduce((sum, r) => sum + r.orderCount, 0)
  const totalFeesDE = billingData
    .filter(r => r.currency === 'EUR')
    .reduce((sum, r) => sum + r.totalFees, 0)
  const totalFeesJO = billingData
    .filter(r => r.currency === 'JOD')
    .reduce((sum, r) => sum + r.totalFees, 0)
  const paidRestaurants = billingData.filter(r => r.isPaid).length
  const unpaidRestaurants = billingData.filter(r => !r.isPaid && r.totalFees > 0).length

  // Get previous month data for comparison
  const lastMonthOrders = await prisma.order.count({
    where: {
      createdAt: {
        gte: startOfLastMonth,
        lte: endOfLastMonth
      },
      // Alle Bestellungen außer stornierten zählen
      NOT: {
        status: 'CANCELLED'
      }
    }
  })

  const lastMonthRestaurants = await prisma.restaurant.findMany({
    include: {
      orders: {
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          },
          // Nur abgeschlossene/bezahlte Bestellungen zählen (CONFIRMED, READY, DELIVERED, COMPLETED)
          AND: [
            {
              OR: [
                { status: { in: ['CONFIRMED', 'READY', 'DELIVERED', 'COMPLETED'] } },
                { paymentStatus: 'PAID' }
              ]
            }
          ]
        }
      }
    }
  })

  const lastMonthFeesDE = lastMonthRestaurants
    .filter(r => r.country === 'DE' && (r.plan?.includes('PAY_PER_ORDER') || r.plan === 'TRIAL'))
    .reduce((sum, r) => sum + (r.orders.length * 0.45), 0)
  
  const lastMonthFeesJO = lastMonthRestaurants
    .filter(r => r.country === 'JO' && (r.plan?.includes('PAY_PER_ORDER') || r.plan === 'TRIAL'))
    .reduce((sum, r) => sum + (r.orders.length * 0.10), 0)

  return {
    billingPeriod: {
      start: startOfMonth,
      end: endOfMonth
    },
    summary: {
      totalRestaurants,
      activeRestaurants,
      totalOrdersThisMonth,
      totalOrdersLastMonth: lastMonthOrders,
      totalFeesDE,
      totalFeesJO,
      lastMonthFeesDE,
      lastMonthFeesJO,
      paidRestaurants,
      unpaidRestaurants
    },
    restaurants: billingData
  }
}

export default async function AdminFinancePage() {
  const financeData = await getFinanceData()
  
  return <AdminFinanceView data={financeData} />
}