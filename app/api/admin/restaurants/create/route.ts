import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sendEmail } from '@/lib/email-sendgrid'

const createRestaurantSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  ownerName: z.string().min(2, 'Besitzername muss mindestens 2 Zeichen lang sein'),
  ownerEmail: z.string().email('Ungültige E-Mail-Adresse'),
  ownerPassword: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  phone: z.string().optional(),
  country: z.string().default('DE')
})

export async function POST(request: NextRequest) {
  try {
    // Überprüfe Admin-Berechtigung
    const session = await auth()
    
    console.log('Create restaurant - Session:', session?.user?.email, session?.user?.role)
    
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      console.log('Authorization failed - role:', session?.user?.role)
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('Create restaurant - Request body:', body)
    
    // Validiere Input
    const validatedData = createRestaurantSchema.parse(body)
    
    // Prüfe ob E-Mail bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.ownerEmail }
    })
    
    if (existingUser) {
      console.log('User already exists with email:', validatedData.ownerEmail)
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse ist bereits registriert' },
        { status: 400 }
      )
    }
    
    // Hash das Passwort
    const hashedPassword = await bcrypt.hash(validatedData.ownerPassword, 12)
    
    // Erstelle Slug für Restaurant
    const baseSlug = validatedData.name
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
    let slug = baseSlug
    let counter = 1
    while (await prisma.restaurant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }
    
    // Generiere ein temporäres Passwort für den Besitzer
    const tempPassword = validatedData.ownerPassword
    
    // Erstelle User und Restaurant in einer Transaktion
    const result = await prisma.$transaction(async (tx) => {
      // Erstelle User
      const user = await tx.user.create({
        data: {
          email: validatedData.ownerEmail,
          password: hashedPassword,
          name: validatedData.ownerName,
          phone: validatedData.phone,
          role: 'RESTAURANT_OWNER',
        }
      })
      
      // Erstelle Restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name: validatedData.name,
          slug,
          ownerId: user.id,
          status: 'PENDING', // Beginnt im PENDING Status für Onboarding
          plan: validatedData.country === 'JO' ? 'JO_PAY_PER_ORDER' : 'DE_PAY_PER_ORDER',
          subscriptionPlan: validatedData.country === 'JO' ? 'JO_PAY_PER_ORDER' : 'DE_PAY_PER_ORDER',
          payPerOrderEnabled: true,
          payPerOrderRate: validatedData.country === 'JO' ? 0.10 : 0.45,
          email: validatedData.ownerEmail,
          phone: validatedData.phone,
          country: validatedData.country,
        }
      })
      
      // Bestimme Währung und Zeitzone basierend auf Land
      const currencyByCountry: { [key: string]: string } = {
        'JO': 'JOD', 'SA': 'SAR', 'AE': 'AED', 'KW': 'KWD',
        'BH': 'BHD', 'QA': 'QAR', 'OM': 'OMR', 'EG': 'EGP',
        'GB': 'GBP', 'CH': 'CHF'
      }
      const currency = currencyByCountry[validatedData.country] || 'EUR'
      
      const timezoneByCountry: { [key: string]: string } = {
        'JO': 'Asia/Amman', 'SA': 'Asia/Riyadh', 'AE': 'Asia/Dubai',
        'KW': 'Asia/Kuwait', 'BH': 'Asia/Bahrain', 'QA': 'Asia/Qatar',
        'OM': 'Asia/Muscat', 'EG': 'Africa/Cairo', 'GB': 'Europe/London',
        'CH': 'Europe/Zurich', 'AT': 'Europe/Vienna', 'FR': 'Europe/Paris',
        'IT': 'Europe/Rome', 'ES': 'Europe/Madrid', 'NL': 'Europe/Amsterdam',
        'BE': 'Europe/Brussels'
      }
      const timezone = timezoneByCountry[validatedData.country] || 'Europe/Berlin'

      // Erstelle Restaurant-Einstellungen mit Standardwerten und Gebühren
      await tx.restaurantSettings.create({
        data: {
          restaurantId: restaurant.id,
          orderingEnabled: false, // Deaktiviert bis Onboarding abgeschlossen
          requireTableNumber: true,
          allowTakeaway: false,
          allowDelivery: false,
          autoAcceptOrders: false,
          emailNotifications: true,
          soundNotifications: true,
          acceptCash: true,
          acceptCard: false,
          serviceFeeEnabled: true,
          serviceFeeType: 'FIXED',
          serviceFeeAmount: 0.45,
          serviceFeePercent: 10,
          taxRate: 19,
          includeTax: true,
          currency,
          language: 'de',
          timezone
        }
      })

      // Erstelle Standard-Kategorien
      const defaultCategories = [
        { name: 'Vorspeisen', icon: '🥗', sortOrder: 1 },
        { name: 'Hauptgerichte', icon: '🍽️', sortOrder: 2 },
        { name: 'Nachspeisen', icon: '🍰', sortOrder: 3 },
        { name: 'Getränke', icon: '🥤', sortOrder: 4 }
      ]

      for (const category of defaultCategories) {
        await tx.category.create({
          data: {
            restaurantId: restaurant.id,
            name: category.name,
            icon: category.icon,
            sortOrder: category.sortOrder,
            isActive: true
          }
        })
      }
      
      return { user, restaurant }
    })
    
    // Sende Willkommens-E-Mail mit Login-Daten an den Restaurant-Besitzer
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
                    <p>Hallo ${validatedData.ownerName},</p>
                    
                    <p>herzlich willkommen bei Oriido! Ihr Restaurant <strong>${validatedData.name}</strong> wurde erfolgreich registriert.</p>
                    
                    <div class="credentials">
                        <h3 style="margin-top: 0;">🔐 Ihre Login-Daten:</h3>
                        <p><strong>E-Mail:</strong> ${validatedData.ownerEmail}</p>
                        <p><strong>Passwort:</strong> ${tempPassword}</p>
                        <p style="color: #e74c3c; font-size: 14px; margin-top: 10px;">
                            <strong>Wichtig:</strong> Bitte ändern Sie Ihr Passwort nach dem ersten Login!
                        </p>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.oriido.com'}/login" class="button">
                            Zum Dashboard →
                        </a>
                    </div>
                    
                    <h3>🚀 Die nächsten Schritte:</h3>
                    <ol>
                        <li><strong>Menü einrichten:</strong> Fügen Sie Ihre Speisen und Getränke hinzu</li>
                        <li><strong>QR-Codes generieren:</strong> Erstellen Sie QR-Codes für Ihre Tische</li>
                        <li><strong>Design anpassen:</strong> Personalisieren Sie das Aussehen Ihrer digitalen Speisekarte</li>
                        <li><strong>Zahlungen aktivieren:</strong> Verbinden Sie Ihr Stripe-Konto für Online-Zahlungen</li>
                    </ol>
                    
                    <p>Bei Fragen stehen wir Ihnen jederzeit zur Verfügung:</p>
                    <ul>
                        <li>📧 E-Mail: <a href="mailto:support@oriido.com">support@oriido.com</a></li>
                        <li>📚 Dokumentation: <a href="https://docs.oriido.com">docs.oriido.com</a></li>
                    </ul>
                    
                    <p>Wir freuen uns, Sie bei Oriido begrüßen zu dürfen!</p>
                    
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

