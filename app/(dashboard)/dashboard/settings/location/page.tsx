import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { RestaurantLocationSettings } from '@/components/dashboard/restaurant-location-settings'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getSelectedRestaurant } from '@/app/actions/restaurants'

export default async function LocationSettingsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  // Restaurant für den aktuellen User finden
  let restaurant = await getSelectedRestaurant()

  // Falls nicht Owner, prüfe ob Staff
  if (!restaurant) {
    const staffRelation = await prisma.restaurantStaff.findFirst({
      where: {
        userId: session.user.id
      },
      include: {
        restaurant: true
      }
    })

    if (staffRelation) {
      restaurant = staffRelation.restaurant
    }
  }

  if (!restaurant) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Kein Restaurant gefunden</p>
          <Link href="/dashboard/settings" className="mt-4 inline-block">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zu Einstellungen
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Einstellungen
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Standort & Region</h1>
        <p className="text-gray-600 mt-2">
          Ihr Standort bestimmt automatisch, welcher Zahlungsanbieter verwendet wird.
          Deutsche Restaurants nutzen Stripe, Restaurants im Nahen Osten nutzen PayTabs.
        </p>
      </div>

      <RestaurantLocationSettings restaurantId={restaurant.id} />
    </div>
  )
}