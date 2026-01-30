import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

// Initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { restaurantId, email, amount, currency, period } = await request.json()

    // Get restaurant details
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Create invoice HTML
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .invoice-details { margin-bottom: 30px; }
          .table { width: 100%; border-collapse: collapse; }
          .table th, .table td { padding: 10px; text-align: left; border-bottom: 1px solid #dee2e6; }
          .table th { background-color: #f8f9fa; }
          .total { font-size: 24px; font-weight: bold; color: #28a745; margin-top: 20px; text-align: right; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Oriido - Rechnung</h1>
            <p>Abrechnungszeitraum: ${period}</p>
          </div>
          
          <div class="invoice-details">
            <h3>Rechnungsempfänger:</h3>
            <p>
              <strong>${restaurant.name}</strong><br>
              ${restaurant.owner.name || ''}<br>
              ${restaurant.owner.email}<br>
              ${restaurant.country === 'DE' ? 'Deutschland' : 'Jordanien'}
            </p>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Beschreibung</th>
                <th>Menge</th>
                <th>Einzelpreis</th>
                <th>Gesamt</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Pay-per-Order Gebühren</td>
                <td>${restaurant.monthlyOrderCount || 0}</td>
                <td>${currency === 'EUR' ? '€' : 'JD'} ${restaurant.payPerOrderRate || 0}</td>
                <td>${currency === 'EUR' ? '€' : 'JD'} ${amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            Gesamtbetrag: ${currency === 'EUR' ? '€' : 'JD'} ${amount.toFixed(2)}
          </div>

          <div class="footer">
            <p><strong>Zahlungsbedingungen:</strong> Zahlbar innerhalb von 14 Tagen</p>
            <p><strong>Bankverbindung:</strong><br>
              IBAN: DE89 3704 0044 0532 0130 00<br>
              BIC: COBADEFFXXX
            </p>
            <p>Bei Fragen wenden Sie sich bitte an: support@oriido.com</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email if Resend is configured
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Oriido Billing <billing@oriido.com>',
          to: email,
          subject: `Oriido Rechnung - ${period}`,
          html: invoiceHTML
        })
        
        return NextResponse.json({ success: true, message: 'Invoice sent successfully' })
      } catch (emailError) {
        console.error('Error sending email:', emailError)
        return NextResponse.json({ 
          success: false, 
          message: 'Could not send email. Please configure RESEND_API_KEY in environment variables.' 
        }, { status: 500 })
      }
    } else {
      // If Resend is not configured, just return success
      // In production, you would handle this differently
      return NextResponse.json({ 
        success: true, 
        message: 'Email service not configured. Invoice generated but not sent.' 
      })
    }
  } catch (error) {
    console.error('Error processing invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}