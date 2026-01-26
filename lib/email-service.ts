// Email service for order notifications and system emails
// This is a placeholder - implement with your preferred email service (SendGrid, Resend, etc.)

interface EmailOptions {
  order: any
  restaurant: any
  customerEmail?: string
}

interface ApprovalEmailOptions {
  to: string
  restaurantName: string
  ownerName: string
}

interface RejectionEmailOptions {
  to: string
  restaurantName: string
  ownerName: string
  reason?: string
}

interface NewRegistrationEmailOptions {
  adminEmail: string
  restaurantName: string
  ownerName: string
  ownerEmail: string
}

export async function sendOrderEmails({ order, restaurant, customerEmail }: EmailOptions) {
  try {
    // Importiere Templates und SendGrid
    const { getNewOrderTemplate } = await import('./email-templates')
    const { sendEmail } = await import('./email-sendgrid')
    
    const lang = (restaurant.language || 'de') as any
    
    // Bereite Bestelldaten auf
    const orderData = {
      restaurantName: restaurant.name,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber || order.table?.number,
      items: order.items || [],
      total: order.total || 0,
      customerName: order.guestName || order.customerName,
      customerPhone: order.guestPhone || order.customerPhone,
      notes: order.notes
    }
    
    const template = getNewOrderTemplate(lang, orderData)
    
    // Sende an Restaurant
    if (restaurant.email) {
      await sendEmail({
        to: restaurant.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
      console.log(`Order email sent in ${lang} to restaurant:`, restaurant.email)
    }
    
    // Sende an Kunde (in gleicher Sprache wie Restaurant)
    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
      console.log(`Order email sent in ${lang} to customer:`, customerEmail)
    }
    
    return true
  } catch (error) {
    console.error('Error sending emails:', error)
    throw error
  }
}

// Send approval email to restaurant owner
export async function sendApprovalEmail({ to, restaurantName, ownerName }: ApprovalEmailOptions) {
  try {
    // Importiere Templates und Hilfsfunktionen
    const { getApprovalTemplate, getRestaurantLanguage } = await import('./email-templates')
    const { sendEmail } = await import('./email-sendgrid')
    const { prisma } = await import('./prisma')
    
    // Hole Restaurant-Sprache
    const restaurant = await prisma.restaurant.findFirst({
      where: { name: restaurantName },
      select: { language: true, id: true }
    })
    
    const lang = (restaurant?.language || 'de') as any
    const template = getApprovalTemplate(lang, { restaurantName, ownerName })
    
    // Sende E-Mail
    await sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
    
    console.log(`Approval email sent in ${lang} to:`, to)
    return true
  } catch (error) {
    console.error('Error sending approval email:', error)
    throw error
  }
}

// Send rejection email to restaurant owner
export async function sendRejectionEmail({ to, restaurantName, ownerName, reason }: RejectionEmailOptions) {
  try {
    console.log('Rejection email would be sent here:', {
      to,
      restaurantName,
      ownerName,
      reason
    })
    
    // TODO: Implement actual email sending
    /*
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    await resend.emails.send({
      from: 'Oriido <noreply@oriido.com>',
      to,
      subject: `Registrierung für ${restaurantName}`,
      html: `
        <h2>Hallo ${ownerName},</h2>
        <p>Vielen Dank für Ihr Interesse an Oriido.</p>
        <p>Leider können wir Ihre Registrierung für "${restaurantName}" derzeit nicht freigeben.</p>
        ${reason ? `<p>Begründung: ${reason}</p>` : ''}
        <p>Falls Sie Fragen haben oder weitere Informationen benötigen, kontaktieren Sie uns bitte unter support@oriido.com.</p>
        <p>Mit freundlichen Grüßen,<br>Ihr Oriido Team</p>
      `
    })
    */
    
    return true
  } catch (error) {
    console.error('Error sending rejection email:', error)
    throw error
  }
}

// Send notification email to admin about new registration
export async function sendNewRegistrationEmail({ adminEmail, restaurantName, ownerName, ownerEmail }: NewRegistrationEmailOptions) {
  try {
    console.log('New registration email would be sent to admin:', {
      adminEmail,
      restaurantName,
      ownerName,
      ownerEmail
    })
    
    // TODO: Implement actual email sending
    /*
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    await resend.emails.send({
      from: 'Oriido System <system@oriido.com>',
      to: adminEmail,
      subject: `Neue Restaurant-Registrierung: ${restaurantName}`,
      html: `
        <h2>Neue Restaurant-Registrierung</h2>
        <p>Ein neues Restaurant wurde registriert und wartet auf Freigabe:</p>
        <ul>
          <li><strong>Restaurant:</strong> ${restaurantName}</li>
          <li><strong>Besitzer:</strong> ${ownerName}</li>
          <li><strong>E-Mail:</strong> ${ownerEmail}</li>
        </ul>
        <p>Bitte melden Sie sich an, um die Registrierung zu überprüfen und freizugeben:</p>
        <a href="https://oriido.com/admin/approvals" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Zur Freigabe</a>
      `
    })
    */
    
    return true
  } catch (error) {
    console.error('Error sending new registration email:', error)
    throw error
  }
}

export async function sendOrderStatusUpdate(order: any, newStatus: string) {
  console.log('Order status update email would be sent here:', {
    orderNumber: order.orderNumber,
    newStatus
  })
  // TODO: Implement
}