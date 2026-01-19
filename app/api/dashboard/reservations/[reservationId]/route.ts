import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const updateReservationSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
  tableId: z.string().optional().nullable()
})

// PATCH - Update reservation status or details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateReservationSchema.parse(body)
    const { reservationId } = await params

    // First verify the reservation belongs to user's restaurant
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { restaurant: true }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    if (reservation.restaurant.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Update the reservation
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: validatedData,
      include: {
        table: {
          select: {
            id: true,
            number: true,
            seats: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      reservation: updatedReservation
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating reservation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel reservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { reservationId } = await params

    // First verify the reservation belongs to user's restaurant
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { restaurant: true }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    if (reservation.restaurant.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Update status to cancelled instead of deleting
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED' }
    })

    return NextResponse.json({
      success: true,
      reservation: updatedReservation
    })

  } catch (error) {
    console.error('Error cancelling reservation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}