import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Find demo restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: 'demo-restaurant' },
      include: {
        settings: true
      }
    })
    
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant nicht gefunden' }, { status: 404 })
    }
    
    const beforeUpdate = {
      name: restaurant.name,
      country: restaurant.country,
      settingsBefore: restaurant.settings
    }
    
    // Bestimme die richtige Währung basierend auf dem Land
    const currencyMap: { [key: string]: string } = {
      'JO': 'JOD',
      'SA': 'SAR',
      'AE': 'AED',
      'KW': 'KWD',
      'BH': 'BHD',
      'QA': 'QAR',
      'OM': 'OMR',
      'EG': 'EGP',
      'LB': 'LBP',
      'DE': 'EUR',
      'FR': 'EUR',
      'IT': 'EUR',
      'ES': 'EUR',
      'GB': 'GBP',
      'US': 'USD',
      'CH': 'CHF'
    }
    
    const correctCurrency = currencyMap[restaurant.country] || 'EUR'
    
    if (restaurant.country === 'JO' && restaurant.settings?.currency !== 'JOD') {
      // Update or create settings
      const updatedSettings = await prisma.restaurantSettings.upsert({
        where: { restaurantId: restaurant.id },
        update: {
          currency: 'JOD',
          timezone: 'Asia/Amman'
        },
        create: {
          restaurantId: restaurant.id,
          currency: 'JOD',
          timezone: 'Asia/Amman'
        }
      })
      
      // Reload restaurant with updated settings
      const updatedRestaurant = await prisma.restaurant.findUnique({
        where: { slug: 'demo-restaurant' },
        include: {
          settings: true
        }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Währung erfolgreich auf JOD gesetzt!',
        beforeUpdate,
        afterUpdate: {
          name: updatedRestaurant?.name,
          country: updatedRestaurant?.country,
          settingsAfter: updatedRestaurant?.settings
        }
      })
    } else if (restaurant.settings?.currency === 'JOD') {
      return NextResponse.json({
        success: true,
        message: 'Währung ist bereits auf JOD gesetzt',
        current: {
          name: restaurant.name,
          country: restaurant.country,
          settings: restaurant.settings
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `Restaurant ist nicht in Jordanien (Land: ${restaurant.country})`,
        current: {
          name: restaurant.name,
          country: restaurant.country,
          settings: restaurant.settings,
          correctCurrency
        }
      })
    }
    
  } catch (error: any) {
    console.error('Fix currency error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler', details: error.message },
      { status: 500 }
    )
  }
}