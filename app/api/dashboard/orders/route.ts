import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED', 'PAID']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED']).optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'PAYPAL', 'STRIPE']).optional(),
})

export async function GET(request: Request) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
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
      return NextResponse.json({ error: 'Restaurant nicht gefunden' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const tableId = searchParams.get('tableId')
    const limit = searchParams.get('limit')

    const where: any = { restaurantId: restaurant.id }
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    
    if (tableId) {
      where.tableId = tableId
    }
    
    if (date) {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      
      where.createdAt = {
        gte: startDate,
        lte: endDate
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        items: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      ...(limit && { take: parseInt(limit) })
    })

    return NextResponse.json({ data: orders })
  } catch (error) {
    console.error('Fehler beim Laden der Bestellungen:', error)
    return NextResponse.json(
      { 
        error: 'Interner Serverfehler',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { orderId, ...updateData } = body
    
    if (!orderId) {
      return NextResponse.json({ error: 'Bestell-ID erforderlich' }, { status: 400 })
    }

    const validatedData = updateOrderSchema.parse(updateData)

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant nicht gefunden' }, { status: 404 })
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId: restaurant.id
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    const updatePayload: any = { ...validatedData }
    
    if (validatedData.status === 'CONFIRMED' && !order.confirmedAt) {
      updatePayload.confirmedAt = new Date()
    }
    if (validatedData.status === 'PREPARING' && !order.preparedAt) {
      updatePayload.preparedAt = new Date()
    }
    if (validatedData.status === 'READY' && !order.readyAt) {
      updatePayload.readyAt = new Date()
    }
    if (validatedData.status === 'DELIVERED' && !order.deliveredAt) {
      updatePayload.deliveredAt = new Date()
    }
    if (validatedData.status === 'CANCELLED' && !order.cancelledAt) {
      updatePayload.cancelledAt = new Date()
    }
    if (validatedData.paymentStatus === 'PAID' && !order.paidAt) {
      updatePayload.paidAt = new Date()
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updatePayload,
      include: {
        table: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })

    return NextResponse.json({ data: updatedOrder })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Ungültige Eingabedaten',
          details: (error as any).errors
        },
        { status: 400 }
      )
    }
    
    console.error('Fehler beim Aktualisieren der Bestellung:', error)
    return NextResponse.json(
      { 
        error: 'Interner Serverfehler',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    )
  }
}