import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/auth'
import { prisma } from '@/lib/prisma'

// GET - Get a single category
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, categoryId } = await params

    // Check if user has access to this restaurant
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Fetch category
    const category = await prisma.category.findUnique({
      where: { 
        id: categoryId,
        restaurantId: id
      },
      include: {
        menuItems: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a specific category
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, categoryId } = await params
    const body = await request.json()

    // Check if user has access to this restaurant
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Update category
    const category = await prisma.category.update({
      where: { 
        id: categoryId,
        restaurantId: id
      },
      data: {
        name: body.name,
        description: body.description,
        icon: body.icon,
        color: body.color,
        image: body.image,
        sortOrder: body.sortOrder,
        isActive: body.isActive
      }
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a specific category
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, categoryId } = await params

    // Check if user has access to this restaurant
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Check if category has menu items
    const category = await prisma.category.findUnique({
      where: { 
        id: categoryId,
        restaurantId: id
      },
      include: {
        _count: {
          select: { menuItems: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (category._count.menuItems > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with menu items. Please delete or move items first.' 
      }, { status: 400 })
    }

    // Delete category
    await prisma.category.delete({
      where: { 
        id: categoryId,
        restaurantId: id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}