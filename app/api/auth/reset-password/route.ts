import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token und Passwort sind erforderlich' },
        { status: 400 }
      )
    }

    // Validiere Passwort
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 8 Zeichen lang sein' },
        { status: 400 }
      )
    }

    // Finde Benutzer mit Token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date() // Token muss noch gültig sein
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Token' },
        { status: 400 }
      )
    }

    // Hash das neue Passwort
    const hashedPassword = await bcrypt.hash(password, 10)

    // Aktualisiere Benutzer
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    })

    console.log('Password successfully reset for user:', user.email)

    return NextResponse.json({ 
      success: true,
      message: 'Passwort erfolgreich zurückgesetzt' 
    })

  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Zurücksetzen des Passworts' },
      { status: 500 }
    )
  }
}