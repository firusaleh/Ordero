import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }
    
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const timeRange = searchParams.get('range') || '7days'
    
    // Prüfe Berechtigung
    if (session.user.role !== 'SUPER_ADMIN') {
      const hasAccess = await prisma.restaurant.findFirst({
        where: {
          id: id,
          OR: [
            { ownerId: session.user.id },
            { staff: { some: { userId: session.user.id } } }
          ]
        }
      })
      
      if (!hasAccess) {
        return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
      }
    }
    
    // Berechne Zeitraum
    const now = new Date()
    let startDate = new Date()
    let previousStartDate = new Date()
    
    switch (timeRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        previousStartDate.setDate(previousStartDate.getDate() - 1)
        previousStartDate.setHours(0, 0, 0, 0)
        break
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1)
        startDate.setHours(0, 0, 0, 0)
        previousStartDate.setDate(previousStartDate.getDate() - 2)
        previousStartDate.setHours(0, 0, 0, 0)
        break
      case '7days':
        startDate.setDate(startDate.getDate() - 7)
        previousStartDate.setDate(previousStartDate.getDate() - 14)
        break
      case '30days':
        startDate.setDate(startDate.getDate() - 30)
        previousStartDate.setDate(previousStartDate.getDate() - 60)
        break
      case '90days':
        startDate.setDate(startDate.getDate() - 90)
        previousStartDate.setDate(previousStartDate.getDate() - 180)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
        previousStartDate.setDate(previousStartDate.getDate() - 14)
    }
    
    // Hole aktuelle Periode Daten
    const currentOrders = await prisma.order.findMany({
      where: {
        restaurantId: id,
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                category: true
              }
            }
          }
        }
      }
    })
    
    // Hole vorherige Periode Daten für Vergleich
    const previousOrders = await prisma.order.findMany({
      where: {
        restaurantId: id,
        createdAt: {
          gte: previousStartDate,
          lt: startDate
        }
      }
    })
    
    // Berechne Statistiken
    const currentRevenue = currentOrders.reduce((sum, order) => sum + order.total, 0)
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0)
    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) 
      : 0
    
    const currentOrderCount = currentOrders.length
    const previousOrderCount = previousOrders.length
    const orderChange = previousOrderCount > 0 
      ? ((currentOrderCount - previousOrderCount) / previousOrderCount * 100).toFixed(1)
      : 0
    
    const avgOrderValue = currentOrderCount > 0 
      ? (currentRevenue / currentOrderCount).toFixed(2)
      : '0'
    const previousAvgOrderValue = previousOrderCount > 0 
      ? (previousRevenue / previousOrderCount)
      : 0
    const avgOrderChange = previousAvgOrderValue > 0 
      ? (((parseFloat(avgOrderValue) - previousAvgOrderValue) / previousAvgOrderValue) * 100).toFixed(1)
      : 0
    
    // Unique Customers (basierend auf E-Mail oder Telefon)
    const uniqueCustomers = new Set(
      currentOrders
        .filter(o => o.guestEmail || o.guestPhone)
        .map(o => o.guestEmail || o.guestPhone)
    ).size
    
    const previousUniqueCustomers = new Set(
      previousOrders
        .filter(o => o.guestEmail || o.guestPhone)
        .map(o => o.guestEmail || o.guestPhone)
    ).size
    
    const customerChange = previousUniqueCustomers > 0
      ? ((uniqueCustomers - previousUniqueCustomers) / previousUniqueCustomers * 100).toFixed(1)
      : 0
    
    // Top Gerichte
    const dishCount: { [key: string]: { count: number, revenue: number, name: string } } = {}
    currentOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.menuItem.id
        if (!dishCount[key]) {
          dishCount[key] = { 
            count: 0, 
            revenue: 0, 
            name: item.menuItem.name 
          }
        }
        dishCount[key].count += item.quantity
        dishCount[key].revenue += item.totalPrice
      })
    })
    
    const topDishes = Object.entries(dishCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([_, data]) => ({
        name: data.name,
        orders: data.count,
        revenue: data.revenue.toFixed(2)
      }))
    
    // Bestellungen nach Stunde
    const hourlyData: { [hour: string]: number } = {}
    for (let i = 0; i < 24; i++) {
      hourlyData[`${i.toString().padStart(2, '0')}:00`] = 0
    }
    
    currentOrders.forEach(order => {
      const hour = new Date(order.createdAt).getHours()
      const key = `${hour.toString().padStart(2, '0')}:00`
      hourlyData[key] = (hourlyData[key] || 0) + 1
    })
    
    const hourlyDataArray = Object.entries(hourlyData)
      .filter(([_, count]) => count > 0)
      .map(([hour, count]) => ({
        hour,
        orders: count
      }))
    
    // Umsatz nach Kategorie
    const categoryRevenue: { [key: string]: number } = {}
    currentOrders.forEach(order => {
      order.items.forEach(item => {
        const categoryName = item.menuItem.category?.name || 'Andere'
        categoryRevenue[categoryName] = (categoryRevenue[categoryName] || 0) + item.totalPrice
      })
    })
    
    const totalCategoryRevenue = Object.values(categoryRevenue).reduce((sum, rev) => sum + rev, 0)
    const categoryRevenueArray = Object.entries(categoryRevenue)
      .sort((a, b) => b[1] - a[1])
      .map(([category, revenue]) => ({
        category,
        revenue: revenue.toFixed(2),
        percentage: totalCategoryRevenue > 0 
          ? Math.round(revenue / totalCategoryRevenue * 100) 
          : 0
      }))
    
    // Täglicher Umsatz (letzte 7 Tage)
    const dailyRevenue: { [key: string]: number } = {}
    const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayIndex = date.getDay()
      const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]
      dailyRevenue[dayName] = 0
    }
    
    currentOrders.forEach(order => {
      if (timeRange === '7days' || timeRange === 'today' || timeRange === 'yesterday') {
        const orderDate = new Date(order.createdAt)
        const dayIndex = orderDate.getDay()
        const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]
        dailyRevenue[dayName] = (dailyRevenue[dayName] || 0) + order.total
      }
    })
    
    return NextResponse.json({
      stats: {
        revenue: {
          total: currentRevenue.toFixed(2),
          change: parseFloat(revenueChange as any),
          trend: parseFloat(revenueChange as any) >= 0 ? 'up' : 'down'
        },
        orders: {
          total: currentOrderCount.toString(),
          change: parseFloat(orderChange as any),
          trend: parseFloat(orderChange as any) >= 0 ? 'up' : 'down'
        },
        avgOrder: {
          total: avgOrderValue,
          change: parseFloat(avgOrderChange as any),
          trend: parseFloat(avgOrderChange as any) >= 0 ? 'up' : 'down'
        },
        customers: {
          total: uniqueCustomers.toString(),
          change: parseFloat(customerChange as any),
          trend: parseFloat(customerChange as any) >= 0 ? 'up' : 'down'
        }
      },
      topDishes,
      hourlyData: hourlyDataArray,
      categoryRevenue: categoryRevenueArray,
      dailyRevenue
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Statistiken:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Statistiken' },
      { status: 500 }
    )
  }
}