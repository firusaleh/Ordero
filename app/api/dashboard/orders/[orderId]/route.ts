import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED', 'PAID']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED']).optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'PAYPAL', 'STRIPE']).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  try {
    const { orderId } = await params

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
      },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({ data: order })
  } catch (error) {
    console.error('Fehler beim Laden der Bestellung:', error)
    return NextResponse.json(
      { 
        error: 'Interner Serverfehler',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  try {
    const { orderId } = await params
    const body = await request.json()
    const validatedData = updateOrderSchema.parse(body)

    // Verifiziere Zugriffsrechte
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: {
          include: {
            staff: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    const hasAccess = order.restaurant.ownerId === session.user.id ||
      order.restaurant.staff.some(s => s.userId === session.user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 })
    }

    // Update Bestellung mit Zeitstempeln
    const updateData: any = { ...validatedData }
    
    if (validatedData.status === 'CONFIRMED' && !order.confirmedAt) {
      updateData.confirmedAt = new Date()
    }
    if (validatedData.status === 'PREPARING' && !order.preparedAt) {
      updateData.preparedAt = new Date()
    }
    if (validatedData.status === 'READY' && !order.readyAt) {
      updateData.readyAt = new Date()
    }
    if (validatedData.status === 'DELIVERED' && !order.deliveredAt) {
      updateData.deliveredAt = new Date()
    }
    if (validatedData.status === 'CANCELLED' && !order.cancelledAt) {
      updateData.cancelledAt = new Date()
    }
    if (validatedData.status === 'PAID' && !order.completedAt) {
      updateData.completedAt = new Date()
    }
    if (validatedData.paymentStatus === 'PAID' && !order.paidAt) {
      updateData.paidAt = new Date()
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  try {
    const { orderId } = await params

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

    // Lösche nur wenn Bestellung noch nicht bezahlt
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Bezahlte Bestellungen können nicht gelöscht werden' },
        { status: 400 }
      )
    }

    await prisma.order.delete({
      where: { id: orderId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Löschen der Bestellung:', error)
    return NextResponse.json(
      { 
        error: 'Interner Serverfehler',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    )
  }
}