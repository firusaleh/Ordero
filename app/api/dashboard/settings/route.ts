import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Zuerst prüfen ob der User ein Restaurant besitzt
    let restaurant = await prisma.restaurant.findFirst({
      where: {
        ownerId: session.user.id
      },
      include: {
        settings: true
      }
    })

    // Falls nicht Owner, prüfe ob Staff
    if (!restaurant) {
      const staffRelation = await prisma.restaurantStaff.findFirst({
        where: {
          userId: session.user.id
        },
        include: {
          restaurant: {
            include: {
              settings: true
            }
          }
        }
      })

      if (staffRelation) {
        restaurant = staffRelation.restaurant
      }
    }

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug
      },
      settings: restaurant.settings 
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, id, ...data } = body

    // Find restaurant - either as owner or as admin/manager staff
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { ownerId: session.user.id },
          { 
            staff: { 
              some: { 
                userId: session.user.id,
                role: { in: ['ADMIN', 'MANAGER'] }
              } 
            } 
          }
        ]
      },
      include: {
        settings: true
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Handle different update types
    if (type === 'restaurant') {
      // Update restaurant basic info
      const updatedRestaurant = await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: {
          name: data.name,
          description: data.description,
          cuisine: data.cuisine,
          street: data.street,
          city: data.city,
          postalCode: data.postalCode,
          phone: data.phone,
          email: data.email,
          website: data.website
        }
      })
      return NextResponse.json({ data: updatedRestaurant })
    } else if (type === 'settings' || !type) {
      // Update restaurant settings (default to settings if no type specified)
      let settings
      if (restaurant.settings) {
        settings = await prisma.restaurantSettings.update({
          where: { id: restaurant.settings.id },
          data
        })
      } else {
        settings = await prisma.restaurantSettings.create({
          data: {
            restaurantId: restaurant.id,
            ...data
          }
        })
      }
      return NextResponse.json({ data: settings })
    } else {
      return NextResponse.json({ error: 'Invalid update type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}