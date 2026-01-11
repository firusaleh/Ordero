import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email-sendgrid'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'E-Mail-Adresse erforderlich' },
        { status: 400 }
      )
    }

    // Finde Benutzer
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Aus Sicherheitsgründen geben wir immer eine erfolgreiche Antwort zurück
    // um zu verhindern, dass jemand herausfinden kann, welche E-Mails registriert sind
    if (!user) {
      console.log('Password reset requested for non-existent email:', email)
      return NextResponse.json({ 
        success: true,
        message: 'Wenn diese E-Mail-Adresse registriert ist, erhalten Sie eine E-Mail mit weiteren Anweisungen.' 
      })
    }

    // Generiere Reset-Token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 Stunde

    // Speichere Token in Datenbank
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // Erstelle Reset-Link
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

    // Sende E-Mail
    try {
      await sendEmail({
        to: user.email,
        subject: 'Passwort zurücksetzen - Oriido',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #ff6b6b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .button:hover { background: #ff5252; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px; }
              .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Passwort zurücksetzen</h1>
              </div>
              <div class="content">
                <p>Hallo ${user.name || 'Nutzer'},</p>
                
                <p>Sie haben angefordert, Ihr Passwort zurückzusetzen. Klicken Sie auf den folgenden Link, um ein neues Passwort zu wählen:</p>
                
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Neues Passwort wählen</a>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Wichtig:</strong> Dieser Link ist nur 1 Stunde gültig. 
                  Falls Sie keine Passwort-Zurücksetzung angefordert haben, ignorieren Sie diese E-Mail einfach.
                </div>
                
                <p>Alternativ können Sie diesen Link kopieren und in Ihren Browser einfügen:</p>
                <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px;">
                  ${resetUrl}
                </p>
                
                <div class="footer">
                  <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht darauf.</p>
                  <p>© 2024 Oriido. Alle Rechte vorbehalten.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      })
      
      console.log('Password reset email sent to:', user.email)
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError)
      // Wir geben trotzdem eine erfolgreiche Antwort zurück
    }

    return NextResponse.json({ 
      success: true,
      message: 'Wenn diese E-Mail-Adresse registriert ist, erhalten Sie eine E-Mail mit weiteren Anweisungen.' 
    })

  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Zurücksetzen des Passworts' },
      { status: 500 }
    )
  }
}