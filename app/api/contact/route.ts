import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    // E-Mail senden
    const { data, error } = await resend.emails.send({
      from: 'Oriido Contact Form <noreply@oriido.com>',
      to: ['info@oriido.com'],
      replyTo: email,
      subject: `Neue Kontaktanfrage von ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B35;">Neue Kontaktanfrage</h2>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Kontaktdaten:</h3>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>E-Mail:</strong> <a href="mailto:${email}">${email}</a></p>
            ${restaurant ? `<p><strong>Restaurant:</strong> ${restaurant}</p>` : ''}
            ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ''}
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            <h3 style="margin-top: 0;">Nachricht:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="color: #666; font-size: 12px;">
            Diese E-Mail wurde vom Kontaktformular auf www.oriido.com gesendet.
          </p>
        </div>
      `
    })

    if (error) {
      console.error('Fehler beim Senden der E-Mail:', error)
      return NextResponse.json(
        { error: 'Fehler beim Senden der Nachricht' },
        { status: 500 }
      )
    }

    // Bestätigungs-E-Mail an den Absender
    await resend.emails.send({
      from: 'Oriido <noreply@oriido.com>',
      to: [email],
      subject: 'Vielen Dank für Ihre Kontaktaufnahme',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B35;">Vielen Dank für Ihre Nachricht!</h2>
          
          <p>Hallo ${firstName},</p>
          
          <p>wir haben Ihre Nachricht erhalten und werden uns innerhalb von 24 Stunden bei Ihnen melden.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Ihre Nachricht:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          
          <p>Falls Sie weitere Fragen haben, können Sie uns jederzeit kontaktieren:</p>
          <ul>
            <li>E-Mail: <a href="mailto:info@oriido.com">info@oriido.com</a></li>
            <li>Website: <a href="https://www.oriido.com">www.oriido.com</a></li>
          </ul>
          
          <p>Mit freundlichen Grüßen,<br>
          Ihr Oriido Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="color: #666; font-size: 12px;">
            Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.
          </p>
        </div>
      `
    })

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