'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function getUserRestaurants() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return []
  }

  const restaurants = await prisma.restaurant.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { staff: { some: { userId: session.user.id } } }
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true
    }
  })

  return restaurants
}

export async function switchRestaurant(restaurantId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('Nicht autorisiert')
  }

  // Überprüfe ob der User Zugriff auf das Restaurant hat
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      id: restaurantId,
      OR: [
        { ownerId: session.user.id },
        { staff: { some: { userId: session.user.id } } }
      ]
    }
  })

  if (!restaurant) {
    throw new Error('Kein Zugriff auf dieses Restaurant')
  }

  // Speichere das ausgewählte Restaurant in einem Cookie
  const cookieStore = await cookies()
  cookieStore.set('selectedRestaurantId', restaurantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30 // 30 Tage
  })

  revalidatePath('/dashboard')
  return restaurant
}

export async function getSelectedRestaurant() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }

  const cookieStore = await cookies()
  const selectedRestaurantId = cookieStore.get('selectedRestaurantId')?.value

  let restaurant

  if (selectedRestaurantId) {
    // Versuche das ausgewählte Restaurant zu holen
    restaurant = await prisma.restaurant.findFirst({
      where: {
        id: selectedRestaurantId,
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
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
  }

  // Falls kein ausgewähltes Restaurant oder kein Zugriff, hole das erste verfügbare
  if (!restaurant) {
    restaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
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
  }

  return restaurant
}