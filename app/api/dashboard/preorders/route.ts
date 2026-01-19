import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET - Fetch all preorders for a restaurant
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      )
    }

    // Verify user owns the restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { 
        id: restaurantId,
        ownerId: session.user.id 
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch preorders with related data
    const preorders = await prisma.preOrder.findMany({
      where: { restaurantId },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: [
        { pickupTime: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      preorders
    })

  } catch (error) {
    console.error('Error fetching preorders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}