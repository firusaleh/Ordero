import { NextRequest, NextResponse } from 'next/server'
import { generateQRCodesPDF } from '@/lib/qr-code'
import { generateQRCodesPDFWithArabic } from '@/lib/qr-code-arabic'

// POST /api/dashboard/tables/download-pdf - Download all QR codes as PDF
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      tables, 
      restaurantSlug = 'demo-restaurant', 
      restaurantName = 'Demo Restaurant',
      language = 'de' 
    } = body
    
    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keine Tische ausgewählt' },
        { status: 400 }
      )
    }
    
    // Use Arabic-supported PDF generator for Arabic language
    const pdfBlob = language === 'ar' 
      ? await generateQRCodesPDFWithArabic(tables, restaurantSlug, restaurantName, language)
      : await generateQRCodesPDF(tables, restaurantSlug, restaurantName, language)
    
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