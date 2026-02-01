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
      // Fetch all products from ready2order with productgroup included
      console.log('Fetching products from Ready2Order...')
      const productsResponse = await fetch(`${this.baseUrl}/products?include=productgroup`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      })

      if (!productsResponse.ok) {
        const errorText = await productsResponse.text()
        throw new Error(`Products API Error: ${productsResponse.status} - ${errorText}`)
      }

      const productsRaw = await productsResponse.json()

      // Handle different response formats (array or wrapped in object)
      let products: any[] = []
      if (Array.isArray(productsRaw)) {
        products = productsRaw
      } else if (productsRaw?.data && Array.isArray(productsRaw.data)) {
        products = productsRaw.data
      } else if (productsRaw?.products && Array.isArray(productsRaw.products)) {
        products = productsRaw.products
      } else if (productsRaw?.items && Array.isArray(productsRaw.items)) {
        products = productsRaw.items
      } else {
        console.log('Ready2Order raw response structure:', JSON.stringify(productsRaw, null, 2).substring(0, 500))
      }

      console.log(`Ready2Order: Found ${products.length} products`)
      if (products.length > 0) {
        console.log('First product raw:', JSON.stringify(products[0], null, 2))
        // Log all keys to see what fields are available
        console.log('Product keys:', Object.keys(products[0]))
      }

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
        const groupsRaw = await groupsResponse.json()
        // Handle different response formats
        if (Array.isArray(groupsRaw)) {
          groups = groupsRaw
        } else if (groupsRaw?.data && Array.isArray(groupsRaw.data)) {
          groups = groupsRaw.data
        } else if (groupsRaw?.productgroups && Array.isArray(groupsRaw.productgroups)) {
          groups = groupsRaw.productgroups
        } else {
          console.log('Ready2Order groups raw response structure:', JSON.stringify(groupsRaw, null, 2).substring(0, 500))
        }
        console.log(`Ready2Order: Found ${groups.length} product groups`)
        if (groups.length > 0) {
          console.log('First group raw:', JSON.stringify(groups[0], null, 2))
        }
      } else {
        console.warn('Ready2Order: Could not fetch product groups, using embedded group data from products')
      }

      // Check if products include productgroup info - if not, try fetching products per group
      const firstProductHasGroup = products.length > 0 && (
        products[0].productgroup_id ||
        products[0].product_productgroup_id ||
        products[0].productgroup?.productgroup_id
      )

      if (!firstProductHasGroup && groups.length > 0) {
        console.log('Products do not include productgroup_id, fetching products per group...')
        // Try to fetch products for each group
        const productsWithGroups: any[] = []

        for (const group of groups) {
          const groupId = group.productgroup_id || group.id
          if (!groupId) continue

          try {
            // Try fetching products for this specific group
            const groupProductsResponse = await fetch(
              `${this.baseUrl}/productgroups/${groupId}/products`,
              {
                headers: {
                  'Authorization': `Bearer ${this.apiKey}`,
                  'Accept': 'application/json'
                }
              }
            )

            if (groupProductsResponse.ok) {
              const groupProductsRaw = await groupProductsResponse.json()
              let groupProducts: any[] = []

              if (Array.isArray(groupProductsRaw)) {
                groupProducts = groupProductsRaw
              } else if (groupProductsRaw?.data) {
                groupProducts = groupProductsRaw.data
              } else if (groupProductsRaw?.products) {
                groupProducts = groupProductsRaw.products
              }

              // Add group info to each product
              for (const product of groupProducts) {
                productsWithGroups.push({
                  ...product,
                  productgroup_id: groupId,
                  productgroup_name: group.productgroup_name || group.name
                })
              }

              console.log(`Fetched ${groupProducts.length} products for group "${group.productgroup_name || group.name}"`)
            }
          } catch (e) {
            console.warn(`Could not fetch products for group ${groupId}:`, e)
          }
        }

        // If we got products this way, use them instead
        if (productsWithGroups.length > 0) {
          console.log(`Using ${productsWithGroups.length} products fetched per group`)
          products = productsWithGroups
        }
      }

      // Convert to our format - ready2order uses productgroup_ prefix
      const categories: POSCategory[] = groups.map((group: any) => ({
        id: (group.productgroup_id || group.id || group._id)?.toString(),
        name: group.productgroup_name || group.name || group.groupName || group.title || '',
        sortOrder: group.productgroup_sortIndex || group.position || group.sort || group.sortOrder || 0
      })).filter(cat => cat.name) // Filter out categories without names

      console.log('Converted categories:', JSON.stringify(categories.slice(0, 3), null, 2))

      // Store raw data for debugging
      const rawFirstGroup = groups.length > 0 ? groups[0] : null
      const rawFirstProduct = products.length > 0 ? products[0] : null

      // ready2order returns prices in euros (not cents), e.g., 4.5 for €4.50
      // ready2order uses product_ prefix for all product fields
      const items: POSMenuItem[] = products.map((product: any) => {
        // Extract category ID - ready2order may include productgroup object when using ?include=productgroup
        const categoryId = (
          product.productgroup_id ||
          product.product_productgroup_id ||
          product.productgroup?.productgroup_id ||
          product.productgroup?.id
        )?.toString()

        // Store the category name from embedded productgroup if available
        const categoryName = product.productgroup?.productgroup_name ||
                            product.productgroup?.name ||
                            product.productgroup_name || null

        // Extract name - ready2order uses product_name
        const itemName = product.product_name || product.name || ''

        // Extract price - ready2order uses product_price, handle both number and string
        const priceValue = product.product_price ?? product.price ?? 0
        const price = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue

        // Parse active state - ready2order uses product_active (0/1 or "0"/"1")
        const activeValue = product.product_active ?? product.active ?? 1
        const isActive = activeValue === 1 || activeValue === '1' ||
                        activeValue === true || activeValue === 'true'

        return {
          id: (product.product_id || product.id)?.toString(),
          name: itemName,
          description: product.product_description || product.description || '',
          price: price || 0, // Price is already in euros
          categoryId,
          categoryName, // Include for fallback matching
          image: product.product_image || product.image_url || product.image,
          isActive,
          variants: (product.variations || product.variants || []).map((v: any) => ({
            id: (v.variation_id || v.id)?.toString(),
            name: v.variation_name || v.name || '',
            price: parseFloat(v.price) || 0
          })),
          extras: (product.extras || []).map((e: any) => ({
            id: (e.extra_id || e.id)?.toString(),
            name: e.extra_name || e.name || '',
            price: parseFloat(e.price) || 0
          }))
        }
      }).filter(item => item.name) // Filter out items without names

      console.log('Converted items:', JSON.stringify(items.slice(0, 3), null, 2))

      console.log(`Ready2Order sync complete: ${items.length} items, ${categories.length} categories`)

      // Log a sample item for debugging
      if (items.length > 0) {
        console.log('Sample item:', JSON.stringify(items[0], null, 2))
      }

      result.categories = categories
      result.items = items
      result.success = true
      result.imported = items.length

      // Add raw data for debugging (will be included in response)
      ;(result as any).rawFirstGroup = rawFirstGroup
      ;(result as any).rawFirstProduct = rawFirstProduct

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