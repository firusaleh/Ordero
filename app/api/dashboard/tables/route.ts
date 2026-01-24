import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    const tables = await prisma.table.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { number: 'asc' }
    })

    return NextResponse.json({ data: tables })
  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { number, name, area, seats, isActive, batch, language = 'de' } = body

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Batch-Erstellung
    if (batch) {
      const { from, to, prefix } = batch
      const tables = []
      
      // Generate table prefix based on language
      const defaultTablePrefix = language === 'ar' ? 'طاولة' : language === 'en' ? 'Table' : 'Tisch'
      
      for (let i = from; i <= to; i++) {
        const existingTable = await prisma.table.findFirst({
          where: {
            restaurantId: restaurant.id,
            number: i
          }
        })
        
        if (!existingTable) {
          const qrCode = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.oriido.com'}/r/${restaurant.slug}/table/${i}`
          
          tables.push({
            restaurantId: restaurant.id,
            number: i,
            name: prefix ? `${prefix} ${i}` : `${defaultTablePrefix} ${i}`,
            area: area || 'Hauptbereich',
            seats: seats || 4,
            qrCode,
            isActive: true
          })
        }
      }
      
      if (tables.length > 0) {
        await prisma.table.createMany({
          data: tables
        })
      }
      
      return NextResponse.json({ 
        data: { created: tables.length }
      })
    }

    // Einzelne Tisch-Erstellung
    const existingTable = await prisma.table.findFirst({
      where: {
        restaurantId: restaurant.id,
        number
      }
    })

    if (existingTable) {
      return NextResponse.json(
        { error: 'Table number already exists' },
        { status: 400 }
      )
    }

    const qrCode = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.oriido.com'}/r/${restaurant.slug}/table/${number}`
    
    // Generate table name based on language
    const tablePrefix = language === 'ar' ? 'طاولة' : language === 'en' ? 'Table' : 'Tisch'
    const defaultName = `${tablePrefix} ${number}`

    const table = await prisma.table.create({
      data: {
        restaurantId: restaurant.id,
        number,
        name: name || defaultName,
        area: area || 'Hauptbereich',
        seats: seats || 4,
        qrCode,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json({ data: table })
  } catch (error) {
    console.error('Error creating table:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}