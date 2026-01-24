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
export async function sendEmail({
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
                    Während Ihrer <strong>kostenlosen Testphase (100 Bestellungen)</strong> haben Sie vollen Zugriff auf alle Premium-Funktionen.
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

// Reservierung Bestätigung
export async function sendReservationConfirmation({
  email,
  name,
  restaurantName,
  date,
  time,
  guests,
  confirmationCode,
  notes
}: {
  email: string
  name: string
  restaurantName: string
  date: string
  time: string
  guests: number
  confirmationCode: string
  notes?: string
}) {
  const html = `
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reservierung bestätigt</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <tr>
                <td style="background-color: #16a34a; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Reservierung bestätigt</h1>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin: 0 0 20px 0;">Hallo ${name}!</h2>
                  
                  <p style="color: #555; line-height: 1.6; margin: 0 0 20px 0;">
                    Ihre Reservierung bei <strong>${restaurantName}</strong> wurde erfolgreich bestätigt.
                  </p>
                  
                  <div style="background-color: #f0fdf4; border: 1px solid #16a34a; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #15803d; margin: 0 0 15px 0;">📅 Reservierungsdetails:</h3>
                    <table style="width: 100%;">
                      <tr>
                        <td style="padding: 5px 0; color: #374151;"><strong>Restaurant:</strong></td>
                        <td style="padding: 5px 0; color: #374151;">${restaurantName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #374151;"><strong>Datum:</strong></td>
                        <td style="padding: 5px 0; color: #374151;">${date}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #374151;"><strong>Uhrzeit:</strong></td>
                        <td style="padding: 5px 0; color: #374151;">${time}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #374151;"><strong>Personen:</strong></td>
                        <td style="padding: 5px 0; color: #374151;">${guests}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #374151;"><strong>Bestätigungscode:</strong></td>
                        <td style="padding: 5px 0; color: #374151; font-family: monospace; font-weight: bold;">${confirmationCode}</td>
                      </tr>
                    </table>
                  </div>
                  
                  ${notes ? `
                  <div style="background-color: #fffbeb; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0;">
                    <strong style="color: #92400e;">Ihre Anmerkungen:</strong>
                    <p style="color: #92400e; margin: 5px 0 0 0;">${notes}</p>
                  </div>
                  ` : ''}
                  
                  <p style="color: #555; line-height: 1.6; margin: 20px 0;">
                    Bitte notieren Sie sich Ihren Bestätigungscode und bringen Sie ihn zum Termin mit.
                  </p>
                </td>
              </tr>
              
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
                  <p style="color: #666; margin: 0; font-size: 14px;">
                    Vielen Dank für Ihre Reservierung!<br>
                    Wir freuen uns auf Ihren Besuch.
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
Reservierung bestätigt!

Hallo ${name},

Ihre Reservierung bei ${restaurantName} wurde bestätigt:

Restaurant: ${restaurantName}
Datum: ${date}
Uhrzeit: ${time}
Personen: ${guests}
Bestätigungscode: ${confirmationCode}

${notes ? `Anmerkungen: ${notes}` : ''}

Bitte bringen Sie Ihren Bestätigungscode zum Termin mit.

Vielen Dank für Ihre Reservierung!
  `.trim()
  
  return await sendEmail({
    to: email,
    subject: `✅ Reservierung bestätigt - ${restaurantName}`,
    html,
    text
  })
}

// Vorbestellung Bestätigung
export async function sendPreOrderConfirmation({
  email,
  name,
  restaurantName,
  pickupTime,
  orderType,
  items,
  total,
  orderId
}: {
  email: string
  name: string
  restaurantName: string
  pickupTime: string
  orderType: string
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  total: number
  orderId: string
}) {
  const itemsList = items.map(item => 
    `${item.quantity}x ${item.name} - €${item.totalPrice.toFixed(2)}`
  ).join('\n')

  const html = `
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vorbestellung bestätigt</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <tr>
                <td style="background-color: #dc2626; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🍽️ Vorbestellung bestätigt</h1>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin: 0 0 20px 0;">Hallo ${name}!</h2>
                  
                  <p style="color: #555; line-height: 1.6; margin: 0 0 20px 0;">
                    Ihre Vorbestellung bei <strong>${restaurantName}</strong> wurde erfolgreich aufgegeben.
                  </p>
                  
                  <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #92400e; margin: 0 0 15px 0;">📋 Bestelldetails:</h3>
                    <table style="width: 100%;">
                      <tr>
                        <td style="padding: 5px 0; color: #374151;"><strong>Bestellnummer:</strong></td>
                        <td style="padding: 5px 0; color: #374151; font-family: monospace;">#${orderId.slice(-8).toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #374151;"><strong>Restaurant:</strong></td>
                        <td style="padding: 5px 0; color: #374151;">${restaurantName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #374151;"><strong>Abholzeit:</strong></td>
                        <td style="padding: 5px 0; color: #374151;">${new Date(pickupTime).toLocaleString('de-DE')}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #374151;"><strong>Art:</strong></td>
                        <td style="padding: 5px 0; color: #374151;">${orderType === 'PICKUP' ? 'Abholung' : 'Im Restaurant'}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #0c4a6e; margin: 0 0 15px 0;">🛍️ Bestellte Artikel:</h3>
                    <div style="font-family: monospace; color: #374151; line-height: 1.8;">
                      ${items.map(item => `
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding: 5px 0;">
                          <span>${item.quantity}x ${item.name}</span>
                          <span>€${item.totalPrice.toFixed(2)}</span>
                        </div>
                      `).join('')}
                      <div style="font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 2px solid #0ea5e9; display: flex; justify-content: space-between;">
                        <span>Gesamt:</span>
                        <span>€${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p style="color: #555; line-height: 1.6; margin: 20px 0;">
                    Bitte haben Sie Ihre Bestellnummer bereit, wenn Sie Ihre Bestellung abholen.
                  </p>
                </td>
              </tr>
              
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
                  <p style="color: #666; margin: 0; font-size: 14px;">
                    Vielen Dank für Ihre Vorbestellung!<br>
                    Wir bereiten Ihr Essen rechtzeitig vor.
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
Vorbestellung bestätigt!

Hallo ${name},

Ihre Vorbestellung bei ${restaurantName} wurde bestätigt:

Bestellnummer: #${orderId.slice(-8).toUpperCase()}
Restaurant: ${restaurantName}
Abholzeit: ${new Date(pickupTime).toLocaleString('de-DE')}
Art: ${orderType === 'PICKUP' ? 'Abholung' : 'Im Restaurant'}

Bestellte Artikel:
${itemsList}

Gesamt: €${total.toFixed(2)}

Bitte haben Sie Ihre Bestellnummer bereit.

Vielen Dank für Ihre Vorbestellung!
  `.trim()
  
  return await sendEmail({
    to: email,
    subject: `🍽️ Vorbestellung bestätigt - ${restaurantName}`,
    html,
    text
  })
}

// Neue Reservierung Benachrichtigung (an Restaurant)
export async function sendNewReservationNotification({
  email,
  reservationId,
  customerName,
  customerEmail,
  customerPhone,
  numberOfGuests,
  date,
  time,
  notes
}: {
  email: string
  reservationId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  numberOfGuests: number
  date: string
  time: string
  notes?: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; margin: 0 auto;">
        <tr>
          <td style="padding: 30px;">
            <h1 style="color: #16a34a; margin: 0 0 20px 0;">📅 Neue Reservierung</h1>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-size: 18px;"><strong>Reservierungscode: #${reservationId.slice(-8).toUpperCase()}</strong></p>
            </div>
            
            <h3 style="color: #333; margin: 20px 0 10px 0;">Kundeninformationen:</h3>
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 15px;">
              <p style="margin: 5px 0;"><strong>Name:</strong> ${customerName}</p>
              <p style="margin: 5px 0;"><strong>E-Mail:</strong> ${customerEmail}</p>
              <p style="margin: 5px 0;"><strong>Telefon:</strong> ${customerPhone}</p>
            </div>
            
            <h3 style="color: #333; margin: 20px 0 10px 0;">Reservierungsdetails:</h3>
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 15px;">
              <p style="margin: 5px 0;"><strong>Datum:</strong> ${date}</p>
              <p style="margin: 5px 0;"><strong>Uhrzeit:</strong> ${time}</p>
              <p style="margin: 5px 0;"><strong>Anzahl Gäste:</strong> ${numberOfGuests}</p>
            </div>
            
            ${notes ? `
            <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <strong>Anmerkungen des Gastes:</strong><br>
              ${notes}
            </div>
            ` : ''}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
  
  const text = `
Neue Reservierung #${reservationId.slice(-8).toUpperCase()}

Kundeninformationen:
Name: ${customerName}
E-Mail: ${customerEmail}
Telefon: ${customerPhone}

Reservierungsdetails:
Datum: ${date}
Uhrzeit: ${time}
Anzahl Gäste: ${numberOfGuests}

${notes ? `Anmerkungen: ${notes}` : ''}
  `.trim()
  
  return await sendEmail({
    to: email,
    subject: `📅 Neue Reservierung - ${customerName} (${numberOfGuests} Personen)`,
    html,
    text
  })
}

// Neue Vorbestellung Benachrichtigung (an Restaurant)
export async function sendNewPreOrderNotification({
  email,
  preOrderId,
  customerName,
  customerEmail,
  customerPhone,
  pickupTime,
  orderType,
  items,
  total,
  notes
}: {
  email: string
  preOrderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  pickupTime: string
  orderType: string
  items: Array<{
    name: string
    quantity: number
    totalPrice: number
  }>
  total: number
  notes?: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; margin: 0 auto;">
        <tr>
          <td style="padding: 30px;">
            <h1 style="color: #dc2626; margin: 0 0 20px 0;">🍽️ Neue Vorbestellung</h1>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-size: 18px;"><strong>Bestellnummer: #${preOrderId.slice(-8).toUpperCase()}</strong></p>
              <p style="margin: 0; font-size: 16px;"><strong>Abholzeit:</strong> ${new Date(pickupTime).toLocaleString('de-DE')}</p>
            </div>
            
            <h3 style="color: #333; margin: 20px 0 10px 0;">Kundeninformationen:</h3>
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 15px;">
              <p style="margin: 5px 0;"><strong>Name:</strong> ${customerName}</p>
              <p style="margin: 5px 0;"><strong>E-Mail:</strong> ${customerEmail}</p>
              <p style="margin: 5px 0;"><strong>Telefon:</strong> ${customerPhone}</p>
              <p style="margin: 5px 0;"><strong>Art:</strong> ${orderType === 'PICKUP' ? 'Abholung' : 'Im Restaurant'}</p>
            </div>
            
            <h3 style="color: #333; margin: 20px 0 10px 0;">Bestellte Artikel:</h3>
            <div style="background-color: #fff; border: 1px solid #dee2e6; border-radius: 6px; padding: 15px;">
              ${items.map(item => `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                  <span><strong>${item.quantity}x</strong> ${item.name}</span>
                  <span style="font-weight: bold;">€${item.totalPrice.toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            
            ${notes ? `
            <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <strong>Anmerkungen des Gastes:</strong><br>
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
Neue Vorbestellung #${preOrderId.slice(-8).toUpperCase()}

Abholzeit: ${new Date(pickupTime).toLocaleString('de-DE')}

Kundeninformationen:
Name: ${customerName}
E-Mail: ${customerEmail}
Telefon: ${customerPhone}
Art: ${orderType === 'PICKUP' ? 'Abholung' : 'Im Restaurant'}

Bestellte Artikel:
${items.map(item => `${item.quantity}x ${item.name} - €${item.totalPrice.toFixed(2)}`).join('\n')}

${notes ? `Anmerkungen: ${notes}` : ''}

Gesamtsumme: €${total.toFixed(2)}
  `.trim()
  
  return await sendEmail({
    to: email,
    subject: `🍽️ Neue Vorbestellung - ${customerName} (€${total.toFixed(2)})`,
    html,
    text
  })
}

// Benachrichtigungs-E-Mail
export async function sendNotificationEmail({
  to,
  customerName,
  restaurantName,
  subject,
  message,
  reservationDetails,
  preorderDetails
}: {
  to: string
  customerName: string
  restaurantName: string
  subject: string
  message: string
  reservationDetails?: {
    date: string
    time: string
    guests: number
    confirmationToken: string
  }
  preorderDetails?: {
    id: string
    pickupTime: string
    orderType: string
    total: number
    items: Array<{
      name: string
      quantity: number
      variant?: string
    }>
  }
}) {
  const html = `
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nachricht von ${restaurantName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <tr>
                <td style="background-color: #3b82f6; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📢 ${restaurantName}</h1>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin: 0 0 20px 0;">Hallo ${customerName}!</h2>
                  
                  <div style="background-color: #f0f9ff; border: 1px solid #3b82f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <p style="color: #1e40af; line-height: 1.6; margin: 0; font-size: 16px;">
                      ${message}
                    </p>
                  </div>
                  
                  ${reservationDetails ? `
                  <div style="background-color: #f8f9fa; border-radius: 6px; padding: 15px; margin: 20px 0;">
                    <h3 style="color: #495057; margin: 0 0 10px 0; font-size: 16px;">📅 Ihre Reservierung:</h3>
                    <p style="color: #6c757d; margin: 0; font-size: 14px;">
                      <strong>Datum:</strong> ${new Date(reservationDetails.date).toLocaleDateString('de-DE')}<br>
                      <strong>Uhrzeit:</strong> ${reservationDetails.time}<br>
                      <strong>Personen:</strong> ${reservationDetails.guests}<br>
                      <strong>Code:</strong> ${reservationDetails.confirmationToken}
                    </p>
                  </div>
                  ` : ''}
                  
                  ${preorderDetails ? `
                  <div style="background-color: #f8f9fa; border-radius: 6px; padding: 15px; margin: 20px 0;">
                    <h3 style="color: #495057; margin: 0 0 10px 0; font-size: 16px;">🍽️ Ihre Vorbestellung:</h3>
                    <p style="color: #6c757d; margin: 0; font-size: 14px;">
                      <strong>Bestellnummer:</strong> #${preorderDetails.id.slice(-8).toUpperCase()}<br>
                      <strong>Abholzeit:</strong> ${new Date(preorderDetails.pickupTime).toLocaleString('de-DE')}<br>
                      <strong>Gesamt:</strong> €${preorderDetails.total.toFixed(2)}
                    </p>
                  </div>
                  ` : ''}
                  
                  <p style="color: #555; line-height: 1.6; margin: 20px 0;">
                    Vielen Dank und bis bald!
                  </p>
                </td>
              </tr>
              
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
                  <p style="color: #666; margin: 0; font-size: 14px;">
                    Diese Nachricht wurde von <strong>${restaurantName}</strong> gesendet.
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
${subject}

Hallo ${customerName},

${message}

${reservationDetails ? `
Ihre Reservierung:
Datum: ${new Date(reservationDetails.date).toLocaleDateString('de-DE')}
Uhrzeit: ${reservationDetails.time}
Personen: ${reservationDetails.guests}
Code: ${reservationDetails.confirmationToken}
` : ''}

${preorderDetails ? `
Ihre Vorbestellung:
Bestellnummer: #${preorderDetails.id.slice(-8).toUpperCase()}
Abholzeit: ${new Date(preorderDetails.pickupTime).toLocaleString('de-DE')}
Gesamt: €${preorderDetails.total.toFixed(2)}
` : ''}

Vielen Dank!

---
Diese Nachricht wurde von ${restaurantName} gesendet.
  `.trim()
  
  return await sendEmail({
    to,
    subject,
    html,
    text
  })
}