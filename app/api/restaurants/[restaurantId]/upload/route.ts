import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
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
        id: resolvedParams.restaurantId,
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

    // Validiere Dateigröße (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Datei ist zu groß (max. 5MB)' },
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

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Erstelle einen eindeutigen Dateinamen
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${resolvedParams.restaurantId}-${type}-${timestamp}.${extension}`
    
    // Speicherpfad (in public/uploads/restaurants/)
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'restaurants')
    const filepath = join(uploadDir, filename)
    
    // Stelle sicher, dass das Verzeichnis existiert
    const fs = require('fs')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    // Speichere die Datei
    await writeFile(filepath, buffer)
    
    // URL für die Datei
    const url = `/uploads/restaurants/${filename}`

    return NextResponse.json({
      success: true,
      url,
      filename
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Hochladen der Datei' },
      { status: 500 }
    )
  }
}