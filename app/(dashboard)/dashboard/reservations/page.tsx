import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ReservationsManager } from '@/components/dashboard/reservations-manager'
import { getSelectedRestaurant } from '@/app/actions/restaurants'

async function getReservationsData(userId: string) {
  const restaurant = await getSelectedRestaurant()

  if (!restaurant) {
    return null
  }

  // Hole Reservierungen für heute und die nächsten 30 Tage
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 30)
  endDate.setHours(23, 59, 59, 999)

  const reservations = await prisma.reservation.findMany({
    where: {
      restaurantId: restaurant.id,
      reservationDate: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      table: true,
      preOrder: {
        include: {
          items: true
        }
      }
    },
    orderBy: [
      { reservationDate: 'asc' },
      { reservationTime: 'asc' }
    ]
  })

  const preOrders = await prisma.preOrder.findMany({
    where: {
      restaurantId: restaurant.id,
      pickupTime: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      items: {
        include: {
          menuItem: true
        }
      }
    },
    orderBy: { pickupTime: 'asc' }
  })

  return { restaurant, reservations, preOrders }
}

export default async function ReservationsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const data = await getReservationsData(session.user.id)

  if (!data) {
    redirect('/onboarding')
  }

  return <ReservationsManager 
    restaurantId={data.restaurant.id}
  />
}