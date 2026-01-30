import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminDashboardView from '@/components/admin/dashboard-view'

async function getDashboardStats() {
  // Lade echte Daten aus der Datenbank
  const [
    restaurants,
    users,
    orders,
    recentRestaurants,
    recentOrders
  ] = await Promise.all([
    // Alle Restaurants mit Status
    prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        plan: true,
        createdAt: true,
        _count: {
          select: {
            orders: true
          }
        }
      }
    }),
    
    // Alle Users
    prisma.user.count(),
    
    // Alle Bestellungen diesen Monat
    prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      select: {
        total: true,
        status: true,
        paymentStatus: true
      }
    }),
    
    // Letzte 5 Restaurants
    prisma.restaurant.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: true
      }
    }),
    
    // Letzte 10 Bestellungen
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        restaurant: true
      }
    })
  ])

  // Berechne Statistiken
  const totalRestaurants = restaurants.length
  const activeRestaurants = restaurants.filter(r => r.status === 'ACTIVE').length
  const trialRestaurants = restaurants.filter(r => r.status === 'TRIAL' || r.status === 'PENDING').length
  const suspendedRestaurants = restaurants.filter(r => r.status === 'SUSPENDED' || r.status === 'CANCELLED').length
  
  const totalRevenue = orders.reduce((sum, order) => {
    // Include all completed orders (CASH orders may have PENDING payment status)
    if (order.total && (order.status === 'COMPLETED' || order.status === 'READY' || order.status === 'DELIVERED' || order.paymentStatus === 'PAID')) {
      return sum + order.total
    }
    return sum
  }, 0)
  
  const totalOrders = orders.length
  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID').length
  
  // Top 5 Restaurants nach Bestellungen
  const topRestaurants = restaurants
    .map(r => ({
      ...r,
      orderCount: r._count.orders
    }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 5)

  // Letzte Aktivitäten
  const recentActivities: Array<{
    id: string
    type: string
    message: string
    time: Date
    details?: string
  }> = []
  
  // Neue Restaurants
  recentRestaurants.forEach(r => {
    recentActivities.push({
      id: `rest-${r.id}`,
      type: 'restaurant_created',
      message: `Neues Restaurant "${r.name}" registriert`,
      time: r.createdAt,
      details: `Besitzer: ${r.owner.email}`
    })
  })
  
  // Neue Bestellungen
  recentOrders.forEach(o => {
    if (o.status === 'PENDING') {
      recentActivities.push({
        id: `order-${o.id}`,
        type: 'new_order',
        message: `Neue Bestellung bei ${o.restaurant.name}`,
        time: o.createdAt,
        details: `Betrag: €${o.total?.toFixed(2) || '0.00'}`
      })
    }
  })
  
  // Sortiere nach Zeit
  recentActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  return {
    stats: {
      totalRestaurants,
      activeRestaurants,
      trialRestaurants,
      suspendedRestaurants,
      totalUsers: users,
      totalRevenue,
      totalOrders,
      paidOrders
    },
    topRestaurants,
    recentActivities: recentActivities.slice(0, 10),
    restaurants
  }
}

export default async function AdminDashboardPage() {
  const session = await auth()
  
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/login')
  }

  const dashboardData = await getDashboardStats()

  return <AdminDashboardView {...dashboardData} />
}