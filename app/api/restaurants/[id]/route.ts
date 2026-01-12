import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { 
        id 
      },
      include: {
        owner: true,
        settings: true,
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            menuItems: {
              where: { isAvailable: true },
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

    // Check authorization - Skip check for admins
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      if (session.user.role === 'RESTAURANT_OWNER' || session.user.role === 'RESTAURANT_STAFF') {
        // Check if user has access to this restaurant
        const hasAccess = await prisma.restaurant.findFirst({
          where: {
            id,
            OR: [
              { ownerId: session.user.id },
              { staff: { some: { id: session.user.id } } }
            ]
          }
        })

        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Keine Berechtigung für dieses Restaurant' },
            { status: 403 }
          )
        }
      }
    }

    return NextResponse.json(restaurant)
  } catch (error: any) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Restaurants' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

    // Check authorization - Skip check for admins
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      if (session.user.role === 'RESTAURANT_OWNER' || session.user.role === 'RESTAURANT_STAFF') {
        const hasAccess = await prisma.restaurant.findFirst({
          where: {
            id,
            OR: [
              { ownerId: session.user.id },
              { staff: { some: { id: session.user.id } } }
            ]
          }
        })

        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Keine Berechtigung für dieses Restaurant' },
            { status: 403 }
          )
        }
      }
    }

    // Update restaurant - nur die übergebenen Felder updaten
    const updateData: any = {}
    
    // Nur Felder hinzufügen, die tatsächlich gesendet wurden
    if (body.name !== undefined) updateData.name = body.name
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.street !== undefined) updateData.street = body.street
    if (body.city !== undefined) updateData.city = body.city
    if (body.postalCode !== undefined) updateData.postalCode = body.postalCode
    if (body.country !== undefined) updateData.country = body.country
    if (body.description !== undefined) updateData.description = body.description
    if (body.logo !== undefined) updateData.logo = body.logo
    if (body.banner !== undefined) updateData.banner = body.banner
    
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
      include: {
        settings: true
      }
    })

    // Update settings if provided
    if (body.settings) {
      await prisma.restaurantSettings.update({
        where: { restaurantId: id },
        data: body.settings
      })
    }

    return NextResponse.json({
      success: true,
      restaurant: updatedRestaurant
    })
  } catch (error: any) {
    console.error('Error updating restaurant:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Restaurants' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const session = await auth()
    
    // Only SUPER_ADMIN can delete restaurants
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        owner: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

    // Delete restaurant (will cascade delete related data)
    await prisma.restaurant.delete({
      where: { id }
    })

    // If owner has no other restaurants, optionally delete the owner account
    const otherRestaurants = await prisma.restaurant.count({
      where: { ownerId: restaurant.owner.id }
    })

    if (otherRestaurants === 0 && restaurant.owner.role === 'RESTAURANT_OWNER') {
      // Optional: Delete the owner account if they have no other restaurants
      // await prisma.user.delete({ where: { id: restaurant.owner.id } })
    }

    return NextResponse.json({
      success: true,
      message: 'Restaurant erfolgreich gelöscht'
    })
  } catch (error: any) {
    console.error('Error deleting restaurant:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Restaurants' },
      { status: 500 }
    )
  }
}