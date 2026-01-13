import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Finde Al Dayaa Restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: 'al-dayaa' },
      include: {
        settings: true
      }
    })
    
    if (!restaurant) {
      return NextResponse.json({ 
        error: 'Restaurant Al Dayaa nicht gefunden',
        tried: 'al-dayaa'
      }, { status: 404 })
    }
    
    console.log('Al Dayaa Restaurant gefunden:', {
      id: restaurant.id,
      name: restaurant.name,
      country: restaurant.country,
      currentSettings: restaurant.settings
    })
    
    // Force update to Jordan and JOD
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        country: 'JO',
        city: restaurant.city || 'Amman'
      }
    })
    
    // Force update or create settings with JOD
    let settings
    try {
      settings = await prisma.restaurantSettings.update({
        where: { restaurantId: restaurant.id },
        data: {
          currency: 'JOD',
          timezone: 'Asia/Amman'
        }
      })
    } catch (e) {
      // Settings don't exist, create them
      settings = await prisma.restaurantSettings.create({
        data: {
          restaurantId: restaurant.id,
          currency: 'JOD',
          timezone: 'Asia/Amman',
          orderingEnabled: true,
          requireTableNumber: true
        }
      })
    }
    
    // Verify the update
    const finalRestaurant = await prisma.restaurant.findUnique({
      where: { slug: 'al-dayaa' },
      include: {
        settings: true
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Al Dayaa Restaurant wurde erfolgreich auf Jordanien/JOD umgestellt!',
      restaurant: {
        name: finalRestaurant?.name,
        slug: finalRestaurant?.slug,
        country: finalRestaurant?.country,
        city: finalRestaurant?.city,
        currency: finalRestaurant?.settings?.currency,
        timezone: finalRestaurant?.settings?.timezone
      },
      guestPageUrl: 'https://www.oriido.com/r/al-dayaa/tisch/1'
    })
    
  } catch (error: any) {
    console.error('Fix Al Dayaa error:', error)
    return NextResponse.json(
      { 
        error: 'Fehler beim Update', 
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}