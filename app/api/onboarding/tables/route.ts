import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const tablesSetupSchema = z.object({
  tables: z.array(z.object({
    number: z.number(),
    name: z.string(),
    seats: z.number().optional(),
  }))
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const validatedData = tablesSetupSchema.parse(body)
    
    // Finde das Restaurant des Users
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        ownerId: session.user.id
      }
    })
    
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }
    
    // Erstelle Tische in einer Transaktion
    const createdTables = await prisma.$transaction(async (tx) => {
      // Lösche erst alle existierenden Tische (für den Fall eines Re-Runs)
      await tx.table.deleteMany({
        where: { restaurantId: restaurant.id }
      })
      
      // Erstelle neue Tische
      const tables = await Promise.all(
        validatedData.tables.map((table) =>
          tx.table.create({
            data: {
              restaurantId: restaurant.id,
              number: table.number,
              name: table.name,
              seats: table.seats || 4,
              isActive: true,
              // QR-Code wird generiert
              qrCode: `https://ordero.de/r/${restaurant.slug}/tisch/${table.number}`,
            }
          })
        )
      )
      
      return tables
    })
    
    // TODO: QR-Codes generieren und URLs speichern
    // Dies würde normalerweise im Hintergrund passieren
    
    return NextResponse.json({
      success: true,
      data: {
        tablesCreated: createdTables.length,
        message: `${createdTables.length} Tische erfolgreich erstellt`
      }
    })
    
  } catch (error) {
    console.error('Tables setup error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: (error as any).errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}