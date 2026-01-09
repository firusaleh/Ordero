import { NextRequest, NextResponse } from 'next/server'
import { generateQRCodesPDF } from '@/lib/qr-code'

// POST /api/dashboard/tables/download-pdf - Download all QR codes as PDF
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tables, restaurantSlug = 'demo-restaurant', restaurantName = 'Demo Restaurant' } = body
    
    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keine Tische ausgewählt' },
        { status: 400 }
      )
    }
    
    const pdfBlob = await generateQRCodesPDF(tables, restaurantSlug, restaurantName)
    
    // Convert Blob to ArrayBuffer for response
    const arrayBuffer = await pdfBlob.arrayBuffer()
    
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="qr-codes-${restaurantSlug}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { success: false, error: 'PDF konnte nicht generiert werden' },
      { status: 500 }
    )
  }
}