import { Resend } from 'resend'
import { WelcomeEmail } from '@/emails/welcome'
import { NewOrderEmail } from '@/emails/new-order'
import { OrderConfirmationEmail } from '@/emails/order-confirmation'
import { OrderStatusUpdateEmail } from '@/emails/order-status-update'

// Initialisiere Resend mit API Key
const resend = new Resend(process.env.RESEND_API_KEY || 'test_key')

// E-Mail Konfiguration
const FROM_EMAIL = process.env.EMAIL_FROM || 'Oriido <noreply@oriido.de>'
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'support@oriido.de'

// Helper-Funktion für E-Mail-Versand
async function sendEmail({
  to,
  subject,
  react,
  text,
  attachments
}: {
  to: string | string[]
  subject: string
  react?: React.ReactElement
  text?: string
  attachments?: any[]
}) {
  try {
    // In Entwicklung: Log statt senden
    if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
      console.log('📧 E-Mail würde gesendet werden:')
      console.log('An:', to)
      console.log('Betreff:', subject)
      console.log('Text:', text)
      return { success: true, id: 'dev-mock-id' }
    }

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      replyTo: REPLY_TO,
      subject,
      react,
      text,
      attachments
    })

    return { success: true, data }
  } catch (error) {
    console.error('E-Mail-Versand fehlgeschlagen:', error)
    return { success: false, error }
  }
}

// Willkommens-E-Mail für neue Restaurants
export async function sendWelcomeEmail({
  email,
  name,
  restaurantName
}: {
  email: string
  name: string
  restaurantName: string
}) {
  return await sendEmail({
    to: email,
    subject: `Willkommen bei Oriido, ${restaurantName}!`,
    react: WelcomeEmail({ name, restaurantName }),
    text: `Willkommen bei Oriido! Ihr Restaurant ${restaurantName} ist jetzt bereit. Besuchen Sie ${process.env.NEXT_PUBLIC_APP_URL}/dashboard um loszulegen.`
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
  const itemsList = items.map(item => `${item.quantity}x ${item.name}`).join(', ')
  
  return await sendEmail({
    to: email,
    subject: `🔔 Neue Bestellung #${orderNumber} - Tisch ${tableNumber}`,
    react: NewOrderEmail({
      orderNumber,
      tableNumber,
      items,
      total,
      customerName,
      notes
    }),
    text: `Neue Bestellung eingegangen! Bestellung #${orderNumber} von Tisch ${tableNumber}. Artikel: ${itemsList}. Summe: €${total.toFixed(2)}`
  })
}

// Bestellbestätigung für Gäste
export async function sendOrderConfirmation({
  email,
  orderNumber,
  restaurantName,
  tableNumber,
  items,
  subtotal,
  tax,
  total
}: {
  email: string
  orderNumber: string
  restaurantName: string
  tableNumber: number
  items: Array<{ name: string; quantity: number; price: number }>
  subtotal: number
  tax: number
  total: number
}) {
  return await sendEmail({
    to: email,
    subject: `Bestellbestätigung #${orderNumber} - ${restaurantName}`,
    react: OrderConfirmationEmail({
      orderNumber,
      restaurantName,
      tableNumber,
      items,
      subtotal,
      tax,
      total
    }),
    text: `Ihre Bestellung #${orderNumber} bei ${restaurantName} wurde erfolgreich aufgegeben. Summe: €${total.toFixed(2)}`
  })
}

// Status-Update E-Mail für Gäste
export async function sendOrderStatusUpdate({
  email,
  orderNumber,
  restaurantName,
  status,
  estimatedTime
}: {
  email: string
  orderNumber: string
  restaurantName: string
  status: 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
  estimatedTime?: number
}) {
  const statusText = {
    CONFIRMED: 'bestätigt',
    PREPARING: 'wird zubereitet',
    READY: 'ist fertig',
    DELIVERED: 'wurde serviert',
    CANCELLED: 'wurde storniert'
  }[status]

  return await sendEmail({
    to: email,
    subject: `Bestellung #${orderNumber} ${statusText}`,
    react: OrderStatusUpdateEmail({
      orderNumber,
      restaurantName,
      status,
      statusText,
      estimatedTime
    }),
    text: `Ihre Bestellung #${orderNumber} bei ${restaurantName} ${statusText}.`
  })
}

// Batch-E-Mail für mehrere Empfänger
export async function sendBatchEmails(emails: Array<{
  to: string
  subject: string
  react: React.ReactElement
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