import sgMail from '@sendgrid/mail'

// Initialisiere SendGrid mit API Key
const apiKey = process.env.SENDGRID_API_KEY
if (apiKey) {
  sgMail.setApiKey(apiKey)
  console.log('SendGrid initialized with API key')
} else {
  console.warn('⚠️ SendGrid API key not found - emails will not be sent!')
}

// E-Mail Konfiguration
// WICHTIG: Diese E-Mail muss in SendGrid verifiziert sein!
// Verwende die in Vercel konfigurierte Adresse
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@oriido.de'
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Oriido'
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'support@oriido.com'

console.log('Email config - FROM:', FROM_EMAIL, 'NAME:', FROM_NAME, 'REPLY-TO:', REPLY_TO)

// Helper-Funktion für E-Mail-Versand mit SendGrid
async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: any[]
}) {
  try {
    // In Entwicklung: Log statt senden (wenn kein API Key)
    if (!apiKey) {
      console.log('📧 E-Mail würde gesendet werden:')
      console.log('An:', to)
      console.log('Betreff:', subject)
      console.log('Text:', text || 'HTML E-Mail')
      return { success: true, id: 'dev-mock-id' }
    }

    const msg = {
      to: Array.isArray(to) ? to : [to],
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      replyTo: REPLY_TO,
      subject,
      text: text || 'Bitte aktivieren Sie HTML um diese E-Mail zu sehen.',
      html,
      attachments
    }

    const response = await sgMail.send(msg)
    console.log('✅ Email sent successfully to:', to, 'Subject:', subject)
    
    return { 
      success: true, 
      messageId: response[0].headers['x-message-id'],
      statusCode: response[0].statusCode 
    }
  } catch (error: any) {
    console.error('SendGrid E-Mail-Versand fehlgeschlagen:', error)
    
    // Detaillierte Fehlerbehandlung
    if (error.response) {
      console.error('SendGrid Error Body:', error.response.body)
    }
    
    return { 
      success: false, 
      error: error.message || 'E-Mail konnte nicht gesendet werden',
      details: error.response?.body 
    }
  }
}

// Willkommens-E-Mail für neue Restaurants
export async function sendWelcomeEmail({
  email,
  name,
  restaurantName,
  password,
  loginUrl
}: {
  email: string
  name: string
  restaurantName: string
  password?: string
  loginUrl?: string
}) {
  const finalLoginUrl = loginUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.oriido.com'}/login`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Willkommen bei Oriido</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: #ef4444; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Oriido</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin: 0 0 20px 0;">Willkommen bei Oriido, ${name}! 🎉</h2>
                  
                  <p style="color: #555; line-height: 1.6; margin: 0 0 20px 0;">
                    Ihr Restaurant <strong>${restaurantName}</strong> wurde erfolgreich in unserem System angelegt.
                  </p>
                  
                  ${password ? `
                  <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">🔐 Ihre Zugangsdaten:</h3>
                    <p style="margin: 5px 0; color: #856404; font-family: monospace;">
                      <strong>E-Mail:</strong> ${email}<br>
                      <strong>Passwort:</strong> ${password}
                    </p>
                    <p style="color: #dc3545; font-weight: bold; margin: 15px 0 0 0; font-size: 13px;">
                      ⚠️ Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung!
                    </p>
                  </div>
                  ` : ''}
                  
                  <table cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                    <tr>
                      <td align="center" style="background-color: #ef4444; border-radius: 6px;">
                        <a href="${finalLoginUrl}" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                          Jetzt anmelden →
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <h3 style="color: #333; margin: 30px 0 15px 0;">Ihre nächsten Schritte:</h3>
                  <ul style="color: #555; line-height: 1.8; padding-left: 20px;">
                    <li>Restaurant-Informationen vervollständigen</li>
                    <li>Speisekarte anlegen</li>
                    <li>Tische konfigurieren & QR-Codes generieren</li>
                    <li>Zahlungsmethoden einrichten</li>
                    <li>Mitarbeiter-Accounts anlegen</li>
                  </ul>
                  
                  <p style="color: #555; line-height: 1.6; margin: 20px 0;">
                    Während Ihrer <strong>14-tägigen kostenlosen Testphase</strong> haben Sie vollen Zugriff auf alle Premium-Funktionen.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
                  <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">
                    <strong>Benötigen Sie Hilfe?</strong>
                  </p>
                  <p style="color: #666; margin: 0; font-size: 14px; line-height: 1.6;">
                    📧 E-Mail: <a href="mailto:support@oriido.com" style="color: #ef4444;">support@oriido.com</a><br>
                    📱 WhatsApp: +49 176 12345678<br>
                    🌐 Hilfe: <a href="https://www.oriido.com/help" style="color: #ef4444;">www.oriido.com/help</a>
                  </p>
                  <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
                  <p style="color: #999; margin: 0; font-size: 12px;">
                    © 2024 Oriido. Alle Rechte vorbehalten.<br>
                    Oriido GmbH, München
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
  
  const text = `
Willkommen bei Oriido, ${name}!

Ihr Restaurant ${restaurantName} wurde erfolgreich angelegt.

${password ? `
Ihre Zugangsdaten:
E-Mail: ${email}
Passwort: ${password}

WICHTIG: Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung!
` : ''}

Jetzt anmelden: ${finalLoginUrl}

Ihre nächsten Schritte:
- Restaurant-Informationen vervollständigen  
- Speisekarte anlegen
- Tische konfigurieren & QR-Codes generieren
- Zahlungsmethoden einrichten
- Mitarbeiter-Accounts anlegen

Bei Fragen:
E-Mail: support@oriido.com
WhatsApp: +49 176 12345678

Mit freundlichen Grüßen,
Ihr Oriido Team
  `.trim()
  
  return await sendEmail({
    to: email,
    subject: `Willkommen bei Oriido - ${restaurantName}`,
    html,
    text
  })
}

