// Ready2Order POS Integration
import { POSAdapter, POSMenuItem, POSCategory, POSSyncResult } from './types'

export class Ready2OrderAdapter extends POSAdapter {
  private baseUrl = 'https://api.ready2order.com/v1'

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/company`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Ready2Order connected to:', data.name)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Ready2Order connection error:', error)
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
      // Hole alle Produkte von ready2order
      const productsResponse = await fetch(`${this.baseUrl}/products`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      })

      if (!productsResponse.ok) {
        throw new Error(`API Error: ${productsResponse.status}`)
      }

      const products = await productsResponse.json()
      
      // Hole alle Produktgruppen (Kategorien)
      const groupsResponse = await fetch(`${this.baseUrl}/productgroups`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      })

      const groups = groupsResponse.ok ? await groupsResponse.json() : []

      // Konvertiere zu unserem Format
      const categories: POSCategory[] = groups.map((group: any) => ({
        id: group.productgroup_id,
        name: group.name,
        sortOrder: group.position || 0
      }))

      const items: POSMenuItem[] = products.map((product: any) => ({
        id: product.product_id,
        name: product.name,
        description: product.description || '',
        price: product.price / 100, // ready2order speichert in Cent
        categoryId: product.productgroup_id,
        image: product.image_url,
        isActive: product.active === 1,
        variants: product.variations?.map((v: any) => ({
          id: v.variation_id,
          name: v.name,
          price: v.price / 100
        })) || [],
        extras: product.extras?.map((e: any) => ({
          id: e.extra_id,
          name: e.name,
          price: e.price / 100
        })) || []
      }))

      result.categories = categories
      result.items = items
      result.success = true
      result.imported = items.length

      return result
    } catch (error: any) {
      console.error('Ready2Order sync error:', error)
      result.errors.push(error.message || 'Unbekannter Fehler')
      return result
    }
  }

  async sendOrder(order: any): Promise<boolean> {
    try {
      // Erstelle ready2order Bestellung
      const r2oOrder = {
        table_id: order.tableNumber ? parseInt(order.tableNumber) : null,
        order_type: order.orderType || 'dine_in',
        customer: {
          name: order.customerName || 'Gast',
          email: order.guestEmail || null,
          phone: order.customerPhone || null
        },
        items: order.items.map((item: any) => ({
          product_id: item.posId || null,
          name: item.name,
          quantity: item.quantity,
          price: Math.round(item.unitPrice * 100), // In Cent
          comment: item.notes || '',
          variations: item.selectedVariants?.map((v: any) => ({
            variation_id: v.posId,
            name: v.name,
            price: Math.round(v.price * 100)
          })) || [],
          extras: item.selectedExtras?.map((e: any) => ({
            extra_id: e.posId,
            name: e.name,
            price: Math.round(e.price * 100)
          })) || []
        })),
        payment_method: this.mapPaymentMethod(order.paymentMethod),
        total_amount: Math.round(order.total * 100),
        tip_amount: order.tipAmount ? Math.round(order.tipAmount * 100) : 0,
        external_id: order.id,
        notes: order.notes || ''
      }

      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(r2oOrder)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Ready2Order order created:', data.order_id)
        return true
      }

      const error = await response.text()
      console.error('Ready2Order order error:', error)
      return false
    } catch (error) {
      console.error('Ready2Order send order error:', error)
      return false
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      const r2oStatus = this.mapOrderStatus(status)
      
      const response = await fetch(`${this.baseUrl}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ status: r2oStatus })
      })

      return response.ok
    } catch (error) {
      console.error('Ready2Order update status error:', error)
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
        const tables = await response.json()
        return tables.map((table: any) => ({
          id: table.table_id,
          number: table.number,
          name: table.name,
          capacity: table.seats,
          area: table.area_name
        }))
      }

      return []
    } catch (error) {
      console.error('Ready2Order table sync error:', error)
      return []
    }
  }

  private mapPaymentMethod(method: string): string {
    const mapping: { [key: string]: string } = {
      'CASH': 'cash',
      'CARD': 'card', 
      'ONLINE': 'online',
      'STRIPE': 'card',
      'PAYTABS': 'card'
    }
    return mapping[method] || 'other'
  }

  private mapOrderStatus(status: string): string {
    const mapping: { [key: string]: string } = {
      'PENDING': 'new',
      'CONFIRMED': 'in_progress',
      'PREPARING': 'in_progress',
      'READY': 'ready',
      'DELIVERED': 'completed',
      'COMPLETED': 'completed',
      'CANCELLED': 'cancelled'
    }
    return mapping[status] || 'new'
  }
}