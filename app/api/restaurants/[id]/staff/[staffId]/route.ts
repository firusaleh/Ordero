import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { id, staffId } = await context.params
    const { role } = await req.json()

    // Nur der Besitzer kann Rollen ändern
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: id,
        ownerId: session.user.id
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Aktualisiere die Rolle
    const staff = await prisma.staff.update({
      where: { id: staffId },
      data: { role: role.toUpperCase() }
    })

    return NextResponse.json({ 
      success: true,
      staff 
    })
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Mitarbeiters:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Mitarbeiters' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { id, staffId } = await context.params

    // Nur der Besitzer kann Mitarbeiter entfernen
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: id,
        ownerId: session.user.id
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Entferne den Mitarbeiter
    await prisma.staff.delete({
      where: { id: staffId }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Mitarbeiter wurde entfernt' 
    })
  } catch (error) {
    console.error('Fehler beim Entfernen des Mitarbeiters:', error)
    return NextResponse.json(
      { error: 'Fehler beim Entfernen des Mitarbeiters' },
      { status: 500 }
    )
  }
}