import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { 
  sendWelcomeEmail, 
  sendNewOrderNotification, 
  sendOrderConfirmation,
  sendOrderStatusUpdate 
} from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }
    
    const { email, type } = await req.json()
    
    if (!email || !type) {
      return NextResponse.json({ error: 'E-Mail und Typ erforderlich' }, { status: 400 })
    }
    
    // Test-Daten für verschiedene E-Mail-Typen
    switch (type) {
      case 'welcome':
        await sendWelcomeEmail({
          email,
          name: 'Test User',
          restaurantName: 'Test Restaurant'
        })
        break
        
      case 'new-order':
        await sendNewOrderNotification({
          email,
          orderNumber: '20240101001',
          tableNumber: 42,
          items: [
            { name: 'Pizza Margherita', quantity: 2, price: 12.50 },
            { name: 'Pasta Carbonara', quantity: 1, price: 14.90 },
            { name: 'Tiramisu', quantity: 2, price: 6.50 }
          ],
          total: 52.90
        })
        break
        
      case 'order-confirmation':
        await sendOrderConfirmation({
          email,
          orderNumber: '20240101001',
          restaurantName: 'Test Restaurant',
          tableNumber: 42,
          items: [
            { name: 'Pizza Margherita', quantity: 2, price: 12.50 },
            { name: 'Pasta Carbonara', quantity: 1, price: 14.90 },
            { name: 'Tiramisu', quantity: 2, price: 6.50 }
          ],
          subtotal: 44.45,
          tax: 8.45,
          total: 52.90
        })
        break
        
      case 'order-status':
        await sendOrderStatusUpdate({
          email,
          orderNumber: '20240101001',
          restaurantName: 'Test Restaurant',
          status: 'PREPARING',
          estimatedTime: 15
        })
        break
        
      default:
        return NextResponse.json({ error: 'Ungültiger E-Mail-Typ' }, { status: 400 })
    }
    
    return NextResponse.json({ success: true, message: `Test-E-Mail "${type}" wurde gesendet` })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Fehler beim Senden der Test-E-Mail' },
      { status: 500 }
    )
  }
}