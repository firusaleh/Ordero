// POS System Integrations
import { Order, Restaurant, RestaurantSettings } from '@prisma/client'

interface POSOrder {
  order: any
  settings: RestaurantSettings
}

// Base POS Adapter
abstract class POSAdapter {
  protected apiKey: string
  protected restaurantId?: string

  constructor(apiKey: string, restaurantId?: string) {
    this.apiKey = apiKey
    this.restaurantId = restaurantId
  }

  abstract sendOrder(order: any): Promise<boolean>
  abstract testConnection(): Promise<boolean>
}

// Ready2Order Adapter
class Ready2OrderAdapter extends POSAdapter {
  private baseUrl = 'https://api.ready2order.com/v1'

  async sendOrder(order: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          restaurant_id: this.restaurantId,
          order_number: order.orderNumber,
          table_number: order.tableNumber,
          items: order.items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.unitPrice,
            notes: item.notes
          })),
          total: order.total,
          payment_method: order.paymentMethod
        })
      })

      return response.ok
    } catch (error) {
      console.error('Ready2Order integration error:', error)
      return false
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/restaurants/${this.restaurantId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })
      return response.ok
    } catch {
      return false
    }
  }
}

// Orderbird Adapter
class OrderbirdAdapter extends POSAdapter {
  private baseUrl = 'https://api.orderbird.com/v2'

  async sendOrder(order: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          external_id: order.id,
          table: order.tableNumber,
          items: order.items.map((item: any) => ({
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.unitPrice * 100, // Orderbird uses cents
            comment: item.notes
          })),
          payment_type: order.paymentMethod === 'CASH' ? 'cash' : 'card'
        })
      })

      return response.ok
    } catch (error) {
      console.error('Orderbird integration error:', error)
      return false
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/account`, {
        headers: {
          'X-API-Key': this.apiKey
        }
      })
      return response.ok
    } catch {
      return false
    }
  }
}

// Square POS Adapter
class SquareAdapter extends POSAdapter {
  private baseUrl = 'https://connect.squareup.com/v2'

  async sendOrder(order: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-18'
        },
        body: JSON.stringify({
          order: {
            location_id: this.restaurantId,
            reference_id: order.orderNumber,
            line_items: order.items.map((item: any) => ({
              name: item.name,
              quantity: String(item.quantity),
              base_price_money: {
                amount: Math.round(item.unitPrice * 100),
                currency: 'EUR'
              },
              note: item.notes
            }))
          }
        })
      })

      return response.ok
    } catch (error) {
      console.error('Square integration error:', error)
      return false
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/locations/${this.restaurantId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Square-Version': '2024-01-18'
        }
      })
      return response.ok
    } catch {
      return false
    }
  }
}

// Factory to get correct adapter
export function getPOSAdapter(system: string, apiKey: string, restaurantId?: string): POSAdapter | null {
  switch (system) {
    case 'ready2order':
      return new Ready2OrderAdapter(apiKey, restaurantId)
    case 'orderbird':
      return new OrderbirdAdapter(apiKey, restaurantId)
    case 'square':
      return new SquareAdapter(apiKey, restaurantId)
    default:
      console.log(`POS system ${system} not yet implemented`)
      return null
  }
}

// Main function to send order to POS
export async function sendOrderToPOS(order: any, settings: RestaurantSettings | null): Promise<boolean> {
  if (!settings?.posSystem || !settings?.posApiKey || !settings?.posSyncEnabled) {
    console.log('POS sync not enabled or configured')
    return false
  }

  const adapter = getPOSAdapter(
    settings.posSystem,
    settings.posApiKey,
    settings.posRestaurantId || undefined
  )

  if (!adapter) {
    console.log(`No adapter found for POS system: ${settings.posSystem}`)
    return false
  }

  try {
    const success = await adapter.sendOrder(order)
    
    if (success) {
      console.log(`Order ${order.orderNumber} successfully sent to ${settings.posSystem}`)
    } else {
      console.error(`Failed to send order ${order.orderNumber} to ${settings.posSystem}`)
    }
    
    return success
  } catch (error) {
    console.error('Error sending order to POS:', error)
    return false
  }
}