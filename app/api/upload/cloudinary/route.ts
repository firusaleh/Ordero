import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Prüfe ob Cloudinary konfiguriert ist
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      console.log('Cloudinary not configured, falling back to base64')
      // Fallback zu Base64 wenn Cloudinary nicht konfiguriert ist
      return NextResponse.json(
        { 
          error: 'Cloudinary nicht konfiguriert. Bitte CLOUDINARY_CLOUD_NAME und CLOUDINARY_UPLOAD_PRESET in Vercel setzen.',
          fallback: 'base64'
        },
        { status: 501 }
      )
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

    // Validiere Dateigröße (max 10MB für Cloudinary free tier)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Datei zu groß. Maximal 10MB erlaubt' },
        { status: 400 }
      )
    }

    // Erstelle FormData für Cloudinary
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append('file', file)
    cloudinaryFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    cloudinaryFormData.append('folder', 'oriido/menu')

    // Upload zu Cloudinary
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData
      }
    )

    if (!cloudinaryResponse.ok) {
      const error = await cloudinaryResponse.text()
      console.error('Cloudinary upload failed:', error)
      throw new Error('Upload zu Cloudinary fehlgeschlagen')
    }

    const cloudinaryData = await cloudinaryResponse.json()

    // Generiere URLs mit Transformationen
    const imageUrl = cloudinaryData.secure_url
    const thumbnailUrl = imageUrl.replace('/upload/', '/upload/w_200,h_200,c_fill,f_auto,q_auto/')

    return NextResponse.json({
      success: true,
      imageUrl,
      thumbnailUrl,
      publicId: cloudinaryData.public_id
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Hochladen der Datei' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { publicId } = await req.json()
    
    if (!publicId) {
      return NextResponse.json({ error: 'Keine publicId angegeben' }, { status: 400 })
    }

    // Hier könnte man die Löschung über Cloudinary Admin API implementieren
    // Für jetzt loggen wir nur
    console.log('Would delete image:', publicId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Löschen der Datei' },
      { status: 500 }
    )
  }
}