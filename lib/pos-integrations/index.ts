// POS System Integrations
import { RestaurantSettings } from '@prisma/client'
import { POSAdapter } from './types'
import { Ready2OrderAdapter } from './ready2order'
import { OrderbirdAdapter } from './orderbird'

export * from './types'

// Lightspeed POS Adapter (Placeholder)
class LightspeedAdapter extends POSAdapter {
  async testConnection(): Promise<boolean> {
    // TODO: Implement Lightspeed API
    return false
  }
  
  async syncMenu(): Promise<any> {
    return { success: false, errors: ['Lightspeed integration noch nicht implementiert'] }
  }
  
  async sendOrder(order: any): Promise<boolean> {
    return false
  }
  
  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    return false
  }
  
  async syncTables(): Promise<any[]> {
    return []
  }
}

// Square POS Adapter (Placeholder)
class SquareAdapter extends POSAdapter {
  async testConnection(): Promise<boolean> {
    // TODO: Implement Square API
    return false
  }
  
  async syncMenu(): Promise<any> {
    return { success: false, errors: ['Square integration noch nicht implementiert'] }
  }
  
  async sendOrder(order: any): Promise<boolean> {
    return false
  }
  
  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    return false
  }
  
  async syncTables(): Promise<any[]> {
    return []
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
    case 'lightspeed':
      return new LightspeedAdapter(apiKey, restaurantId)
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