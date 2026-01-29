import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Überprüfe ob der Benutzer eingeloggt ist
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await request.json()

    // Validierung
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Aktuelles und neues Passwort sind erforderlich' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Das neue Passwort muss mindestens 8 Zeichen lang sein' },
        { status: 400 }
      )
    }

    // Hole den Benutzer mit Passwort aus der Datenbank
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true
      }
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      )
    }

    // Überprüfe das aktuelle Passwort
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Das aktuelle Passwort ist falsch' },
        { status: 400 }
      )
    }

    // Prüfe, ob das neue Passwort anders als das alte ist
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'Das neue Passwort muss sich vom aktuellen unterscheiden' },
        { status: 400 }
      )
    }

    // Hash das neue Passwort
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Aktualisiere das Passwort in der Datenbank
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    // Log die Passwort-Änderung (optional)
    console.log(`Passwort geändert für Benutzer: ${session.user.email} (ID: ${session.user.id})`)

    return NextResponse.json({
      success: true,
      message: 'Passwort erfolgreich geändert'
    })
    
  } catch (error) {
    console.error('Fehler beim Ändern des Passworts:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler beim Ändern des Passworts' },
      { status: 500 }
    )
  }
}