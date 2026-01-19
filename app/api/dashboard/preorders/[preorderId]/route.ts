import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const updatePreorderSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional()
})

// PATCH - Update preorder status or details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ preorderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updatePreorderSchema.parse(body)
    const { preorderId } = await params

    // First verify the preorder belongs to user's restaurant
    const preorder = await prisma.preOrder.findUnique({
      where: { id: preorderId },
      include: { restaurant: true }
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

    // Update the preorder
    const updatedPreorder = await prisma.preOrder.update({
      where: { id: preorderId },
      data: validatedData,
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
        }
      }
    })

    return NextResponse.json({
      success: true,
      preorder: updatedPreorder
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

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
  { params }: { params: Promise<{ preorderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { preorderId } = await params

    // First verify the preorder belongs to user's restaurant
    const preorder = await prisma.preOrder.findUnique({
      where: { id: preorderId },
      include: { restaurant: true }
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

    // Update status to cancelled instead of deleting
    const updatedPreorder = await prisma.preOrder.update({
      where: { id: preorderId },
      data: { status: 'CANCELLED' }
    })

    return NextResponse.json({
      success: true,
      preorder: updatedPreorder
    })

  } catch (error) {
    console.error('Error cancelling preorder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}