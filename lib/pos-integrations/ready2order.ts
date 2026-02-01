// Ready2Order POS Integration
import { POSAdapter, POSMenuItem, POSCategory, POSSyncResult } from './types'

export class Ready2OrderAdapter extends POSAdapter {
  private baseUrl = 'https://api.ready2order.com/v1'

  async testConnection(): Promise<boolean> {
    try {
      // Use /products endpoint instead of /company which requires internal Account-Tokens
      const response = await fetch(`${this.baseUrl}/products?limit=1`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Ready2Order connection successful, found', Array.isArray(data) ? data.length : 0, 'products')
        return true
      }

      const errorText = await response.text()
      console.error('Ready2Order connection failed:', response.status, errorText)
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
      // Fetch all products from ready2order
      console.log('Fetching products from Ready2Order...')
      const productsResponse = await fetch(`${this.baseUrl}/products`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      })

      if (!productsResponse.ok) {
        const errorText = await productsResponse.text()
        throw new Error(`Products API Error: ${productsResponse.status} - ${errorText}`)
      }

      const products = await productsResponse.json()
      console.log(`Ready2Order: Found ${Array.isArray(products) ? products.length : 0} products`)

      // Fetch all product groups (categories)
      console.log('Fetching product groups from Ready2Order...')
      const groupsResponse = await fetch(`${this.baseUrl}/productgroups`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      })

      let groups: any[] = []
      if (groupsResponse.ok) {
        groups = await groupsResponse.json()
        console.log(`Ready2Order: Found ${Array.isArray(groups) ? groups.length : 0} product groups`)
      } else {
        console.warn('Ready2Order: Could not fetch product groups, using embedded group data from products')
      }

      // Convert to our format - handle both flat response and nested productgroup
      const categories: POSCategory[] = groups.map((group: any) => ({
        id: (group.productgroup_id || group.id)?.toString(),
        name: group.name,
        sortOrder: group.position || group.sort || 0
      }))

      // ready2order returns prices in euros (not cents), e.g., 4.5 for €4.50
      const items: POSMenuItem[] = products.map((product: any) => {
        // Extract category ID from various possible locations
        const categoryId = (
          product.productgroup_id ||
          product.productgroup?.productgroup_id ||
          product.productgroup?.id
        )?.toString()

        return {
          id: (product.product_id || product.id)?.toString(),
          name: product.name,
          description: product.description || '',
          price: parseFloat(product.price) || 0, // Price is already in euros
          categoryId,
          image: product.image_url || product.image,
          isActive: product.active === 1 || product.active === true,
          variants: (product.variations || product.variants || []).map((v: any) => ({
            id: (v.variation_id || v.id)?.toString(),
            name: v.name,
            price: parseFloat(v.price) || 0
          })),
          extras: (product.extras || []).map((e: any) => ({
            id: (e.extra_id || e.id)?.toString(),
            name: e.name,
            price: parseFloat(e.price) || 0
          }))
        }
      })

      console.log(`Ready2Order sync complete: ${items.length} items, ${categories.length} categories`)

      // Log a sample item for debugging
      if (items.length > 0) {
        console.log('Sample item:', JSON.stringify(items[0], null, 2))
      }

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
      // Create ready2order order - prices are in euros (same as API responses)
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
          price: item.unitPrice, // Price in euros
          comment: item.notes || '',
          variations: item.selectedVariants?.map((v: any) => ({
            variation_id: v.posId,
            name: v.name,
            price: v.price // Price in euros
          })) || [],
          extras: item.selectedExtras?.map((e: any) => ({
            extra_id: e.posId,
            name: e.name,
            price: e.price // Price in euros
          })) || []
        })),
        payment_method: this.mapPaymentMethod(order.paymentMethod),
        total_amount: order.total, // Total in euros
        tip_amount: order.tipAmount || 0,
        external_id: order.id,
        notes: order.notes || ''
      }

      console.log('Sending order to Ready2Order:', JSON.stringify(r2oOrder, null, 2))

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
        console.log('Ready2Order order created:', data.order_id || data.id)
        return true
      }

      const errorText = await response.text()
      console.error('Ready2Order order error:', response.status, errorText)
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