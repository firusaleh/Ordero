// Mehrsprachige E-Mail-Templates
export type Language = 'de' | 'en' | 'ar'

interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

// Template für neue Bestellung
export function getNewOrderTemplate(
  lang: Language,
  data: {
    restaurantName: string
    orderNumber: string
    tableNumber?: string
    items: any[]
    total: number
    customerName?: string
    customerPhone?: string
    notes?: string
  }
): EmailTemplate {
  const templates = {
    de: {
      subject: `Neue Bestellung ${data.orderNumber} - ${data.restaurantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🛍️ Neue Bestellung eingegangen!</h2>
          <p>Bestellnummer: <strong>${data.orderNumber}</strong></p>
          ${data.tableNumber ? `<p>Tisch: <strong>${data.tableNumber}</strong></p>` : '<p>Art: <strong>Abholung</strong></p>'}
          ${data.customerName ? `<p>Kunde: ${data.customerName}</p>` : ''}
          ${data.customerPhone ? `<p>Telefon: ${data.customerPhone}</p>` : ''}
          
          <h3>Bestellte Artikel:</h3>
          <ul>
            ${data.items.map(item => `
              <li>${item.quantity}x ${item.name} - ${item.price.toFixed(2)} €</li>
            `).join('')}
          </ul>
          
          <p><strong>Gesamtbetrag: ${data.total.toFixed(2)} €</strong></p>
          ${data.notes ? `<p>Notizen: ${data.notes}</p>` : ''}
          
          <hr style="margin: 20px 0;">
          <p style="color: #666;">Diese E-Mail wurde automatisch von Oriido gesendet.</p>
        </div>
      `
    },
    en: {
      subject: `New Order ${data.orderNumber} - ${data.restaurantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🛍️ New Order Received!</h2>
          <p>Order Number: <strong>${data.orderNumber}</strong></p>
          ${data.tableNumber ? `<p>Table: <strong>${data.tableNumber}</strong></p>` : '<p>Type: <strong>Takeaway</strong></p>'}
          ${data.customerName ? `<p>Customer: ${data.customerName}</p>` : ''}
          ${data.customerPhone ? `<p>Phone: ${data.customerPhone}</p>` : ''}
          
          <h3>Ordered Items:</h3>
          <ul>
            ${data.items.map(item => `
              <li>${item.quantity}x ${item.name} - €${item.price.toFixed(2)}</li>
            `).join('')}
          </ul>
          
          <p><strong>Total: €${data.total.toFixed(2)}</strong></p>
          ${data.notes ? `<p>Notes: ${data.notes}</p>` : ''}
          
          <hr style="margin: 20px 0;">
          <p style="color: #666;">This email was sent automatically by Oriido.</p>
        </div>
      `
    },
    ar: {
      subject: `طلب جديد ${data.orderNumber} - ${data.restaurantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; text-align: right;">
          <h2>🛍️ تم استلام طلب جديد!</h2>
          <p>رقم الطلب: <strong>${data.orderNumber}</strong></p>
          ${data.tableNumber ? `<p>الطاولة: <strong>${data.tableNumber}</strong></p>` : '<p>النوع: <strong>سفري</strong></p>'}
          ${data.customerName ? `<p>العميل: ${data.customerName}</p>` : ''}
          ${data.customerPhone ? `<p>الهاتف: ${data.customerPhone}</p>` : ''}
          
          <h3>المواد المطلوبة:</h3>
          <ul>
            ${data.items.map(item => `
              <li>${item.quantity}x ${item.name} - ${item.price.toFixed(2)} €</li>
            `).join('')}
          </ul>
          
          <p><strong>المجموع: ${data.total.toFixed(2)} €</strong></p>
          ${data.notes ? `<p>ملاحظات: ${data.notes}</p>` : ''}
          
          <hr style="margin: 20px 0;">
          <p style="color: #666;">تم إرسال هذا البريد الإلكتروني تلقائيًا من Oriido.</p>
        </div>
      `
    }
  }
  
  return templates[lang]
}

