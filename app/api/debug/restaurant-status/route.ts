import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Get slug from query params
    const searchParams = req.nextUrl.searchParams
    const slug = searchParams.get('slug')
    
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter required' }, { status: 400 })
    }
    
    // Find restaurant without any status filter
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    return NextResponse.json({
      found: !!restaurant,
      restaurant,
      message: restaurant ? `Restaurant found with status: ${restaurant.status}` : 'Restaurant not found'
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Debug failed', details: error }, { status: 500 })
  }
}