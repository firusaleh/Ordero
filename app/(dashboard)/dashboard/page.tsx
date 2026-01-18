import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import DashboardContent from '@/components/dashboard/dashboard-content'

async function getDashboardData(userId: string) {
  // Hole das Restaurant des Users
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      OR: [
        { ownerId: userId },
        { staff: { some: { userId } } }
      ]
    },
    include: {
      settings: true,
      _count: {
        select: {
          orders: true,
          menuItems: true,
          tables: true,
          categories: true,
        }
      }
    }
  })

  if (!restaurant) {
    return null
  }

  // Hole heutige Statistiken
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayOrders = await prisma.order.findMany({
    where: {
      restaurantId: restaurant.id,
      createdAt: { gte: today }
    },
    include: {
      items: true
    }
  })

  // Berechne Statistiken
  const stats = {
    todayRevenue: todayOrders.reduce((sum, order) => sum + Number(order.total), 0),
    todayOrders: todayOrders.length,
    pendingOrders: todayOrders.filter(o => o.status === 'PENDING').length,
    averageOrderValue: todayOrders.length > 0 
      ? todayOrders.reduce((sum, order) => sum + Number(order.total), 0) / todayOrders.length
      : 0
  }

  return { restaurant, stats, recentOrders: todayOrders.slice(0, 5) }
}

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const data = await getDashboardData(session.user.id)

  if (!data) {
    // User hat noch kein Restaurant - zum Onboarding
    redirect('/onboarding')
  }

  const { restaurant, stats, recentOrders } = data

  // Berechne verbleibende Trial-Tage
  const trialDaysLeft = restaurant.trialEndsAt 
    ? Math.max(0, Math.ceil((restaurant.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  // Check Setup-Status
  const setupChecks = {
    hasBasicInfo: Boolean(restaurant.name && restaurant.description && restaurant.phone),
    hasAddress: Boolean(restaurant.street && restaurant.city && restaurant.postalCode),
    hasCategories: restaurant._count.categories > 0,
    hasMenuItems: restaurant._count.menuItems >= 5,
    hasTables: restaurant._count.tables > 0,
    hasPaymentMethods: Boolean(restaurant.settings?.acceptCash || restaurant.settings?.acceptCard)
  }

  const setupComplete = Object.values(setupChecks).every(check => check === true)
  const setupProgress = Math.round((Object.values(setupChecks).filter(Boolean).length / Object.keys(setupChecks).length) * 100)

  return (
    <DashboardContent
      restaurant={restaurant}
      stats={stats}
      recentOrders={recentOrders}
      setupChecks={setupChecks}
      setupComplete={setupComplete}
      setupProgress={setupProgress}
      trialDaysLeft={trialDaysLeft}
      userName={session.user.name || null}
      userEmail={session.user.email}
    />
  )
}