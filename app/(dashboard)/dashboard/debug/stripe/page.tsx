import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AlertCircle, CheckCircle, XCircle, ArrowRight } from 'lucide-react'

async function getRestaurantStripeStatus(userId: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      OR: [
        { ownerId: userId },
        { staff: { some: { userId } } }
      ]
    },
    include: {
      _count: {
        select: {
          orders: true
        }
      },
      orders: {
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
          total: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  })

  return restaurant
}

export default async function StripeDebugPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const restaurant = await getRestaurantStripeStatus(session.user.id)

  if (!restaurant) {
    redirect('/onboarding')
  }

  const hasStripeAccount = Boolean(restaurant.stripeAccountId)
  const isOnboardingComplete = Boolean(restaurant.stripeOnboardingCompleted)
  const isFullySetup = hasStripeAccount && isOnboardingComplete

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stripe Connect Debug Info</h1>
        <p className="text-gray-600">Überprüfen Sie den Status Ihrer Stripe Connect Einrichtung</p>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Information</CardTitle>
          <CardDescription>Aktuelle Einstellungen für {restaurant.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Restaurant ID</p>
              <p className="font-mono text-xs">{restaurant.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Slug</p>
              <p className="font-medium">{restaurant.slug}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Land</p>
              <p className="font-medium">{restaurant.country}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Anzahl Bestellungen</p>
              <p className="font-medium">{restaurant._count.orders}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Status */}
      <Card className={!isFullySetup ? 'border-red-500' : 'border-green-500'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isFullySetup ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Stripe Connect Status: Aktiv
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                Stripe Connect Status: Probleme erkannt
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Stripe Account ID</span>
              {hasStripeAccount ? (
                <Badge variant="outline" className="font-mono text-xs">
                  {restaurant.stripeAccountId}
                </Badge>
              ) : (
                <Badge variant="destructive">Nicht vorhanden</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Onboarding abgeschlossen</span>
              <Badge variant={isOnboardingComplete ? 'default' : 'destructive'}>
                {isOnboardingComplete ? 'Ja' : 'Nein'}
              </Badge>
            </div>
          </div>

          {!isFullySetup && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>WICHTIG:</strong> Ihr Stripe Connect ist nicht vollständig eingerichtet!
                <br />
                <br />
                <strong>Auswirkungen:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Alle Zahlungen gehen direkt an das Oriido Hauptkonto</li>
                  <li>Keine automatische Auszahlung an Ihr Restaurant</li>
                  <li>Manuelle Überweisung durch Oriido erforderlich</li>
                  <li>0.45 EUR Plattformgebühr pro Bestellung kann nicht automatisch abgezogen werden</li>
                </ul>
                <br />
                <strong>Lösung:</strong>
                <br />
                Gehen Sie zu den Zahlungseinstellungen und richten Sie Stripe Connect neu ein.
              </AlertDescription>
            </Alert>
          )}

          <div className="pt-4">
            <Link href="/dashboard/settings/payments">
              <Button className="w-full">
                {isFullySetup ? 'Zahlungseinstellungen anzeigen' : 'Stripe Connect einrichten'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      {restaurant.orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Letzte Bestellungen</CardTitle>
            <CardDescription>Die letzten 5 Bestellungen in Ihrem Restaurant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {restaurant.orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString('de-DE')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      {order.status}
                    </Badge>
                    <p className="text-sm">
                      €{order.total.toFixed(2)} • {order.paymentMethod}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>Technische Details zur Fehlerbehebung</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{JSON.stringify({
  restaurantId: restaurant.id,
  slug: restaurant.slug,
  country: restaurant.country,
  stripeAccountId: restaurant.stripeAccountId,
  stripeOnboardingCompleted: restaurant.stripeOnboardingCompleted,
  orderCount: restaurant._count.orders,
  paymentFlowStatus: isFullySetup ? 'SPLIT_PAYMENT' : 'DIRECT_FALLBACK',
  expectedBehavior: isFullySetup 
    ? 'Bestellbetrag minus 0.45 EUR an Restaurant, 0.45 EUR Plattformgebühr' 
    : '100% an Oriido (manueller Transfer erforderlich)'
}, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}