// Template für Restaurant-Freigabe
export function getApprovalTemplate(
  lang: Language,
  data: {
    restaurantName: string
    ownerName: string
  }
): EmailTemplate {
  const templates = {
    de: {
      subject: `${data.restaurantName} wurde freigegeben!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🎉 Herzlichen Glückwunsch, ${data.ownerName}!</h2>
          <p>Ihr Restaurant "<strong>${data.restaurantName}</strong>" wurde erfolgreich freigegeben.</p>
          <p>Sie können sich jetzt anmelden und mit der Verwaltung Ihres Restaurants beginnen:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://oriido.com/login" style="display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Jetzt anmelden</a>
          </div>
          <p>Ihre 30-tägige kostenlose Testphase beginnt heute.</p>
          <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung unter support@oriido.com</p>
          <hr style="margin: 20px 0;">
          <p>Mit freundlichen Grüßen,<br>Ihr Oriido Team</p>
        </div>
      `
    },
    en: {
      subject: `${data.restaurantName} has been approved!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🎉 Congratulations, ${data.ownerName}!</h2>
          <p>Your restaurant "<strong>${data.restaurantName}</strong>" has been successfully approved.</p>
          <p>You can now log in and start managing your restaurant:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://oriido.com/login" style="display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Login Now</a>
          </div>
          <p>Your 30-day free trial starts today.</p>
          <p>If you have any questions, please contact us at support@oriido.com</p>
          <hr style="margin: 20px 0;">
          <p>Best regards,<br>Your Oriido Team</p>
        </div>
      `
    },
    ar: {
      subject: `تمت الموافقة على ${data.restaurantName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; text-align: right;">
          <h2>🎉 تهانينا، ${data.ownerName}!</h2>
          <p>تمت الموافقة على مطعمك "<strong>${data.restaurantName}</strong>" بنجاح.</p>
          <p>يمكنك الآن تسجيل الدخول والبدء في إدارة مطعمك:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://oriido.com/login" style="display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">تسجيل الدخول الآن</a>
          </div>
          <p>تبدأ فترة تجربتك المجانية لمدة 30 يومًا اليوم.</p>
          <p>إذا كان لديك أي أسئلة، يرجى الاتصال بنا على support@oriido.com</p>
          <hr style="margin: 20px 0;">
          <p>مع أطيب التحيات،<br>فريق Oriido</p>
        </div>
      `
    }
  }
  
  return templates[lang]
}

// Template für Reservierungsbestätigung
export function getReservationConfirmationTemplate(
  lang: Language,
  data: {
    restaurantName: string
    customerName: string
    date: string
    time: string
    guests: number
    confirmationCode: string
  }
): EmailTemplate {
  const templates = {
    de: {
      subject: `Reservierung bestätigt - ${data.restaurantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>✅ Reservierung bestätigt</h2>
          <p>Hallo ${data.customerName},</p>
          <p>Ihre Reservierung bei <strong>${data.restaurantName}</strong> wurde bestätigt.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Reservierungsdetails:</h3>
            <p><strong>Datum:</strong> ${data.date}</p>
            <p><strong>Zeit:</strong> ${data.time}</p>
            <p><strong>Anzahl Gäste:</strong> ${data.guests}</p>
            <p><strong>Bestätigungscode:</strong> <span style="font-size: 20px; font-weight: bold; color: #3b82f6;">${data.confirmationCode}</span></p>
          </div>
          
          <p>Bitte zeigen Sie diesen Bestätigungscode bei Ihrer Ankunft vor.</p>
          <p>Wir freuen uns auf Ihren Besuch!</p>
          
          <hr style="margin: 20px 0;">
          <p style="color: #666;">Diese E-Mail wurde automatisch von Oriido gesendet.</p>
        </div>
      `
    },
    en: {
      subject: `Reservation Confirmed - ${data.restaurantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>✅ Reservation Confirmed</h2>
          <p>Hello ${data.customerName},</p>
          <p>Your reservation at <strong>${data.restaurantName}</strong> has been confirmed.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Reservation Details:</h3>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>Number of Guests:</strong> ${data.guests}</p>
            <p><strong>Confirmation Code:</strong> <span style="font-size: 20px; font-weight: bold; color: #3b82f6;">${data.confirmationCode}</span></p>
          </div>
          
          <p>Please show this confirmation code upon arrival.</p>
          <p>We look forward to seeing you!</p>
          
          <hr style="margin: 20px 0;">
          <p style="color: #666;">This email was sent automatically by Oriido.</p>
        </div>
      `
    },
    ar: {
      subject: `تأكيد الحجز - ${data.restaurantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; text-align: right;">
          <h2>✅ تم تأكيد الحجز</h2>
          <p>مرحباً ${data.customerName}،</p>
          <p>تم تأكيد حجزك في <strong>${data.restaurantName}</strong>.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">تفاصيل الحجز:</h3>
            <p><strong>التاريخ:</strong> ${data.date}</p>
            <p><strong>الوقت:</strong> ${data.time}</p>
            <p><strong>عدد الضيوف:</strong> ${data.guests}</p>
            <p><strong>رمز التأكيد:</strong> <span style="font-size: 20px; font-weight: bold; color: #3b82f6;">${data.confirmationCode}</span></p>
          </div>
          
          <p>يرجى إظهار رمز التأكيد هذا عند وصولك.</p>
          <p>نتطلع لرؤيتك!</p>
          
          <hr style="margin: 20px 0;">
          <p style="color: #666;">تم إرسال هذا البريد الإلكتروني تلقائيًا من Oriido.</p>
        </div>
      `
    }
  }
  
  return templates[lang]
}

