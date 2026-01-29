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
      text: text || subject,
      html,
      attachments
    }

    const result = await sgMail.send(msg as any)
    console.log('✅ E-Mail erfolgreich gesendet an:', to)
    
    return { 
      success: true, 
      id: result[0].headers['x-message-id'] || 'unknown',
      data: result[0]
    }
  } catch (error: any) {
    console.error('❌ E-Mail-Versand fehlgeschlagen:', error)
    
    // Detaillierte Fehlerinformationen
    if (error.response) {
      console.error('SendGrid Error Body:', error.response.body)
    }
    
    return { 
      success: false, 
      error: error.message || 'E-Mail konnte nicht gesendet werden' 
    }
  }
}

// Willkommens-E-Mail für neue Restaurants  
export async function sendWelcomeEmail({
  email,
  name,
  restaurantName,
  loginUrl
}: {
  email: string
  name: string
  restaurantName: string
  loginUrl?: string
}) {
  const subject = `Willkommen bei Oriido, ${restaurantName}!`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            h1 { margin: 0; }
            .highlight { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Willkommen bei Oriido! 🎉</h1>
            </div>
            
            <div class="content">
                <p>Hallo ${name},</p>
                
                <p>herzlich willkommen bei Oriido! Ihr Restaurant <strong>${restaurantName}</strong> wurde erfolgreich registriert.</p>
                
                <div class="highlight">
                    <h3>🚀 Die nächsten Schritte:</h3>
                    <ol>
                        <li><strong>Menü einrichten:</strong> Fügen Sie Ihre Speisen und Getränke hinzu</li>
                        <li><strong>QR-Codes generieren:</strong> Erstellen Sie QR-Codes für Ihre Tische</li>
                        <li><strong>Design anpassen:</strong> Personalisieren Sie das Aussehen Ihrer digitalen Speisekarte</li>
                        <li><strong>Zahlungen aktivieren:</strong> Verbinden Sie Ihr Stripe-Konto für Online-Zahlungen</li>
                    </ol>
                </div>
                
                <p>Sie können sich hier in Ihr Dashboard einloggen:</p>
                <div style="text-align: center;">
                    <a href="${loginUrl || process.env.NEXT_PUBLIC_APP_URL + '/login'}" class="button">Zum Dashboard →</a>
                </div>
                
                <p><strong>Tipp:</strong> Beginnen Sie mit dem Einrichten Ihres Menüs. Das dauert nur wenige Minuten!</p>
                
                <p>Bei Fragen stehen wir Ihnen jederzeit zur Verfügung:</p>
                <ul>
                    <li>📧 E-Mail: <a href="mailto:support@oriido.com">support@oriido.com</a></li>
                    <li>📚 Dokumentation: <a href="https://docs.oriido.com">docs.oriido.com</a></li>
                </ul>
                
                <p>Wir freuen uns, Sie bei Oriido begrüßen zu dürfen!</p>
                
                <p>Mit freundlichen Grüßen,<br>
                Ihr Oriido Team</p>
            </div>
            
            <div class="footer">
                <p>© ${new Date().getFullYear()} Oriido. Alle Rechte vorbehalten.</p>
                <p>Diese E-Mail wurde an ${email} gesendet.</p>
            </div>
        </div>
    </body>
    </html>
  `
  
  const text = `
Willkommen bei Oriido!

Hallo ${name},

herzlich willkommen bei Oriido! Ihr Restaurant ${restaurantName} wurde erfolgreich registriert.

Die nächsten Schritte:
1. Menü einrichten
2. QR-Codes generieren  
3. Design anpassen
4. Zahlungen aktivieren

Loggen Sie sich hier ein: ${loginUrl || process.env.NEXT_PUBLIC_APP_URL + '/login'}

Bei Fragen: support@oriido.com

Mit freundlichen Grüßen,
Ihr Oriido Team
  `
  
  return await sendEmail({ to: email, subject, html, text })
}

// Kontaktformular E-Mail
export async function sendContactFormEmail({
  firstName,
  lastName,
  email,
  restaurant,
  phone,
  message
}: {
  firstName: string
  lastName: string
  email: string
  restaurant?: string
  phone?: string
  message: string
}) {
  // E-Mail an info@oriido.com
  const adminSubject = `Neue Kontaktanfrage von ${firstName} ${lastName}`
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF6B35; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
            .info-box { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>📬 Neue Kontaktanfrage</h2>
            </div>
            
            <div class="content">
                <div class="info-box">
                    <h3>Kontaktdaten:</h3>
                    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                    <p><strong>E-Mail:</strong> <a href="mailto:${email}">${email}</a></p>
                    ${restaurant ? `<p><strong>Restaurant:</strong> ${restaurant}</p>` : ''}
                    ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ''}
                </div>
                
                <div class="info-box">
                    <h3>Nachricht:</h3>
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
                
                <p style="margin-top: 30px;">
                    <a href="mailto:${email}" style="background: #FF6B35; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Antworten →
                    </a>
                </p>
            </div>
            
            <div class="footer">
                <p>Diese E-Mail wurde vom Kontaktformular auf www.oriido.com gesendet.</p>
            </div>
        </div>
    </body>
    </html>
  `
  
  const adminText = `
Neue Kontaktanfrage über die Website:

Name: ${firstName} ${lastName}
E-Mail: ${email}
${restaurant ? `Restaurant: ${restaurant}` : ''}
${phone ? `Telefon: ${phone}` : ''}

Nachricht:
${message}

---
Diese E-Mail wurde vom Kontaktformular auf www.oriido.com gesendet.
  `

  const adminEmailResult = await sendEmail({
    to: 'info@oriido.com',
    subject: adminSubject,
    html: adminHtml,
    text: adminText
  })

  // Bestätigungs-E-Mail an den Absender
  const confirmationSubject = 'Vielen Dank für Ihre Kontaktaufnahme'
  const confirmationHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF6B35; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
            .message-box { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #FF6B35; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Vielen Dank für Ihre Nachricht! ✉️</h2>
            </div>
            
            <div class="content">
                <p>Hallo ${firstName},</p>
                
                <p>vielen Dank für Ihre Nachricht! Wir haben Ihre Anfrage erhalten und werden uns innerhalb von <strong>24 Stunden</strong> bei Ihnen melden.</p>
                
                <div class="message-box">
                    <h4>Ihre Nachricht:</h4>
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
                
                <p>Falls Sie weitere Fragen haben, können Sie uns jederzeit kontaktieren:</p>
                <ul>
                    <li>📧 E-Mail: <a href="mailto:info@oriido.com">info@oriido.com</a></li>
                    <li>🌐 Website: <a href="https://www.oriido.com">www.oriido.com</a></li>
                </ul>
                
                <p>Mit freundlichen Grüßen,<br>
                Ihr Oriido Team</p>
            </div>
            
            <div class="footer">
                <p>© ${new Date().getFullYear()} Oriido. Alle Rechte vorbehalten.</p>
                <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
            </div>
        </div>
    </body>
    </html>
  `
  
  const confirmationText = `
Hallo ${firstName},

vielen Dank für Ihre Nachricht! Wir haben Ihre Anfrage erhalten und werden uns innerhalb von 24 Stunden bei Ihnen melden.

Ihre Nachricht:
${message}

Falls Sie weitere Fragen haben, können Sie uns jederzeit kontaktieren:
- E-Mail: info@oriido.com
- Website: www.oriido.com

Mit freundlichen Grüßen,
Ihr Oriido Team

---
Diese E-Mail wurde automatisch generiert.
  `

  const confirmationResult = await sendEmail({
    to: email,
    subject: confirmationSubject,
    html: confirmationHtml,
    text: confirmationText
  })

  return {
    adminEmail: adminEmailResult,
    confirmationEmail: confirmationResult
  }
}

// Reservierungsbestätigung für Gäste
export async function sendReservationConfirmation({
  email,
  name,
  restaurantName,
  date,
  time,
  guests,
  confirmationCode,
  notes,
  specialRequests
}: {
  email: string
  name: string
  restaurantName: string
  date: Date
  time: string
  guests: number
  confirmationCode: string
  notes?: string
  specialRequests?: string
}) {
  const formattedDate = new Date(date).toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const subject = `Reservierungsbestätigung - ${restaurantName}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
            .confirmation-box { background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .confirmation-code { font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 4px; margin: 10px 0; }
            .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
            .detail-row:last-child { border-bottom: none; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Reservierung bestätigt! ✅</h1>
            </div>
            
            <div class="content">
                <p>Liebe/r ${name},</p>
                
                <p>Ihre Reservierung bei <strong>${restaurantName}</strong> wurde erfolgreich bestätigt.</p>
                
                <div class="confirmation-box">
                    <p>Ihr Bestätigungscode:</p>
                    <div class="confirmation-code">${confirmationCode}</div>
                    <p style="font-size: 12px; color: #666;">Bitte bewahren Sie diesen Code auf</p>
                </div>
                
                <div class="details">
                    <h3 style="margin-top: 0;">Reservierungsdetails:</h3>
                    <div class="detail-row">
                        <strong>Restaurant:</strong>
                        <span>${restaurantName}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Datum:</strong>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Uhrzeit:</strong>
                        <span>${time} Uhr</span>
                    </div>
                    <div class="detail-row">
                        <strong>Anzahl Gäste:</strong>
                        <span>${guests} ${guests === 1 ? 'Person' : 'Personen'}</span>
                    </div>
                    ${notes ? `
                    <div class="detail-row">
                        <strong>Anmerkungen:</strong>
                        <span>${notes}</span>
                    </div>
                    ` : ''}
                    ${specialRequests ? `
                    <div class="detail-row">
                        <strong>Besondere Wünsche:</strong>
                        <span>${specialRequests}</span>
                    </div>
                    ` : ''}
                </div>
                
                <p><strong>Wichtige Hinweise:</strong></p>
                <ul>
                    <li>Bitte erscheinen Sie pünktlich zu Ihrer Reservierung</li>
                    <li>Bei Verspätung von mehr als 15 Minuten verfällt Ihre Reservierung möglicherweise</li>
                    <li>Für Stornierungen oder Änderungen kontaktieren Sie bitte das Restaurant direkt</li>
                </ul>
                
                <p>Wir freuen uns auf Ihren Besuch!</p>
                
                <p>Mit freundlichen Grüßen,<br>
                ${restaurantName}</p>
            </div>
            
            <div class="footer">
                <p>Diese E-Mail wurde automatisch generiert.</p>
            </div>
        </div>
    </body>
    </html>
  `
  
  const text = `
Reservierungsbestätigung

Liebe/r ${name},

Ihre Reservierung bei ${restaurantName} wurde erfolgreich bestätigt.

Ihr Bestätigungscode: ${confirmationCode}

Reservierungsdetails:
- Restaurant: ${restaurantName}
- Datum: ${formattedDate}
- Uhrzeit: ${time} Uhr
- Anzahl Gäste: ${guests} ${guests === 1 ? 'Person' : 'Personen'}
${notes ? `- Anmerkungen: ${notes}` : ''}
${specialRequests ? `- Besondere Wünsche: ${specialRequests}` : ''}

Wir freuen uns auf Ihren Besuch!

Mit freundlichen Grüßen,
${restaurantName}
  `
  
  return await sendEmail({ to: email, subject, html, text })
}

// Benachrichtigung über neue Reservierung für Restaurant
export async function sendNewReservationNotification({
  email,
  reservationId,
  customerName,
  customerEmail,
  customerPhone,
  numberOfGuests,
  date,
  time,
  notes,
  specialRequests
}: {
  email: string
  reservationId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  numberOfGuests: number
  date: Date
  time: string
  notes?: string
  specialRequests?: string
}) {
  const formattedDate = new Date(date).toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const subject = `🔔 Neue Reservierung - ${customerName}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
            .info-box { background: #f0fdf4; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🔔 Neue Reservierung eingegangen</h2>
            </div>
            
            <div class="content">
                <div class="info-box">
                    <h3 style="margin-top: 0;">Reservierungsdetails:</h3>
                    <p><strong>ID:</strong> ${reservationId}</p>
                    <p><strong>Name:</strong> ${customerName}</p>
                    <p><strong>E-Mail:</strong> <a href="mailto:${customerEmail}">${customerEmail}</a></p>
                    <p><strong>Telefon:</strong> ${customerPhone}</p>
                    <p><strong>Datum:</strong> ${formattedDate}</p>
                    <p><strong>Uhrzeit:</strong> ${time} Uhr</p>
                    <p><strong>Anzahl Gäste:</strong> ${numberOfGuests}</p>
                    ${notes ? `<p><strong>Anmerkungen:</strong> ${notes}</p>` : ''}
                    ${specialRequests ? `<p><strong>Besondere Wünsche:</strong> ${specialRequests}</p>` : ''}
                </div>
                
                <p style="margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reservations" 
                       style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reservierung anzeigen →
                    </a>
                </p>
            </div>
            
            <div class="footer">
                <p>Diese E-Mail wurde automatisch von Oriido generiert.</p>
            </div>
        </div>
    </body>
    </html>
  `
  
  const text = `
Neue Reservierung eingegangen

Reservierungsdetails:
- ID: ${reservationId}
- Name: ${customerName}
- E-Mail: ${customerEmail}
- Telefon: ${customerPhone}
- Datum: ${formattedDate}
- Uhrzeit: ${time} Uhr
- Anzahl Gäste: ${numberOfGuests}
${notes ? `- Anmerkungen: ${notes}` : ''}
${specialRequests ? `- Besondere Wünsche: ${specialRequests}` : ''}

Bitte bestätigen Sie die Reservierung im Dashboard.
  `
  
  return await sendEmail({ to: email, subject, html, text })
}

// Allgemeine Benachrichtigungs-E-Mail
export async function sendNotificationEmail({
  to,
  subject,
  message,
  restaurantName
}: {
  to: string
  subject: string
  message: string
  restaurantName?: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>${subject}</h2>
            </div>
            
            <div class="content">
                <div style="white-space: pre-wrap;">${message}</div>
                
                ${restaurantName ? `
                <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>
                ${restaurantName}</p>
                ` : ''}
            </div>
            
            <div class="footer">
                <p>Diese E-Mail wurde über Oriido gesendet.</p>
            </div>
        </div>
    </body>
    </html>
  `
  
  return await sendEmail({ 
    to, 
    subject, 
    html, 
    text: message 
  })
}