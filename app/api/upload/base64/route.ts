import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
    }

    // Validiere Dateityp
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Ungültiger Dateityp. Erlaubt sind: JPEG, PNG, WebP' },
        { status: 400 }
      )
    }

    // Validiere Dateigröße (max 2MB für Base64)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Datei zu groß. Maximal 2MB erlaubt' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Optimiere Bild (max 800px Breite)
    const optimizedBuffer = await sharp(buffer)
      .resize(800, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 80 })
      .toBuffer()

    // Erstelle Thumbnail (200x200)
    const thumbnailBuffer = await sharp(buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 70 })
      .toBuffer()

    // Konvertiere zu Base64 Data URLs
    const imageBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`
    const thumbnailBase64 = `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`

    // Diese Base64-Strings können direkt in der Datenbank gespeichert werden
    return NextResponse.json({
      success: true,
      imageUrl: imageBase64,
      thumbnailUrl: thumbnailBase64
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Hochladen der Datei' },
      { status: 500 }
    )
  }
}