import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sendWelcomeEmail } from '@/lib/email'

const createRestaurantSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  ownerName: z.string().min(2, 'Besitzername muss mindestens 2 Zeichen lang sein'),
  ownerEmail: z.string().email('Ungültige E-Mail-Adresse'),
  ownerPassword: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  phone: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Überprüfe Admin-Berechtigung
    const session = await auth()
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validiere Input
    const validatedData = createRestaurantSchema.parse(body)
    
    // Prüfe ob E-Mail bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.ownerEmail }
    })
    
    if (existingUser) {
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
          plan: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 Tage Trial
          email: validatedData.ownerEmail,
          phone: validatedData.phone,
        }
      })
      
      // Erstelle Restaurant-Einstellungen mit Standardwerten
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
          taxRate: 19,
          includeTax: true,
          currency: 'EUR',
          language: 'de',
          timezone: 'Europe/Berlin'
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
    
    // Sende Willkommens-E-Mail an den Restaurant-Besitzer
    try {
      await sendWelcomeEmail({
        email: validatedData.ownerEmail,
        name: validatedData.ownerName,
        restaurantName: validatedData.name,
        password: tempPassword,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.oriido.com'}/login`
      })
      console.log('Welcome email sent to:', validatedData.ownerEmail)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Fahre fort, auch wenn E-Mail fehlschlägt
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
    
  } catch (error) {
    console.error('Create restaurant error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Eingabedaten', details: (error as any).errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}