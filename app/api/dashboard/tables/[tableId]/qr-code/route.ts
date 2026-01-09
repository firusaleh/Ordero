import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateQRCode } from '@/lib/qr-code'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const session = await auth()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tableId } = await params

  try {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        restaurant: {
          include: {
            staff: true
          }
        }
      }
    })

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const hasAccess = table.restaurant.ownerId === session.user.id ||
      table.restaurant.staff.some(s => s.userId === session.user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generiere QR-Code
    const qrCodeDataUrl = await generateQRCode(table.qrCode)
    
    // Extrahiere Base64 Daten
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // Sende als PNG Bild
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="table-${table.number}-qr.png"`
      }
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}