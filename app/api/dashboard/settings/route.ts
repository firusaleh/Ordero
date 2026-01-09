import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        settings: true
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    return NextResponse.json({ data: restaurant.settings })
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

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        ownerId: session.user.id // Nur Owner kann Einstellungen ändern
      },
      include: {
        settings: true
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let settings

    if (restaurant.settings) {
      // Update existierende Einstellungen
      settings = await prisma.restaurantSettings.update({
        where: { id: restaurant.settings.id },
        data: body
      })
    } else {
      // Erstelle neue Einstellungen
      settings = await prisma.restaurantSettings.create({
        data: {
          restaurantId: restaurant.id,
          ...body
        }
      })
    }

    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}