import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ restaurantSlug: string }> }
) {
  try {
    const { restaurantSlug } = await params
    const restaurant = await prisma.restaurant.findUnique({
      where: { 
        slug: restaurantSlug,
        status: 'ACTIVE'
      },
      include: {
        settings: true,
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            menuItems: {
              where: { 
                isActive: true,
                isAvailable: true 
              },
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        primaryColor: restaurant.primaryColor,
        categories: restaurant.categories,
        settings: restaurant.settings
      }
    })
  } catch (error) {
    console.error('Error fetching menu:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}