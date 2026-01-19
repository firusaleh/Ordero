import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { sendNotificationEmail } from '@/lib/email-sendgrid'

const notificationSchema = z.object({
  message: z.string().min(1, 'Message is required')
})

// POST - Send notification to customer about reservation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message } = notificationSchema.parse(body)
    const { reservationId } = await params

    // First verify the reservation belongs to user's restaurant
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { 
        restaurant: {
          select: {
            id: true,
            name: true,
            ownerId: true
          }
        }
      }
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

    // Send notification email
    try {
      await sendNotificationEmail({
        to: reservation.customerEmail,
        customerName: reservation.customerName,
        restaurantName: reservation.restaurant.name,
        subject: `Update on your reservation at ${reservation.restaurant.name}`,
        message: message,
        reservationDetails: {
          date: reservation.reservationDate.toISOString(),
          time: reservation.reservationTime,
          guests: reservation.numberOfGuests,
          confirmationToken: reservation.confirmationToken || ''
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Notification sent successfully'
      })

    } catch (emailError) {
      console.error('Failed to send notification email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      )
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}