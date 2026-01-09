import { prisma } from '@/lib/prisma'
import { Order, OrderItem, Restaurant, Invoice } from '@prisma/client'

interface OrderWithItems extends Order {
  items: OrderItem[]
  restaurant: Restaurant & {
    settings: any
  }
}

export class InvoiceService {
  static async createInvoice(orderId: string): Promise<Invoice> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        restaurant: {
          include: {
            settings: true
          }
        }
      }
    }) as OrderWithItems | null

    if (!order) {
      throw new Error('Order not found')
    }

    // Check if invoice already exists
    const existingInvoice = await prisma.invoice.findFirst({
      where: { orderId }
    })

    if (existingInvoice) {
      return existingInvoice
    }

    // Calculate tax based on restaurant settings
    const taxRate = order.restaurant.settings?.taxRate || 19
    const includeTax = order.restaurant.settings?.includeTax ?? true

    let subtotal = order.subtotal
    let tax = 0
    let tip = order.tip || 0

    if (includeTax) {
      // Prices include tax - extract tax amount
      tax = subtotal - (subtotal / (1 + taxRate / 100))
      subtotal = subtotal - tax
    } else {
      // Prices exclude tax - add tax
      tax = subtotal * (taxRate / 100)
    }

    const total = subtotal + tax + tip

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(order.restaurantId)

    // Create invoice items
    const invoiceItems = order.items.map(item => {
      const itemTotal = item.totalPrice
      const itemTax = includeTax 
        ? itemTotal - (itemTotal / (1 + taxRate / 100))
        : itemTotal * (taxRate / 100)

      return {
        name: item.name,
        quantity: item.quantity,
        price: item.unitPrice,
        total: itemTotal,
        tax: itemTax
      }
    })

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        restaurantId: order.restaurantId,
        orderId: order.id,
        subtotal,
        taxRate,
        tax,
        tip,
        total,
        status: order.paymentStatus === 'PAID' ? 'PAID' : 'DRAFT',
        dueDate: new Date(),
        paidAt: order.paidAt,
        paymentMethod: order.paymentMethod,
        items: invoiceItems,
        customerName: order.guestName,
        customerEmail: order.customerEmail || order.guestEmail,
        customerPhone: order.customerPhone || order.guestPhone
      }
    })

    return invoice
  }

  static async generateInvoiceNumber(restaurantId: string): Promise<string> {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    
    // Get the last invoice for this restaurant in this month
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        restaurantId,
        invoiceNumber: {
          startsWith: `INV-${year}${month}`
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    let sequence = 1
    if (lastInvoice) {
      const lastNumber = lastInvoice.invoiceNumber.split('-').pop()
      sequence = (parseInt(lastNumber || '0') || 0) + 1
    }

    return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`
  }

  static calculateTax(amount: number, taxRate: number, includeTax: boolean): { subtotal: number; tax: number; total: number } {
    let subtotal = amount
    let tax = 0
    
    if (includeTax) {
      // Price includes tax
      tax = amount - (amount / (1 + taxRate / 100))
      subtotal = amount - tax
    } else {
      // Price excludes tax
      tax = amount * (taxRate / 100)
    }
    
    const total = subtotal + tax

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100
    }
  }

  static calculateWithTip(subtotal: number, tax: number, tipPercent: number): { tip: number; total: number } {
    const baseAmount = subtotal + tax
    const tip = baseAmount * (tipPercent / 100)
    const total = baseAmount + tip

    return {
      tip: Math.round(tip * 100) / 100,
      total: Math.round(total * 100) / 100
    }
  }

  static async generatePDF(invoiceId: string): Promise<Buffer> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        restaurant: true,
        order: true
      }
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    // TODO: Implement PDF generation using a library like puppeteer or react-pdf
    // For now, return a placeholder
    return Buffer.from('PDF content would be here')
  }

  static async sendInvoiceEmail(invoiceId: string): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        restaurant: true
      }
    })

    if (!invoice || !invoice.customerEmail) {
      throw new Error('Invoice or customer email not found')
    }

    // TODO: Implement email sending using Resend
    // const pdf = await this.generatePDF(invoiceId)
    // await sendEmail({
    //   to: invoice.customerEmail,
    //   subject: `Rechnung ${invoice.invoiceNumber} - ${invoice.restaurant.name}`,
    //   template: 'invoice',
    //   data: invoice,
    //   attachments: [{
    //     filename: `${invoice.invoiceNumber}.pdf`,
    //     content: pdf
    //   }]
    // })
  }
}