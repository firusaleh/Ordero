import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendReservationConfirmation, sendNewReservationNotification } from '@/lib/email-sendgrid'

// Generiere einen 6-stelligen numerischen Reservierungscode
async function generateUniqueReservationCode(restaurantId: string): Promise<string> {
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    // Generiere eine Zahl zwischen 100000 und 999999
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Prüfe ob der Code bereits existiert (nur für dieses Restaurant)
    const existing = await prisma.reservation.findFirst({
      where: {
        restaurantId,
        confirmationToken: code,
        // Nur aktive Reservierungen (nicht stornierte oder alte)
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    })
    
    if (!existing) {
      return code
    }
    
    attempts++
  }
  
  // Fallback: Verwende Timestamp-basiertem Code wenn keine eindeutige Nummer gefunden wurde
  return Date.now().toString().slice(-6)
}

// Schema für neue Reservierung
const createReservationSchema = z.object({
  customerName: z.string().min(2, 'Name ist erforderlich'),
  customerEmail: z.string().email('Ungültige E-Mail-Adresse'),
  customerPhone: z.string().min(10, 'Telefonnummer ist erforderlich'),
  numberOfGuests: z.number().min(1).max(20),
  reservationDate: z.string(),
  reservationTime: z.string(),
  duration: z.number().optional().default(120),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
  tableId: z.string().optional()
})

// GET - Verfügbare Zeiten und Tische abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantSlug: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const guests = searchParams.get('guests')
    const { restaurantSlug } = await params

    if (!date) {
      return NextResponse.json(
        { error: 'Datum ist erforderlich' },
        { status: 400 }
      )
    }

    // Restaurant finden
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
      include: {
        settings: true,
        tables: {
          where: { 
            isActive: true,
            seats: guests ? { gte: parseInt(guests) } : undefined
          }
        }
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

    // Bestehende Reservierungen für das Datum abrufen
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const existingReservations = await prisma.reservation.findMany({
      where: {
        restaurantId: restaurant.id,
        reservationDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    })

    // Verfügbare Zeitslots generieren (z.B. alle 30 Minuten)
    const availableSlots = []
    const openingHour = 11 // 11:00
    const closingHour = 22 // 22:00
    
    for (let hour = openingHour; hour < closingHour; hour++) {
      for (let minute of [0, 30]) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        
        // Prüfe, ob zu dieser Zeit noch Tische verfügbar sind
        const reservedTablesAtTime = existingReservations.filter(res => {
          const resTime = parseInt(res.reservationTime.split(':')[0]) * 60 + 
                         parseInt(res.reservationTime.split(':')[1])
          const slotTime = hour * 60 + minute
          
          // Überschneidung prüfen (2 Stunden Dauer angenommen)
          return Math.abs(resTime - slotTime) < 120
        })
        
        const availableTables = restaurant.tables.filter(table => 
          !reservedTablesAtTime.find(res => res.tableId === table.id)
        )
        
        if (availableTables.length > 0) {
          availableSlots.push({
            time,
            availableTables: availableTables.length
          })
        }
      }
    }

    return NextResponse.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        settings: restaurant.settings
      },
      availableSlots,
      tables: restaurant.tables
    })

  } catch (error) {
    console.error('Fehler beim Abrufen verfügbarer Zeiten:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// POST - Neue Reservierung erstellen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantSlug: string }> }
) {
  try {
    const body = await request.json()
    
    // Validiere Eingabe
    const validatedData = createReservationSchema.parse(body)
    const { restaurantSlug } = await params

    // Restaurant finden
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
      include: {
        owner: {
          select: {
            email: true
          }
        }
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

    // Erstelle Reservierung
    const reservation = await prisma.reservation.create({
      data: {
        restaurantId: restaurant.id,
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail,
        customerPhone: validatedData.customerPhone,
        numberOfGuests: validatedData.numberOfGuests,
        reservationDate: new Date(validatedData.reservationDate),
        reservationTime: validatedData.reservationTime,
        duration: validatedData.duration,
        notes: validatedData.notes,
        specialRequests: validatedData.specialRequests,
        tableId: validatedData.tableId,
        status: 'PENDING',
        confirmationToken: await generateUniqueReservationCode(restaurant.id)
      }
    })

    // Sende Bestätigungs-E-Mail
    try {
      await sendReservationConfirmation({
        email: validatedData.customerEmail,
        name: validatedData.customerName,
        restaurantName: restaurant.name,
        date: validatedData.reservationDate,
        time: validatedData.reservationTime,
        guests: validatedData.numberOfGuests,
        confirmationCode: reservation.confirmationToken || '',
        notes: validatedData.notes,
        specialRequests: validatedData.specialRequests
      })
    } catch (emailError) {
      console.error('E-Mail-Versand fehlgeschlagen:', emailError)
      // Fahre fort, auch wenn E-Mail fehlschlägt
    }

    // Sende Benachrichtigung an Restaurant
    try {
      if (restaurant.owner?.email) {
        await sendNewReservationNotification({
          email: restaurant.owner.email,
          reservationId: reservation.id,
          customerName: validatedData.customerName,
          customerEmail: validatedData.customerEmail,
          customerPhone: validatedData.customerPhone,
          numberOfGuests: validatedData.numberOfGuests,
          date: validatedData.reservationDate,
          time: validatedData.reservationTime,
          notes: validatedData.notes,
          specialRequests: validatedData.specialRequests
        })
      }
    } catch (emailError) {
      console.error('Restaurant-Benachrichtigung fehlgeschlagen:', emailError)
      // Fahre fort, auch wenn E-Mail fehlschlägt
    }

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        confirmationToken: reservation.confirmationToken,
        status: reservation.status
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Fehler beim Erstellen der Reservierung:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}