// Template für Status-Updates
export function getOrderStatusTemplate(
  lang: Language,
  data: {
    restaurantName: string
    orderNumber: string
    status: string
    customerName?: string
  }
): EmailTemplate {
  const statusLabels = {
    de: {
      CONFIRMED: 'bestätigt',
      PREPARING: 'wird zubereitet',
      READY: 'fertig zur Abholung',
      DELIVERED: 'ausgeliefert',
      CANCELLED: 'storniert'
    },
    en: {
      CONFIRMED: 'confirmed',
      PREPARING: 'being prepared',
      READY: 'ready for pickup',
      DELIVERED: 'delivered',
      CANCELLED: 'cancelled'
    },
    ar: {
      CONFIRMED: 'مؤكد',
      PREPARING: 'قيد التحضير',
      READY: 'جاهز للاستلام',
      DELIVERED: 'تم التسليم',
      CANCELLED: 'ملغى'
    }
  }

  const statusLabel = statusLabels[lang][data.status as keyof typeof statusLabels.de] || data.status

  const templates = {
    de: {
      subject: `Bestellung ${data.orderNumber} - Status: ${statusLabel}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>📦 Bestellstatus-Update</h2>
          ${data.customerName ? `<p>Hallo ${data.customerName},</p>` : ''}
          <p>Ihre Bestellung <strong>${data.orderNumber}</strong> bei ${data.restaurantName} wurde aktualisiert.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="font-size: 18px; margin: 0;">Status:</p>
            <p style="font-size: 24px; font-weight: bold; color: #3b82f6; margin: 10px 0;">${statusLabel.toUpperCase()}</p>
          </div>
          
          ${data.status === 'READY' ? '<p>Ihre Bestellung ist fertig und kann abgeholt werden!</p>' : ''}
          ${data.status === 'CANCELLED' ? '<p>Ihre Bestellung wurde leider storniert. Bei Fragen kontaktieren Sie bitte das Restaurant.</p>' : ''}
          
          <hr style="margin: 20px 0;">
          <p style="color: #666;">Diese E-Mail wurde automatisch von Oriido gesendet.</p>
        </div>
      `
    },
    en: {
      subject: `Order ${data.orderNumber} - Status: ${statusLabel}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>📦 Order Status Update</h2>
          ${data.customerName ? `<p>Hello ${data.customerName},</p>` : ''}
          <p>Your order <strong>${data.orderNumber}</strong> at ${data.restaurantName} has been updated.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="font-size: 18px; margin: 0;">Status:</p>
            <p style="font-size: 24px; font-weight: bold; color: #3b82f6; margin: 10px 0;">${statusLabel.toUpperCase()}</p>
          </div>
          
          ${data.status === 'READY' ? '<p>Your order is ready for pickup!</p>' : ''}
          ${data.status === 'CANCELLED' ? '<p>Your order has been cancelled. Please contact the restaurant if you have any questions.</p>' : ''}
          
          <hr style="margin: 20px 0;">
          <p style="color: #666;">This email was sent automatically by Oriido.</p>
        </div>
      `
    },
    ar: {
      subject: `الطلب ${data.orderNumber} - الحالة: ${statusLabel}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; text-align: right;">
          <h2>📦 تحديث حالة الطلب</h2>
          ${data.customerName ? `<p>مرحباً ${data.customerName}،</p>` : ''}
          <p>تم تحديث طلبك <strong>${data.orderNumber}</strong> في ${data.restaurantName}.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="font-size: 18px; margin: 0;">الحالة:</p>
            <p style="font-size: 24px; font-weight: bold; color: #3b82f6; margin: 10px 0;">${statusLabel}</p>
          </div>
          
          ${data.status === 'READY' ? '<p>طلبك جاهز للاستلام!</p>' : ''}
          ${data.status === 'CANCELLED' ? '<p>تم إلغاء طلبك. يرجى الاتصال بالمطعم إذا كان لديك أي أسئلة.</p>' : ''}
          
          <hr style="margin: 20px 0;">
          <p style="color: #666;">تم إرسال هذا البريد الإلكتروني تلقائيًا من Oriido.</p>
        </div>
      `
    }
  }
  
  return templates[lang]
}

// Hilfsfunktion um Sprache aus Restaurant zu bekommen
export async function getRestaurantLanguage(restaurantId: string): Promise<Language> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { language: true }
    })
    return (restaurant?.language || 'de') as Language
  } catch {
    return 'de' // Fallback zu Deutsch
  }
}