import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { settingsId, fees } = body

    // Verify that the user owns the restaurant with these settings
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: settingsId },
      include: {
        restaurant: true,
        customFees: true
      }
    })

    if (!settings || settings.restaurant.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete all existing fees for this settings
    await prisma.customFee.deleteMany({
      where: { settingsId }
    })

    // Create new fees
    const createdFees = await Promise.all(
      fees.map((fee: any, index: number) => 
        prisma.customFee.create({
          data: {
            settingsId,
            name: fee.name,
            description: fee.description,
            type: fee.type,
            value: fee.value,
            enabled: fee.enabled,
            sortOrder: index,
            minOrderAmount: fee.minOrderAmount,
            maxOrderAmount: fee.maxOrderAmount,
            applyToDelivery: fee.applyToDelivery,
            applyToDineIn: fee.applyToDineIn,
            applyToTakeaway: fee.applyToTakeaway
          }
        })
      )
    )

    return NextResponse.json({ data: createdFees })
  } catch (error) {
    console.error('Error updating custom fees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}