// E-Mail für neue Bestellung (an Restaurant)
export async function sendNewOrderNotification({
  email,
  orderNumber,
  tableNumber,
  items,
  total,
  customerName,
  notes
}: {
  email: string
  orderNumber: string
  tableNumber: number
  items: Array<{ name: string; quantity: number; price: number }>
  total: number
  customerName?: string
  notes?: string
}) {
  const itemsList = items.map(item => 
    `• ${item.quantity}x ${item.name} - €${(item.price * item.quantity).toFixed(2)}`
  ).join('\n')
  
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; margin: 0 auto;">
        <tr>
          <td style="padding: 30px;">
            <h1 style="color: #ef4444; margin: 0 0 20px 0;">🔔 Neue Bestellung #${orderNumber}</h1>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-size: 18px;"><strong>Tisch ${tableNumber}</strong></p>
              ${customerName ? `<p style="margin: 0; color: #666;">Kunde: ${customerName}</p>` : ''}
            </div>
            
            <h3 style="color: #333; margin: 20px 0 10px 0;">Bestellte Artikel:</h3>
            <div style="background-color: #fff; border: 1px solid #dee2e6; border-radius: 6px; padding: 15px;">
              ${items.map(item => `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                  <span><strong>${item.quantity}x</strong> ${item.name}</span>
                  <span style="font-weight: bold;">€${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            
            ${notes ? `
            <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <strong>Anmerkungen:</strong><br>
              ${notes}
            </div>
            ` : ''}
            
            <div style="text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #dee2e6;">
              <p style="font-size: 24px; color: #28a745; margin: 0;">
                <strong>Gesamt: €${total.toFixed(2)}</strong>
              </p>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
  
  const text = `
Neue Bestellung #${orderNumber}

Tisch: ${tableNumber}
${customerName ? `Kunde: ${customerName}` : ''}

Bestellte Artikel:
${itemsList}

${notes ? `Anmerkungen: ${notes}` : ''}

Gesamtsumme: €${total.toFixed(2)}
  `.trim()
  
  return await sendEmail({
    to: email,
    subject: `🔔 Neue Bestellung #${orderNumber} - Tisch ${tableNumber}`,
    html,
    text
  })
}

// Batch-E-Mail für mehrere Empfänger
export async function sendBatchEmails(emails: Array<{
  to: string
  subject: string
  html: string
  text: string
}>) {
  const results = await Promise.allSettled(
    emails.map(email => sendEmail(email))
  )
  
  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  
  return {
    successful,
    failed,
    total: emails.length,
    results
  }
}