Hallo ${validatedData.ownerName},

herzlich willkommen bei Oriido! Ihr Restaurant ${validatedData.name} wurde erfolgreich registriert.

Ihre Login-Daten:
E-Mail: ${validatedData.ownerEmail}
Passwort: ${tempPassword}

WICHTIG: Bitte ändern Sie Ihr Passwort nach dem ersten Login!

Loggen Sie sich hier ein: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.oriido.com'}/login

Die nächsten Schritte:
1. Menü einrichten
2. QR-Codes generieren  
3. Design anpassen
4. Zahlungen aktivieren

Bei Fragen: support@oriido.com

Mit freundlichen Grüßen,
Ihr Oriido Team
      `
      
      const emailResult = await sendEmail({
        to: validatedData.ownerEmail,
        subject: `Willkommen bei Oriido, ${validatedData.name}!`,
        html: emailHtml,
        text: emailText
      })
      
      if (emailResult.success) {
        console.log('✅ Welcome email with credentials sent to:', validatedData.ownerEmail)
      } else {
        console.error('❌ Email failed:', emailResult.error)
      }
    } catch (emailError: any) {
      console.error('❌ Failed to send welcome email:', emailError.message)
      // E-Mail-Fehler sollten den Prozess nicht abbrechen
    }
    
    return NextResponse.json({
      success: true,
      message: 'Restaurant erfolgreich angelegt',
      data: {
        restaurantId: result.restaurant.id,
        restaurantSlug: result.restaurant.slug,
        ownerEmail: result.user.email
      }
    })
    
  } catch (error: any) {
    console.error('Create restaurant error:', error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      const message = firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Ungültige Eingabedaten'
      return NextResponse.json(
        { error: message, details: error.issues },
        { status: 400 }
      )
    }
    
    // Prisma unique constraint error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse oder Restaurant-Name ist bereits vergeben' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}