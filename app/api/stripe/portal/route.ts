import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPortalSession } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Prüfe ob Stripe konfiguriert ist
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey || stripeKey === 'sk_test_...' || !stripeKey.startsWith('sk_')) {
      return NextResponse.json({ 
        error: 'Stripe ist noch nicht konfiguriert. Bitte konfigurieren Sie Stripe in der .env.local Datei.' 
      }, { status: 503 })
    }

    // Hole Stripe Customer ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true }
    })

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Kein Stripe-Konto gefunden. Bitte wählen Sie zuerst einen Plan.' },
        { status: 400 }
      )
    }

    // Erstelle Portal Session
    const portalSession = await createPortalSession({
      customerId: user.stripeCustomerId,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Öffnen des Kundenportals' },
      { status: 500 }
    )
  }
}