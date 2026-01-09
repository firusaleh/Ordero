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
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    const categories = await prisma.category.findMany({
      where: { restaurantId: restaurant.id },
      include: {
        menuItems: true
      },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ data: categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, description, icon, color, isActive } = body

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Ermittle nächste sortOrder
    const lastCategory = await prisma.category.findFirst({
      where: { restaurantId: restaurant.id },
      orderBy: { sortOrder: 'desc' }
    })

    const category = await prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name,
        description,
        icon,
        color,
        isActive: isActive ?? true,
        sortOrder: lastCategory ? lastCategory.sortOrder + 1 : 0
      }
    })

    return NextResponse.json({ data: category })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}