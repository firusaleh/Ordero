import QRCode from 'qrcode'
import jsPDF from 'jspdf'

export async function generateQRCode(text: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      type: 'image/png' as any,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 512,
    })
    
    return qrCodeDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

export async function generateQRCodeSVG(text: string): Promise<string> {
  try {
    const qrCodeSVG = await QRCode.toString(text, {
      errorCorrectionLevel: 'M',
      type: 'svg',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 512,
    })
    
    return qrCodeSVG
  } catch (error) {
    console.error('Error generating QR code SVG:', error)
    throw new Error('Failed to generate QR code')
  }
}

export async function generateTableQRCode(tableNumber: number, restaurantSlug: string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/r/${restaurantSlug}/tisch/${tableNumber}`
  return generateQRCode(url)
}

export async function generateQRCodesPDF(
  tables: { number: number; name?: string }[],
  restaurantSlug: string,
  restaurantName: string
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const qrSize = 70 // QR Code size in mm
  const margin = 20
  const spacing = 15
  
  // Calculate grid - 2 columns x 3 rows per page
  const cols = 2
  const rows = 3
  const itemsPerPage = cols * rows

  let currentPage = 0
  let position = 0

  for (const table of tables) {
    // Add new page if needed
    if (position % itemsPerPage === 0) {
      if (currentPage > 0) {
        pdf.addPage()
      }
      currentPage++
      
      // Add header
      pdf.setFontSize(22)
      pdf.setTextColor(0, 0, 0)
      pdf.text(restaurantName, pageWidth / 2, 20, { align: 'center' })
      
      pdf.setFontSize(12)
      pdf.setTextColor(100, 100, 100)
      pdf.text('QR-Codes für Tisch-Bestellungen', pageWidth / 2, 28, { align: 'center' })
    }

    // Calculate position on grid
    const gridPosition = position % itemsPerPage
    const col = gridPosition % cols
    const row = Math.floor(gridPosition / cols)
    
    const x = margin + col * (qrSize + spacing)
    const y = 45 + row * (qrSize + spacing + 25) // Extra space for labels

    // Generate QR code
    const qrDataUrl = await generateTableQRCode(table.number, restaurantSlug)
    
    // Add white background
    pdf.setFillColor(255, 255, 255)
    pdf.rect(x - 5, y - 5, qrSize + 10, qrSize + 30, 'F')
    
    // Add border
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.5)
    pdf.rect(x - 5, y - 5, qrSize + 10, qrSize + 30, 'D')
    
    // Add QR code to PDF
    pdf.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize)
    
    // Add table label
    pdf.setFontSize(16)
    pdf.setTextColor(0, 0, 0)
    const label = table.name || `Tisch ${table.number}`
    pdf.text(label, x + qrSize / 2, y + qrSize + 8, { align: 'center' })
    
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text('QR-Code scannen', x + qrSize / 2, y + qrSize + 14, { align: 'center' })
    pdf.text('zum Bestellen', x + qrSize / 2, y + qrSize + 19, { align: 'center' })
    
    position++
  }

  // Add footer on last page
  pdf.setFontSize(8)
  pdf.setTextColor(150, 150, 150)
  pdf.text(`Erstellt am ${new Date().toLocaleDateString('de-DE')}`, pageWidth / 2, pageHeight - 10, { align: 'center' })

  // Return as Blob
  return pdf.output('blob')
}