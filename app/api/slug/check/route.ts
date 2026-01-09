import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidSlug } from '@/lib/utils/slug'

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json()
    
    if (!slug) {
      return NextResponse.json(
        { available: false, error: 'Slug ist erforderlich' },
        { status: 400 }
      )
    }
    
    // Validiere Slug-Format
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { 
          available: false, 
          error: 'Ungültiges Format. Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt (3-50 Zeichen)' 
        },
        { status: 400 }
      )
    }
    
    // Prüfe reservierte Slugs
    const reservedSlugs = [
      'admin', 'api', 'app', 'dashboard', 'login', 'register', 
      'onboarding', 'restaurant', 'order', 'menu', 'about',
      'contact', 'help', 'support', 'legal', 'privacy', 'terms',
      'blog', 'news', 'press', 'careers', 'oriido'
    ]
    
    if (reservedSlugs.includes(slug)) {
      return NextResponse.json(
        { 
          available: false, 
          error: 'Dieser Name ist reserviert. Bitte wählen Sie einen anderen.' 
        }
      )
    }
    
    // Prüfe ob Slug bereits existiert
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true }
    })
    
    if (existingRestaurant) {
      return NextResponse.json(
        { 
          available: false, 
          error: 'Dieser Name ist bereits vergeben.' 
        }
      )
    }
    
    return NextResponse.json({ 
      available: true,
      message: 'Dieser Name ist verfügbar!' 
    })
    
  } catch (error) {
    console.error('Slug check error:', error)
    return NextResponse.json(
      { available: false, error: 'Fehler bei der Überprüfung' },
      { status: 500 }
    )
  }
}