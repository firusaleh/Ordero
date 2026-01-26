import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }
    
    const pendingRestaurants = await prisma.restaurant.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(pendingRestaurants)
  } catch (error) {
    console.error('Fehler beim Abrufen ausstehender Restaurants:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Daten' },
      { status: 500 }
    )
  }
}