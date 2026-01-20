import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ClientReservePage from './client-page'

interface ReservePageProps {
  params: Promise<{ restaurantSlug: string }>
}

async function getRestaurant(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      description: true,
      logo: true,
      banner: true,
      primaryColor: true,
      phone: true,
      email: true,
      street: true,
      city: true,
      postalCode: true,
      settings: {
        select: {
          language: true,
          currency: true
        }
      }
    }
  })

  return restaurant
}

export default async function ReservePage({ params }: ReservePageProps) {
  const { restaurantSlug } = await params
  const restaurant = await getRestaurant(restaurantSlug)

  if (!restaurant) {
    notFound()
  }

  return <ClientReservePage restaurant={restaurant} restaurantSlug={restaurantSlug} />
}