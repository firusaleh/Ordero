import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ClientPreOrderPage from './client-page'

interface PreOrderPageProps {
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

export default async function PreOrderPage({ params }: PreOrderPageProps) {
  const { restaurantSlug } = await params
  const restaurant = await getRestaurant(restaurantSlug)

  if (!restaurant) {
    notFound()
  }

  return <ClientPreOrderPage restaurant={restaurant} restaurantSlug={restaurantSlug} />
}