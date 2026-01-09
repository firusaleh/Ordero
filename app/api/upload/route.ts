import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'
import { randomUUID } from 'crypto'

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

    // Validiere Dateigröße (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Datei zu groß. Maximal 5MB erlaubt' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Erstelle eindeutigen Dateinamen
    const fileExt = file.type.split('/')[1]
    const fileName = `${randomUUID()}.${fileExt}`
    
    // Erstelle Upload-Verzeichnisse
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'menu')
    const thumbDir = join(process.cwd(), 'public', 'uploads', 'menu', 'thumbnails')
    
    // Stelle sicher, dass Verzeichnisse existieren
    await mkdir(uploadDir, { recursive: true })
    await mkdir(thumbDir, { recursive: true })

    // Optimiere und speichere Original-Bild (max 1200px Breite)
    const optimizedBuffer = await sharp(buffer)
      .resize(1200, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 85 })
      .toBuffer()

    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, optimizedBuffer)

    // Erstelle Thumbnail (300x300)
    const thumbnailBuffer = await sharp(buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer()

    const thumbnailPath = join(thumbDir, fileName)
    await writeFile(thumbnailPath, thumbnailBuffer)

    // Rückgabe der URLs
    const imageUrl = `/uploads/menu/${fileName}`
    const thumbnailUrl = `/uploads/menu/thumbnails/${fileName}`

    return NextResponse.json({
      success: true,
      imageUrl,
      thumbnailUrl
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Hochladen der Datei' },
      { status: 500 }
    )
  }
}