import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { id } = await context.params

    // Überprüfe Berechtigung
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: id,
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        staff: {
          include: {
            user: true
          }
        },
        owner: true
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    return NextResponse.json({ 
      staff: restaurant.staff,
      owner: restaurant.owner 
    })
  } catch (error) {
    console.error('Fehler beim Laden der Mitarbeiter:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Mitarbeiter' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { id } = await context.params
    const { email, name, role } = await req.json()

    // Nur der Besitzer kann Mitarbeiter hinzufügen
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: id,
        ownerId: session.user.id
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Prüfe ob der Nutzer bereits existiert
    let user = await prisma.user.findUnique({
      where: { email }
    })

    // Wenn Nutzer nicht existiert, erstelle einen neuen
    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-8)
      
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          hashedPassword: await bcrypt.hash(tempPassword, 10),
          emailVerified: null
        }
      })
      
      // TODO: Sende eine Einladungs-Email mit dem temporären Passwort
      console.log('Neuer Nutzer erstellt mit temporärem Passwort:', tempPassword)
    }

    // Prüfe ob der Nutzer bereits Mitarbeiter ist
    const existingStaff = await prisma.staff.findFirst({
      where: {
        userId: user.id,
        restaurantId: id
      }
    })

    if (existingStaff) {
      return NextResponse.json(
        { error: 'Nutzer ist bereits Mitarbeiter dieses Restaurants' },
        { status: 400 }
      )
    }

    // Füge den Nutzer als Mitarbeiter hinzu
    const staff = await prisma.staff.create({
      data: {
        userId: user.id,
        restaurantId: id,
        role: role.toUpperCase()
      },
      include: {
        user: true
      }
    })

    return NextResponse.json({ 
      success: true,
      staff 
    })
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Mitarbeiters:', error)
    return NextResponse.json(
      { error: 'Fehler beim Hinzufügen des Mitarbeiters' },
      { status: 500 }
    )
  }
}