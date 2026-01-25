'use client'

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
import { useLanguage } from '@/contexts/language-context'
import { formatPrice } from '@/lib/utils/currency'
import type { Currency } from '@/lib/utils/currency'

interface DashboardContentProps {
  restaurant: any
  stats: any
  recentOrders: any[]
  setupChecks: any
  setupComplete: boolean
  setupProgress: number
  trialDaysLeft: number
  userName: string | null
  userEmail: string
}

export default function DashboardContent({
  restaurant,
  stats,
  recentOrders,
  setupChecks,
  setupComplete,
  setupProgress,
  trialDaysLeft,
  userName,
  userEmail
}: DashboardContentProps) {
  const { t } = useLanguage()
  const currency: Currency = restaurant?.settings?.currency || restaurant?.currency || 'EUR'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{restaurant.name}</h1>
        <p className="text-gray-600">{t('dashboard.welcome')}, {userName || userEmail}</p>
      </div>

      {/* Setup Banner - Wichtigster Banner */}
      {!setupComplete && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 rtl:gap-x-reverse">
                <Rocket className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-900">{t('dashboard.setupIncomplete')}</CardTitle>
              </div>
              <Badge variant="outline" className="border-yellow-600 text-yellow-700">
                {setupProgress}% {t('dashboard.completed')}
              </Badge>
            </div>
            <CardDescription className="text-yellow-700">
              {t('dashboard.setupDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!setupChecks.hasBasicInfo && (
                <p className="text-sm text-yellow-700">• {t('dashboard.missingBasicInfo')}</p>
              )}
              {!setupChecks.hasAddress && (
                <p className="text-sm text-yellow-700">• {t('dashboard.missingAddress')}</p>
              )}
              {!setupChecks.hasCategories && (
                <p className="text-sm text-yellow-700">• {t('dashboard.missingCategories')}</p>
              )}
              {!setupChecks.hasMenuItems && (
                <p className="text-sm text-yellow-700">• {t('dashboard.missingMenuItems')}</p>
              )}
              {!setupChecks.hasTables && (
                <p className="text-sm text-yellow-700">• {t('dashboard.missingTables')}</p>
              )}
              {!setupChecks.hasPaymentMethods && (
                <p className="text-sm text-yellow-700">• {t('dashboard.missingPaymentMethods')}</p>
              )}
            </div>
            <div className="mt-4">
              <Button asChild className="bg-yellow-600 hover:bg-yellow-700 text-white">
                <Link href="/dashboard/setup">
                  <Rocket className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
                  {t('dashboard.continueSetup')}
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
              <div className="flex items-center gap-2 rtl:gap-x-reverse">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900">{t('dashboard.trialVersion')}</CardTitle>
              </div>
              <Badge variant="secondary">
                {trialDaysLeft} {t('dashboard.daysRemaining')}
              </Badge>
            </div>
            <CardDescription className="text-blue-700">
              {t('dashboard.trialDescription').replace('{{days}}', trialDaysLeft.toString())}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/billing">
                {t('dashboard.upgradeNow')} <ArrowRight className="ml-2 h-4 w-4 rtl:ml-0 rtl:mr-2 rtl:rotate-180" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.todayRevenue')}</CardTitle>
            <Euro className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.todayRevenue, currency)}</div>
            <p className="text-xs text-gray-500">
              <TrendingUp className="inline h-3 w-3 text-green-500 mr-1 rtl:mr-0 rtl:ml-1" />
              +12% {t('dashboard.fromYesterday')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.ordersToday')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayOrders}</div>
            <p className="text-xs text-gray-500">
              {stats.pendingOrders > 0 && (
                <span className="text-orange-500">
                  {stats.pendingOrders} {t('dashboard.pending')}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.averageOrderValue')}</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.averageOrderValue, currency)}</div>
            <p className="text-xs text-gray-500">{t('dashboard.today')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.activeTables')}</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{restaurant._count.tables}</div>
            <p className="text-xs text-gray-500">{t('dashboard.qrCodesGenerated')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-24 justify-start" asChild>
          <Link href="/dashboard/orders">
            <div className="flex flex-col items-start">
              <ShoppingCart className="h-5 w-5 mb-2" />
              <span className="font-medium">{t('nav.orders')}</span>
              <span className="text-xs text-gray-500">{t('dashboard.manage')}</span>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-24 justify-start" asChild>
          <Link href="/dashboard/menu">
            <div className="flex flex-col items-start">
              <ChefHat className="h-5 w-5 mb-2" />
              <span className="font-medium">{t('nav.menu')}</span>
              <span className="text-xs text-gray-500">{restaurant._count.menuItems} {t('dashboard.items')}</span>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-24 justify-start" asChild>
          <Link href="/dashboard/tables">
            <div className="flex flex-col items-start">
              <QrCode className="h-5 w-5 mb-2" />
              <span className="font-medium">{t('dashboard.qrCodes')}</span>
              <span className="text-xs text-gray-500">{restaurant._count.tables} {t('dashboard.tables')}</span>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-24 justify-start" asChild>
          <Link href="/dashboard/stats">
            <div className="flex flex-col items-start">
              <TrendingUp className="h-5 w-5 mb-2" />
              <span className="font-medium">{t('nav.statistics')}</span>
              <span className="text-xs text-gray-500">{t('dashboard.view')}</span>
            </div>
          </Link>
        </Button>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('dashboard.recentOrders')}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/orders">
                {t('dashboard.viewAll')} <ArrowRight className="ml-2 h-4 w-4 rtl:ml-0 rtl:mr-2 rtl:rotate-180" />
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
                    <p className="font-medium">{t('dashboard.order')} #{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">
                      {order.table?.number || order.tableNumber ? 
                        `${t('dashboard.table')} ${order.table?.number || order.tableNumber}` : 
                        order.type === 'TAKEAWAY' ? t('dashboard.takeaway') : 
                        order.type === 'DELIVERY' ? t('dashboard.delivery') :
                        t('dashboard.order')}
                      {' • '}
                      <Clock className="inline h-3 w-3" />
                      {' '}
                      {new Date(order.createdAt).toLocaleTimeString('de-DE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 rtl:gap-x-reverse">
                    <Badge variant={
                      order.status === 'PENDING' ? 'secondary' :
                      order.status === 'CONFIRMED' ? 'default' :
                      order.status === 'READY' ? 'outline' :
                      'secondary'
                    }>
                      {t(`dashboard.orderStatus.${order.status.toLowerCase()}`)}
                    </Badge>
                    <span className="font-medium">{formatPrice(Number(order.total), currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              {t('dashboard.noOrdersToday')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}