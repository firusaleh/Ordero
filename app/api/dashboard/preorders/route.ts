import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET - Fetch all preorders for a restaurant
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      )
    }

    // Verify user owns the restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { 
        id: restaurantId,
        ownerId: session.user.id 
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch preorders (Orders with type TAKEAWAY and PREORDER: true in notes)
    const orders = await prisma.order.findMany({
      where: { 
        restaurantId,
        type: 'TAKEAWAY',
        notes: {
          contains: 'PREORDER: true'
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        },
        table: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform orders to match PreOrder interface expected by frontend
    const preorders = orders.map(order => {
      // Extract PICKUP_TIME from notes
      const pickupTimeMatch = order.notes?.match(/PICKUP_TIME: ([\d\-T:.Z]+)/)
      const pickupTime = pickupTimeMatch ? new Date(pickupTimeMatch[1]) : order.createdAt
      
      // Clean notes by removing metadata
      const cleanNotes = order.notes
        ?.split('\n---\n')
        .filter(line => !line.startsWith('PICKUP_TIME:') && !line.startsWith('PREORDER:'))
        .join('\n')
        .trim()

      return {
        id: order.id,
        restaurantId: order.restaurantId,
        customerName: order.guestName || 'Kunde',
        customerEmail: order.guestEmail || '',
        customerPhone: order.guestPhone || '',
        pickupTime: pickupTime,
        orderType: 'PICKUP' as const,
        status: mapOrderStatus(order.status),
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
    })

    return NextResponse.json({
      success: true,
      preorders
    })

  } catch (error) {
    console.error('Error fetching preorders:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}

// Helper function to map order status to preorder status
function mapOrderStatus(orderStatus: string): string {
  switch (orderStatus) {
    case 'PENDING':
      return 'PENDING'
    case 'CONFIRMED':
      return 'CONFIRMED'
    case 'PREPARING':
      return 'PREPARING'
    case 'READY':
      return 'READY'
    case 'COMPLETED':
      return 'COMPLETED'
    case 'CANCELLED':
      return 'CANCELLED'
    default:
      return 'PENDING'
  }
}

// PUT - Update preorder status
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { orderId, status } = data

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
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