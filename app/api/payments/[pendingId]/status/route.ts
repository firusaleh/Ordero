import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pendingId: string }> }
) {
  try {
    const { pendingId } = await params

    if (!pendingId) {
      return NextResponse.json(
        { error: 'Missing pendingId parameter' },
        { status: 400 }
      )
    }

    // Validate MongoDB ObjectId format
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(pendingId)
    if (!isObjectId) {
      return NextResponse.json(
        { error: 'Invalid pendingId format' },
        { status: 400 }
      )
    }

    // Find the PendingPayment record
    const pendingPayment = await prisma.pendingPayment.findUnique({
      where: { id: pendingId }
    })

    if (!pendingPayment) {
      return NextResponse.json(
        { error: 'PendingPayment not found' },
        { status: 404 }
      )
    }

    // Check if order was created
    if (pendingPayment.orderId && pendingPayment.orderNumber) {
      return NextResponse.json({
        status: 'completed',
        orderId: pendingPayment.orderId,
        orderNumber: pendingPayment.orderNumber
      })
    }

    // Check if pending payment has expired
    if (pendingPayment.expiresAt < new Date()) {
      return NextResponse.json({
        status: 'expired',
        message: 'Payment session has expired'
      })
    }

    // Still pending - order not yet created by webhook
    return NextResponse.json({
      status: 'pending',
      message: 'Waiting for payment confirmation'
    })
  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    )
  }
}
