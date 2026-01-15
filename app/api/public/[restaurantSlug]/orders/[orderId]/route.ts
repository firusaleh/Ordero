import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ restaurantSlug: string; orderId: string }> }
) {
  try {
    const { restaurantSlug, orderId } = await params
    
    // Find restaurant by slug
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
      select: { id: true }
    })
    
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }
    
    // Fetch order details
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId: restaurant.id
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                name: true,
                price: true
              }
            }
          }
        }
      }
    })
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // Format the response
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      type: order.type,
      subtotal: order.subtotal,
      tax: order.tax,
      tip: order.tip || 0,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        variant: item.variant,
        variantPrice: item.variantPrice,
        extras: item.extras,
        notes: item.notes
      })),
      createdAt: order.createdAt,
      confirmedAt: order.confirmedAt,
      preparedAt: order.preparedAt,
      readyAt: order.readyAt,
      deliveredAt: order.deliveredAt
    }
    
    return NextResponse.json(formattedOrder)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}