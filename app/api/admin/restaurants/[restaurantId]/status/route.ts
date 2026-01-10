import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    // Überprüfe Admin-Berechtigung
    const session = await auth()
    
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const { status } = await request.json()
    
    // Validiere Status
    const validStatuses = ['PENDING', 'ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Ungültiger Status' },
        { status: 400 }
      )
    }
    
    // Update Restaurant Status
    const restaurant = await prisma.restaurant.update({
      where: { id: resolvedParams.restaurantId },
      data: { 
        status,
        // Wenn aktiviert wird, aktiviere auch das Ordering
        ...(status === 'ACTIVE' && {
          settings: {
            update: {
              orderingEnabled: true
            }
          }
        })
      },
      include: {
        settings: true
      }
    })

    // Wenn Status auf ACTIVE gesetzt wird und noch kein Trial-Ende existiert,
    // setze es auf 14 Tage in der Zukunft
    if (status === 'ACTIVE' && !restaurant.trialEndsAt) {
      await prisma.restaurant.update({
        where: { id: resolvedParams.restaurantId },
        data: {
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      message: `Status erfolgreich auf ${status} geändert`,
      data: restaurant
    })
    
  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Status' },
      { status: 500 }
    )
  }
}