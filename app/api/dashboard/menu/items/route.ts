import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { 
      categoryId, 
      name, 
      description, 
      price, 
      image,
      allergens,
      tags,
      variants,
      extras,
      isActive,
      isAvailable,
      isDailySpecial,
      isFeatured,
      specialPrice
    } = body

    // Verifiziere Kategorie-Zugriff
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        restaurant: {
          include: {
            staff: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const hasAccess = category.restaurant.ownerId === session.user.id ||
      category.restaurant.staff.some(s => s.userId === session.user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Ermittle nächste sortOrder
    const lastItem = await prisma.menuItem.findFirst({
      where: { categoryId },
      orderBy: { sortOrder: 'desc' }
    })

    const menuItem = await prisma.menuItem.create({
      data: {
        restaurantId: category.restaurant.id,
        categoryId,
        name,
        description,
        price,
        image,
        allergens: allergens || [],
        tags: tags || [],
        isActive: isActive ?? true,
        isAvailable: isAvailable ?? true,
        isDailySpecial: isDailySpecial ?? false,
        isFeatured: isFeatured ?? false,
        specialPrice: specialPrice || null,
        sortOrder: lastItem ? lastItem.sortOrder + 1 : 0
      }
    })

    return NextResponse.json({ data: menuItem })
  } catch (error) {
    console.error('Error creating menu item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}