import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Überprüfe ob der Benutzer Zugriff auf dieses Restaurant hat
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: resolvedParams.id,
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id, role: { in: ['ADMIN', 'MANAGER'] } } } }
        ]
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden oder keine Berechtigung' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei hochgeladen' },
        { status: 400 }
      )
    }

    // Validiere Dateigröße (max 2MB für Base64)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Datei ist zu groß (max. 2MB)' },
        { status: 400 }
      )
    }

    // Validiere Dateityp
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Nur Bilder sind erlaubt' },
        { status: 400 }
      )
    }

    // Konvertiere zu Base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    // Speichere als Base64 URL direkt in der Datenbank
    // Dies funktioniert für kleine Logos und ist auf Vercel kompatibel
    
    return NextResponse.json({
      success: true,
      url: base64,
      message: 'Bild erfolgreich hochgeladen'
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Hochladen der Datei' },
      { status: 500 }
    )
  }
}