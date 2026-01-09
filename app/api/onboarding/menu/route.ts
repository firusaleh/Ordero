import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const menuSetupSchema = z.object({
  categories: z.array(z.object({
    name: z.string(),
    icon: z.string().optional(),
    color: z.string().optional(),
  })),
  menuItems: z.array(z.object({
    name: z.string(),
    price: z.string(),
    categoryIndex: z.number(),
  })).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const validatedData = menuSetupSchema.parse(body)
    
    // Finde das Restaurant des Users
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        ownerId: session.user.id
      }
    })
    
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }
    
    // Erstelle Kategorien und Items in einer Transaktion
    const result = await prisma.$transaction(async (tx) => {
      // Erstelle Kategorien
      const createdCategories = await Promise.all(
        validatedData.categories.map((category, index) =>
          tx.category.create({
            data: {
              restaurantId: restaurant.id,
              name: category.name,
              icon: category.icon,
              color: category.color,
              sortOrder: index,
              isActive: true,
            }
          })
        )
      )
      
      // Erstelle Menu Items wenn vorhanden
      if (validatedData.menuItems && validatedData.menuItems.length > 0) {
        await Promise.all(
          validatedData.menuItems.map((item) => {
            const category = createdCategories[item.categoryIndex]
            if (category) {
              return tx.menuItem.create({
                data: {
                  restaurantId: restaurant.id,
                  categoryId: category.id,
                  name: item.name,
                  price: parseFloat(item.price),
                  isActive: true,
                  isAvailable: true,
                  allergens: [],
                  additives: [],
                  tags: [],
                }
              })
            }
            return null
          }).filter(Boolean)
        )
      }
      
      return createdCategories
    })
    
    return NextResponse.json({
      success: true,
      data: {
        categoriesCreated: result.length,
        message: 'Speisekarte erfolgreich erstellt'
      }
    })
    
  } catch (error) {
    console.error('Menu setup error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: (error as any).errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}