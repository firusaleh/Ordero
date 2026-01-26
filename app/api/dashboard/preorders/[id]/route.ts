import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// PATCH - Update preorder status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orderId } = await context.params
    const data = await request.json()
    const { status } = data

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Verify user owns the order's restaurant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurant: {
          ownerId: session.user.id
        }
      },
      include: {
        restaurant: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      )
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder
    })

  } catch (error) {
    console.error('Error updating preorder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel preorder
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orderId } = await context.params

    // Verify user owns the order's restaurant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurant: {
          ownerId: session.user.id
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      )
    }

    // Update order status to cancelled
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder
    })

  } catch (error) {
    console.error('Error cancelling preorder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get single preorder details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orderId } = await context.params

    // Fetch order with all details
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurant: {
          ownerId: session.user.id
        },
        type: 'TAKEAWAY',
        notes: {
          contains: 'PREORDER: true'
        }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        restaurant: true,
        table: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Preorder not found or access denied' },
        { status: 404 }
      )
    }

    // Extract PICKUP_TIME from notes
    const pickupTimeMatch = order.notes?.match(/PICKUP_TIME: ([\d\-T:.Z]+)/)
    const pickupTime = pickupTimeMatch ? new Date(pickupTimeMatch[1]) : order.createdAt
    
    // Clean notes by removing metadata
    const cleanNotes = order.notes
      ?.split('\n---\n')
      .filter(line => !line.startsWith('PICKUP_TIME:') && !line.startsWith('PREORDER:'))
      .join('\n')
      .trim()

    // Transform to preorder format
    const preorder = {
      id: order.id,
      restaurantId: order.restaurantId,
      customerName: order.guestName || 'Kunde',
      customerEmail: order.guestEmail || '',
      customerPhone: order.guestPhone || '',
      pickupTime: pickupTime,
      orderType: 'PICKUP' as const,
      status: order.status,
      subtotal: order.subtotal,
      tax: order.tax,
      serviceFee: order.serviceFee || 0,
      total: order.total,
      paymentMethod: order.paymentMethod || 'CASH',
      paymentStatus: order.paymentStatus || 'PENDING',
      notes: cleanNotes || '',
      items: order.items.map(item => ({
        id: item.id,
        name: item.name || item.menuItem?.name || 'Artikel',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        variant: item.variant || undefined,
        variantPrice: item.variantPrice || undefined,
        extras: item.extras || [],
        notes: item.notes || ''
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }

    return NextResponse.json({
      success: true,
      preorder
    })

  } catch (error) {
    console.error('Error fetching preorder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}