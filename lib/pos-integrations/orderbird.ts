// Orderbird POS Integration
import { POSAdapter, POSMenuItem, POSCategory, POSSyncResult } from './types'

export class OrderbirdAdapter extends POSAdapter {
  private baseUrl = 'https://api.orderbird.com/v2'

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Orderbird connected to:', data.name)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Orderbird connection error:', error)
      return false
    }
  }

  async syncMenu(): Promise<POSSyncResult> {
    const result: POSSyncResult = {
      success: false,
      imported: 0,
      updated: 0,
      errors: []
    }

    try {
      // Hole alle Artikel von Orderbird
      const itemsResponse = await fetch(`${this.baseUrl}/items`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      })

      if (!itemsResponse.ok) {
        throw new Error(`API Error: ${itemsResponse.status}`)
      }

      const items = await itemsResponse.json()
      
      // Hole alle Kategorien
      const categoriesResponse = await fetch(`${this.baseUrl}/categories`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      })

      const categories = categoriesResponse.ok ? await categoriesResponse.json() : []

      // Konvertiere zu unserem Format
      const posCategories: POSCategory[] = categories.data?.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        sortOrder: cat.position || 0
      })) || []

      const posItems: POSMenuItem[] = items.data?.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: item.price / 100, // Orderbird speichert in Cent
        categoryId: item.category_id,
        image: item.image_url,
        isActive: item.active,
        variants: item.variants?.map((v: any) => ({
          id: v.id,
          name: v.name,
          price: v.price / 100
        })) || [],
        extras: item.options?.map((o: any) => ({
          id: o.id,
          name: o.name,
          price: o.price / 100
        })) || []
      })) || []

      result.categories = posCategories
      result.items = posItems
      result.success = true
      result.imported = posItems.length

      return result
    } catch (error: any) {
      console.error('Orderbird sync error:', error)
      result.errors.push(error.message || 'Unbekannter Fehler')
      return result
    }
  }

  async sendOrder(order: any): Promise<boolean> {
    try {
      // Erstelle Orderbird Bestellung
      const obOrder = {
        table_number: order.tableNumber || null,
        type: this.mapOrderType(order.orderType),
        customer: {
          name: order.customerName || 'Gast',
          email: order.guestEmail || null,
          phone: order.customerPhone || null
        },
        items: order.items.map((item: any) => ({
          item_id: item.posId || null,
          name: item.name,
          quantity: item.quantity,
          unit_price: Math.round(item.unitPrice * 100), // In Cent
          note: item.notes || '',
          variants: item.selectedVariants?.map((v: any) => ({
            variant_id: v.posId,
            name: v.name
          })) || [],
          options: item.selectedExtras?.map((e: any) => ({
            option_id: e.posId,
            name: e.name
          })) || []
        })),
        payment_type: this.mapPaymentType(order.paymentMethod),
        total: Math.round(order.total * 100),
        tip: order.tipAmount ? Math.round(order.tipAmount * 100) : 0,
        external_reference: order.id,
        note: order.notes || ''
      }

      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(obOrder)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Orderbird order created:', data.id)
        return true
      }

      const error = await response.text()
      console.error('Orderbird order error:', error)
      return false
    } catch (error) {
      console.error('Orderbird send order error:', error)
      return false
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      const obStatus = this.mapOrderStatus(status)
      
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ status: obStatus })
      })

      return response.ok
    } catch (error) {
      console.error('Orderbird update status error:', error)
      return false
    }
  }

  async syncTables(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tables`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.data?.map((table: any) => ({
          id: table.id,
          number: table.number,
          name: table.name,
          capacity: table.seats,
          area: table.area
        })) || []
      }

      return []
    } catch (error) {
      console.error('Orderbird table sync error:', error)
      return []
    }
  }

  private mapOrderType(type: string): string {
    const mapping: { [key: string]: string } = {
      'DINE_IN': 'dine-in',
      'TAKEAWAY': 'takeaway',
      'DELIVERY': 'delivery',
      'PICKUP': 'takeaway'
    }
    return mapping[type] || 'dine-in'
  }

  private mapPaymentType(method: string): string {
    const mapping: { [key: string]: string } = {
      'CASH': 'cash',
      'CARD': 'card',
      'ONLINE': 'online',
      'STRIPE': 'card',
      'PAYTABS': 'card'
    }
    return mapping[method] || 'cash'
  }

  private mapOrderStatus(status: string): string {
    const mapping: { [key: string]: string } = {
      'PENDING': 'open',
      'CONFIRMED': 'in_progress',
      'PREPARING': 'in_progress',
      'READY': 'ready',
      'DELIVERED': 'closed',
      'COMPLETED': 'closed',
      'CANCELLED': 'cancelled'
    }
    return mapping[status] || 'open'
  }
}