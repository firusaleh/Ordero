import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json()
    
    if (!slug) {
      return NextResponse.json({ error: 'Slug required' }, { status: 400 })
    }
    
    // Revalidate all restaurant pages
    revalidatePath(`/r/${slug}`)
    revalidatePath(`/r/${slug}/tisch/[tableNumber]`, 'page')
    revalidatePath('/dashboard')
    
    return NextResponse.json({ 
      success: true, 
      message: `Cache for ${slug} cleared` 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to revalidate' },
      { status: 500 }
    )
  }
}