import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  ShoppingCart, 
  Euro, 
  Users, 
  TrendingUp,
  Clock,
  Package,
  ChefHat,
  QrCode,
  ArrowRight,
  AlertCircle,
  Rocket
} from 'lucide-react'

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{restaurant.name}</h1>
        <p className="text-gray-600">Willkommen zurück, {session.user.name || session.user.email}</p>
      </div>

      {/* Setup Banner - Wichtigster Banner */}
      {!setupComplete && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-900">Restaurant-Einrichtung unvollständig</CardTitle>
              </div>
              <Badge variant="outline" className="border-yellow-600 text-yellow-700">
                {setupProgress}% abgeschlossen
              </Badge>
            </div>
            <CardDescription className="text-yellow-700">
              Vervollständigen Sie die Einrichtung, damit Kunden bei Ihnen bestellen können.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!setupChecks.hasBasicInfo && (
                <p className="text-sm text-yellow-700">• Grunddaten und Beschreibung fehlen</p>
              )}
              {!setupChecks.hasAddress && (
                <p className="text-sm text-yellow-700">• Adresse unvollständig</p>
              )}
              {!setupChecks.hasCategories && (
                <p className="text-sm text-yellow-700">• Keine Speisekarten-Kategorien angelegt</p>
              )}
              {!setupChecks.hasMenuItems && (
                <p className="text-sm text-yellow-700">• Weniger als 5 Artikel in der Speisekarte</p>
              )}
              {!setupChecks.hasTables && (
                <p className="text-sm text-yellow-700">• Keine Tische/QR-Codes angelegt</p>
              )}
              {!setupChecks.hasPaymentMethods && (
                <p className="text-sm text-yellow-700">• Zahlungsmethoden nicht konfiguriert</p>
              )}
            </div>
            <div className="mt-4">
              <Button asChild className="bg-yellow-600 hover:bg-yellow-700 text-white">
                <Link href="/dashboard/setup">
                  <Rocket className="mr-2 h-4 w-4" />
                  Einrichtung fortsetzen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trial Banner */}
      {restaurant.plan === 'TRIAL' && trialDaysLeft > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900">Testversion</CardTitle>
              </div>
              <Badge variant="secondary">{trialDaysLeft} Tage verbleibend</Badge>
            </div>
            <CardDescription className="text-blue-700">
              Ihre kostenlose Testversion endet in {trialDaysLeft} Tagen. 
              Upgraden Sie jetzt, um alle Features weiter zu nutzen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/billing">
                Jetzt upgraden <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heutiger Umsatz</CardTitle>
            <Euro className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-500">
              <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
              +12% zum Vortag
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bestellungen heute</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayOrders}</div>
            <p className="text-xs text-gray-500">
              {stats.pendingOrders > 0 && (
                <span className="text-orange-500">{stats.pendingOrders} ausstehend</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durchschn. Bestellwert</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Heute</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Tische</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{restaurant._count.tables}</div>
            <p className="text-xs text-gray-500">QR-Codes generiert</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-24 justify-start" asChild>
          <Link href="/dashboard/orders">
            <div className="flex flex-col items-start">
              <ShoppingCart className="h-5 w-5 mb-2" />
              <span className="font-medium">Bestellungen</span>
              <span className="text-xs text-gray-500">Verwalten</span>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-24 justify-start" asChild>
          <Link href="/dashboard/menu">
            <div className="flex flex-col items-start">
              <ChefHat className="h-5 w-5 mb-2" />
              <span className="font-medium">Speisekarte</span>
              <span className="text-xs text-gray-500">{restaurant._count.menuItems} Artikel</span>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-24 justify-start" asChild>
          <Link href="/dashboard/tables">
            <div className="flex flex-col items-start">
              <QrCode className="h-5 w-5 mb-2" />
              <span className="font-medium">QR-Codes</span>
              <span className="text-xs text-gray-500">{restaurant._count.tables} Tische</span>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-24 justify-start" asChild>
          <Link href="/dashboard/stats">
            <div className="flex flex-col items-start">
              <TrendingUp className="h-5 w-5 mb-2" />
              <span className="font-medium">Statistiken</span>
              <span className="text-xs text-gray-500">Ansehen</span>
            </div>
          </Link>
        </Button>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Letzte Bestellungen</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/orders">
                Alle anzeigen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Bestellung #{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">
                      {order.tableId ? `Tisch ${order.tableId}` : 'Zum Mitnehmen'}
                      {' • '}
                      <Clock className="inline h-3 w-3" />
                      {' '}
                      {new Date(order.createdAt).toLocaleTimeString('de-DE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={
                      order.status === 'PENDING' ? 'secondary' :
                      order.status === 'CONFIRMED' ? 'default' :
                      order.status === 'READY' ? 'outline' :
                      'secondary'
                    }>
                      {order.status}
                    </Badge>
                    <span className="font-medium">€{Number(order.total).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              Noch keine Bestellungen heute
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}