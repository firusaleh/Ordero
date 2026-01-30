import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { restaurantId } = await params
    const { date } = await request.json()

    // Update restaurant billing date
    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        lastBillingDate: new Date(date),
        monthlyOrderCount: 0 // Reset counter after payment
      }
    })

    return NextResponse.json({ success: true, restaurant: updated })
  } catch (error) {
    console.error('Error marking as paid:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}