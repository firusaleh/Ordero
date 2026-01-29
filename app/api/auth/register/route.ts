import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { authRateLimiter, checkRateLimit, getIpAddress } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email-sendgrid'
import { sendNewRegistrationEmail } from '@/lib/email-service'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  restaurantName: z.string().min(2),
  phone: z.string().optional(),
  country: z.string().default('DE'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate Limiting
    const ip = getIpAddress(request)
    const rateLimitResult = await checkRateLimit(authRateLimiter, ip)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          }
        }
      )
    }
    
    const body = await request.json()
    
    // Validiere Input
    const validatedData = registerSchema.parse(body)
    
    // Prüfe ob E-Mail bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse ist bereits registriert' },
        { status: 400 }
      )
    }
    
    // Hash das Passwort
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    
    // Erstelle Slug für Restaurant
    const slug = validatedData.restaurantName
      .toLowerCase()
      .replace(/[äöüß]/g, (char) => {
        const replacements: { [key: string]: string } = {
          'ä': 'ae',
          'ö': 'oe',
          'ü': 'ue',
          'ß': 'ss'
        }
        return replacements[char] || char
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    // Stelle sicher, dass der Slug eindeutig ist
    let finalSlug = slug
    let counter = 1
    while (await prisma.restaurant.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`
      counter++
    }
    
    // Erstelle User und Restaurant in einer Transaktion
    const result = await prisma.$transaction(async (tx) => {
      // Erstelle User
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          name: validatedData.name,
          phone: validatedData.phone,
          role: 'RESTAURANT_OWNER',
        }
      })
      
      // Berechne Trial-Ende (14 Tage)
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 14)
      
      // Erstelle Restaurant mit Status PENDING (muss vom Admin freigegeben werden)
      const restaurant = await tx.restaurant.create({
        data: {
          name: validatedData.restaurantName,
          slug: finalSlug,
          ownerId: user.id,
          status: 'PENDING', // Restaurant startet als PENDING und muss freigegeben werden
          plan: 'FREE',
          email: validatedData.email,
          phone: validatedData.phone,
          country: validatedData.country || 'DE',
        }
      })
      
      // Erstelle Restaurant-Einstellungen mit Standard-Gebühren
      await tx.restaurantSettings.create({
        data: {
          restaurantId: restaurant.id,
          serviceFeeEnabled: true,
          serviceFeeType: 'FIXED',
          serviceFeeAmount: 0.45,
          serviceFeePercent: 10,
          taxRate: 19,
          includeTax: true
        }
      })
      
      return { user, restaurant }
    })
    
    // Sende E-Mail an Admin über neue Registrierung
    try {
      await sendNewRegistrationEmail({
        adminEmail: 'admin@oriido.com', // TODO: Replace with actual admin email
        restaurantName: validatedData.restaurantName,
        ownerName: validatedData.name,
        ownerEmail: validatedData.email
      })
      console.log('✅ Admin notification sent for new registration')
    } catch (emailError: any) {
      console.error('❌ Failed to send admin notification:', emailError.message)
      // Continue even if email fails
    }
    
    // Sende Willkommens-E-Mail mit Login-Daten an Restaurant-Besitzer
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
                .credentials { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Willkommen bei Oriido! 🎉</h1>
                </div>
                
                <div class="content">
                    <p>Hallo ${validatedData.name},</p>
                    
                    <p>vielen Dank für Ihre Registrierung! Ihr Restaurant <strong>${validatedData.restaurantName}</strong> wurde erfolgreich angelegt.</p>
                    
                    <div class="warning">
                        <strong>⚠️ Wichtiger Hinweis:</strong><br>
                        Ihr Restaurant wartet auf die Freigabe durch unseren Administrator. 
                        Sie erhalten eine separate E-Mail, sobald Ihr Restaurant freigegeben wurde und Sie sich einloggen können.
                    </div>
                    
                    <div class="credentials">
                        <h3 style="margin-top: 0;">🔐 Ihre Login-Daten (nach Freigabe):</h3>
                        <p><strong>E-Mail:</strong> ${validatedData.email}</p>
                        <p><strong>Passwort:</strong> ${validatedData.password}</p>
                        <p style="color: #e74c3c; font-size: 14px; margin-top: 10px;">
                            <strong>Wichtig:</strong> Bewahren Sie diese Daten sicher auf und ändern Sie Ihr Passwort nach dem ersten Login!
                        </p>
                    </div>
                    
                    <p><strong>Die nächsten Schritte:</strong></p>
                    <ol>
                        <li>Warten Sie auf die Freigabe-E-Mail</li>
                        <li>Loggen Sie sich mit Ihren Zugangsdaten ein</li>
                        <li>Richten Sie Ihr Menü ein</li>
                        <li>Generieren Sie QR-Codes für Ihre Tische</li>
                    </ol>
                    
                    <p>Bei Fragen stehen wir Ihnen jederzeit zur Verfügung:</p>
                    <ul>
                        <li>📧 E-Mail: <a href="mailto:support@oriido.com">support@oriido.com</a></li>
                        <li>🌐 Website: <a href="https://www.oriido.com">www.oriido.com</a></li>
                    </ul>
                    
                    <p>Mit freundlichen Grüßen,<br>
                    Ihr Oriido Team</p>
                </div>
                
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Oriido. Alle Rechte vorbehalten.</p>
                </div>
            </div>
        </body>
        </html>
      `
      
      const emailText = `
Willkommen bei Oriido!

Hallo ${validatedData.name},

vielen Dank für Ihre Registrierung! Ihr Restaurant ${validatedData.restaurantName} wurde erfolgreich angelegt.

WICHTIGER HINWEIS:
Ihr Restaurant wartet auf die Freigabe durch unseren Administrator. 
Sie erhalten eine separate E-Mail, sobald Ihr Restaurant freigegeben wurde.

Ihre Login-Daten (nach Freigabe):
E-Mail: ${validatedData.email}
Passwort: ${validatedData.password}

WICHTIG: Bewahren Sie diese Daten sicher auf und ändern Sie Ihr Passwort nach dem ersten Login!

Die nächsten Schritte:
1. Warten Sie auf die Freigabe-E-Mail
2. Loggen Sie sich mit Ihren Zugangsdaten ein
3. Richten Sie Ihr Menü ein
4. Generieren Sie QR-Codes für Ihre Tische

Bei Fragen: support@oriido.com

Mit freundlichen Grüßen,
Ihr Oriido Team
      `
      
      const emailResult = await sendEmail({
        to: validatedData.email,
        subject: `Willkommen bei Oriido - Registrierung erfolgreich`,
        html: emailHtml,
        text: emailText
      })
      
      if (emailResult.success) {
        console.log('✅ Welcome email with credentials sent to:', validatedData.email)
      } else {
        console.error('❌ Email failed:', emailResult.error)
      }
    } catch (emailError: any) {
      console.error('❌ Failed to send welcome email:', emailError.message)
      // Fahre fort, auch wenn E-Mail fehlschlägt - Registrierung war erfolgreich
    }
    
    return NextResponse.json({
      success: true,
      message: 'Registrierung erfolgreich! Ihr Restaurant wartet auf Freigabe durch den Administrator. Sie erhalten eine E-Mail, sobald Ihr Restaurant freigegeben wurde.',
      requiresApproval: true,
      data: {
        email: result.user.email,
        restaurantSlug: result.restaurant.slug,
      }
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Eingabedaten', details: (error as any).errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' },
      { status: 500 }
    )
  }
}