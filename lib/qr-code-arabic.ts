import QRCode from 'qrcode'
import jsPDF from 'jspdf'

// Import Amiri font for Arabic support
import '@/lib/fonts/amiri-regular-normal'

export async function generateTableQRCode(tableNumber: number, restaurantSlug: string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.oriido.com'}/r/${restaurantSlug}/tisch/${tableNumber}`
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
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

// Translation helpers for QR PDF
const qrTranslations = {
  de: {
    qrCodesTitle: 'QR-Codes für Tisch-Bestellungen',
    table: 'Tisch',
    scanQrCode: 'QR-Code scannen',
    toOrder: 'zum Bestellen',
    createdOn: 'Erstellt am',
    locale: 'de-DE'
  },
  en: {
    qrCodesTitle: 'QR Codes for Table Orders',
    table: 'Table',
    scanQrCode: 'Scan QR Code',
    toOrder: 'to order',
    createdOn: 'Created on',
    locale: 'en-US'
  },
  ar: {
    qrCodesTitle: 'رموز QR للطاولات',
    table: 'طاولة',
    scanQrCode: 'امسح رمز QR',
    toOrder: 'للطلب',
    createdOn: 'تم الإنشاء في',
    locale: 'ar-SA'
  }
}

export async function generateQRCodesPDFWithArabic(
  tables: { number: number; name?: string | null }[],
  restaurantSlug: string,
  restaurantName: string,
  language: 'de' | 'en' | 'ar' = 'de'
): Promise<Blob> {
  const t = qrTranslations[language]
  const isArabic = language === 'ar'
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // For Arabic, we'll use a workaround with canvas
  if (isArabic) {
    // Use default font but render Arabic text as images
    pdf.setFont('helvetica')
  }

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

  // Helper function to add Arabic text
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    if (isArabic) {
      // For Arabic, we need to reverse the text for proper display
      const reversedText = text.split('').reverse().join('')
      pdf.text(reversedText, x, y, options)
    } else {
      pdf.text(text, x, y, options)
    }
  }

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
      addText(restaurantName, pageWidth / 2, 20, { align: 'center' })
      
      pdf.setFontSize(12)
      pdf.setTextColor(100, 100, 100)
      addText(t.qrCodesTitle, pageWidth / 2, 28, { align: 'center' })
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
    
    // Use the actual table name or construct it
    let label: string
    if (table.name) {
      label = table.name
    } else if (isArabic) {
      // For Arabic, use Arabic numerals
      const arabicNumber = table.number.toString()
      label = `${t.table} ${arabicNumber}`
    } else {
      label = `${t.table} ${table.number}`
    }
    
    addText(label, x + qrSize / 2, y + qrSize + 8, { align: 'center' })
    
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    addText(t.scanQrCode, x + qrSize / 2, y + qrSize + 14, { align: 'center' })
    addText(t.toOrder, x + qrSize / 2, y + qrSize + 19, { align: 'center' })
    
    position++
  }

  // Add footer on last page
  pdf.setFontSize(8)
  pdf.setTextColor(150, 150, 150)
  const dateStr = new Date().toLocaleDateString(t.locale)
  addText(`${t.createdOn} ${dateStr}`, pageWidth / 2, pageHeight - 10, { align: 'center' })

  // Return as Blob
  return pdf.output('blob')
}