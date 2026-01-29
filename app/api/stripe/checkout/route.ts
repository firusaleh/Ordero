import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Alte Stripe Checkout Pläne werden nicht mehr unterstützt
    // Alle Zahlungen laufen jetzt über die neue länderbasierte Abrechnung
    return NextResponse.json({ 
      error: 'Diese Zahlungsmethode wird nicht mehr unterstützt. Bitte verwenden Sie die neue Abrechnung unter Dashboard > Abrechnung.' 
    }, { status: 400 })
    
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Verarbeiten der Anfrage' },
      { status: 500 }
    )
  }
}