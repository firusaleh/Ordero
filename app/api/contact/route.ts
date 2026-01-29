import { NextRequest, NextResponse } from 'next/server'
import { sendContactFormEmail } from '@/lib/email-sendgrid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, restaurant, phone, message } = body

    // Validierung
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: 'Bitte füllen Sie alle Pflichtfelder aus' },
        { status: 400 }
      )
    }

    // E-Mails senden
    const result = await sendContactFormEmail({
      firstName,
      lastName,
      email,
      restaurant,
      phone,
      message
    })

    // Prüfe ob beide E-Mails erfolgreich waren
    if (!result.adminEmail.success || !result.confirmationEmail.success) {
      console.error('Fehler beim Senden der E-Mails:', {
        admin: result.adminEmail.error,
        confirmation: result.confirmationEmail.error
      })
      
      return NextResponse.json(
        { error: 'Fehler beim Senden der Nachricht' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Nachricht erfolgreich gesendet'
    })

  } catch (error) {
    console.error('Fehler beim Verarbeiten der Kontaktanfrage:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}