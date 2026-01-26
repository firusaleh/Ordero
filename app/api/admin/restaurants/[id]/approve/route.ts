import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendApprovalEmail } from '@/lib/email-service'

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
    
    // Update Restaurant Status
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        approvedAt: new Date(),
        approvedById: session.user.id,
        // Set trial period (30 days from approval)
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    })
    
    // Sende E-Mail an Restaurant-Besitzer
    try {
      await sendApprovalEmail({
        to: restaurant.owner.email,
        restaurantName: restaurant.name,
        ownerName: restaurant.owner.name || restaurant.owner.email
      })
    } catch (emailError) {
      console.error('Fehler beim Senden der Freigabe-E-Mail:', emailError)
      // Fortsetzung, da Restaurant bereits freigegeben wurde
    }
    
    return NextResponse.json({ 
      success: true,
      restaurant: updatedRestaurant
    })
  } catch (error) {
    console.error('Fehler bei Restaurant-Freigabe:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Freigabe' },
      { status: 500 }
    )
  }
}