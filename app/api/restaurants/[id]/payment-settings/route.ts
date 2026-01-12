import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: resolvedParams.id,
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
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden oder kein Zugriff' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      acceptCash: restaurant.settings?.acceptCash ?? true,
      acceptCard: restaurant.settings?.acceptCard ?? false,
      acceptPaypal: restaurant.settings?.acceptPaypal ?? false,
      acceptStripe: restaurant.settings?.acceptStripe ?? false,
      taxRate: restaurant.settings?.taxRate || 19,
      includeTax: restaurant.settings?.includeTax ?? true,
      currency: restaurant.settings?.currency || 'EUR'
    })
    
  } catch (error) {
    console.error('Get payment settings error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Zahlungseinstellungen' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      acceptCash,
      acceptCard,
      acceptPaypal,
      acceptStripe,
      taxRate,
      includeTax,
      currency
    } = body

    // Überprüfe ob der Benutzer Zugriff auf dieses Restaurant hat
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: resolvedParams.id,
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id, role: { in: ['ADMIN', 'MANAGER'] } } } }
        ]
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden oder keine Berechtigung' },
        { status: 404 }
      )
    }

    // Aktualisiere Zahlungseinstellungen
    await prisma.restaurantSettings.upsert({
      where: { id: resolvedParams.id },
      update: {
        acceptCash,
        acceptCard,
        acceptPaypal,
        acceptStripe,
        taxRate,
        includeTax,
        currency
      },
      create: {
        id: resolvedParams.id,
        restaurantId: resolvedParams.id,
        acceptCash,
        acceptCard,
        acceptPaypal,
        acceptStripe,
        taxRate,
        includeTax,
        currency
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Zahlungseinstellungen erfolgreich gespeichert'
    })
    
  } catch (error) {
    console.error('Save payment settings error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Zahlungseinstellungen' },
      { status: 500 }
    )
  }
}