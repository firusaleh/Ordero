import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendRejectionEmail } from '@/lib/email-service'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }
    
    const { id } = await params
    const body = await req.json()
    const reason = body.reason || 'Keine spezifische Begründung angegeben'
    
    // Hole Restaurant mit Owner-Daten
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        owner: true
      }
    })
    
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant nicht gefunden' }, { status: 404 })
    }
    
    if (restaurant.status !== 'PENDING') {
      return NextResponse.json({ error: 'Restaurant ist nicht im ausstehenden Status' }, { status: 400 })
    }
    
    // Update Restaurant Status zu CANCELLED/REJECTED
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    })
    
    // Sende E-Mail an Restaurant-Besitzer
    try {
      await sendRejectionEmail({
        to: restaurant.owner.email,
        restaurantName: restaurant.name,
        ownerName: restaurant.owner.name || restaurant.owner.email,
        reason
      })
    } catch (emailError) {
      console.error('Fehler beim Senden der Ablehnungs-E-Mail:', emailError)
      // Fortsetzung, da Restaurant bereits abgelehnt wurde
    }
    
    return NextResponse.json({ 
      success: true,
      restaurant: updatedRestaurant
    })
  } catch (error) {
    console.error('Fehler bei Restaurant-Ablehnung:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Ablehnung' },
      { status: 500 }
    )
  }
}