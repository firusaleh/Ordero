import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Restaurant-Daten abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Lade Restaurant mit Settings
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        settings: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob User Zugriff hat
    const isOwner = restaurant.ownerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    
    if (!isOwner && !isAdmin) {
      // Prüfe ob Staff-Mitglied
      const staffMember = await prisma.restaurantStaff.findFirst({
        where: {
          restaurantId: id,
          userId: session.user.id
        }
      })
      
      if (!staffMember) {
        return NextResponse.json(
          { error: 'Keine Berechtigung' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      ...restaurant,
      settings: restaurant.settings || {}
    })

  } catch (error) {
    console.error('GET restaurant error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// PATCH - Restaurant aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    
    console.log('PATCH Restaurant request:', {
      id,
      body: JSON.stringify(body, null, 2)
    })

    // Prüfe ob Restaurant existiert
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: { 
        id: true, 
        ownerId: true 
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe Berechtigung
    const isOwner = restaurant.ownerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    // Aktualisiere Restaurant
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.country && { country: body.country }),
        ...(body.city && { city: body.city }),
        ...(body.street && { street: body.street }),
        ...(body.postalCode && { postalCode: body.postalCode }),
        ...(body.phone && { phone: body.phone }),
        ...(body.email && { email: body.email }),
        ...(body.website && { website: body.website }),
        ...(body.description && { description: body.description }),
        ...(body.cuisineType && { cuisineType: body.cuisineType }),
        ...(body.logo && { logo: body.logo }),
        ...(body.coverImage && { coverImage: body.coverImage })
      },
      include: {
        settings: true
      }
    })
    
    // Update Settings wenn vorhanden ODER wenn Land geändert wird
    let currencyToSet = body.settings?.currency
    
    // Automatisch Währung basierend auf Land setzen
    if (body.country && !currencyToSet) {
      const currencyMap: { [key: string]: string } = {
        'JO': 'JOD', 'SA': 'SAR', 'AE': 'AED', 'KW': 'KWD',
        'BH': 'BHD', 'QA': 'QAR', 'OM': 'OMR', 'EG': 'EGP',
        'LB': 'LBP', 'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR',
        'ES': 'EUR', 'NL': 'EUR', 'BE': 'EUR', 'AT': 'EUR',
        'GB': 'GBP', 'US': 'USD', 'CH': 'CHF', 'IN': 'INR'
      }
      currencyToSet = currencyMap[body.country] || 'EUR'
    }
    
    if (body.settings || currencyToSet) {
      const settingsData = {
        ...body.settings,
        ...(currencyToSet && { currency: currencyToSet })
      }
      
      console.log('Updating settings for restaurant:', id, settingsData)
      
      try {
        // Versuche erst zu updaten
        const updatedSettings = await prisma.restaurantSettings.update({
          where: { restaurantId: id },
          data: settingsData
        })
        console.log('Settings updated:', updatedSettings)
      } catch (e) {
        // Falls nicht existiert, erstelle neue Settings
        const newSettings = await prisma.restaurantSettings.create({
          data: {
            restaurantId: id,
            ...settingsData
          }
        })
        console.log('Settings created:', newSettings)
      }
    }
    
    // Lade Restaurant mit aktualisierten Settings neu
    const finalRestaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        settings: true
      }
    })

    return NextResponse.json({
      success: true,
      data: finalRestaurant
    })

  } catch (error) {
    console.error('PATCH restaurant error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// DELETE - Restaurant löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Nur Owner oder Admin können löschen
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: { ownerId: true }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

    const isOwner = restaurant.ownerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Löschen' },
        { status: 403 }
      )
    }

    // Lösche Restaurant (cascade delete durch Prisma)
    await prisma.restaurant.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Restaurant erfolgreich gelöscht'
    })

  } catch (error) {
    console.error('DELETE restaurant error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}