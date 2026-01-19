import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { sendNotificationEmail } from '@/lib/email-sendgrid'

const notificationSchema = z.object({
  message: z.string().min(1, 'Message is required')
})

// POST - Send notification to customer about preorder
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ preorderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message } = notificationSchema.parse(body)
    const { preorderId } = await params

    // First verify the preorder belongs to user's restaurant
    const preorder = await prisma.preOrder.findUnique({
      where: { id: preorderId },
      include: { 
        restaurant: {
          select: {
            id: true,
            name: true,
            ownerId: true
          }
        },
        items: {
          select: {
            name: true,
            quantity: true,
            variant: true
          }
        }
      }
    })

    if (!preorder) {
      return NextResponse.json(
        { error: 'Preorder not found' },
        { status: 404 }
      )
    }

    if (preorder.restaurant.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Send notification email
    try {
      await sendNotificationEmail({
        to: preorder.customerEmail,
        customerName: preorder.customerName,
        restaurantName: preorder.restaurant.name,
        subject: `Update on your preorder at ${preorder.restaurant.name}`,
        message: message,
        preorderDetails: {
          id: preorder.id,
          pickupTime: preorder.pickupTime.toISOString(),
          orderType: preorder.orderType,
          total: preorder.total,
          items: preorder.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            variant: item.variant || undefined
          }))
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