import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// GET - Fetch all reservations for a restaurant
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

    // Fetch reservations with related data
    const reservations = await prisma.reservation.findMany({
      where: { restaurantId },
      include: {
        table: {
          select: {
            id: true,
            number: true,
            seats: true
          }
        }
      },
      orderBy: [
        { reservationDate: 'asc' },
        { reservationTime: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      reservations
    })

  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}