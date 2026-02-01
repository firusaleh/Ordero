// POS Integration Types
export interface POSMenuItem {
  id: string
  name: string
  description: string
  price: number
  categoryId?: string
  categoryName?: string  // For fallback category matching by name
  image?: string
  isActive: boolean
  variants?: POSVariant[]
  extras?: POSExtra[]
}

export interface POSVariant {
  id: string
  name: string
  price: number
}

export interface POSExtra {
  id: string
  name: string
  price: number
}

export interface POSCategory {
  id: string
  name: string
  sortOrder: number
}

export interface POSSyncResult {
  success: boolean
  imported: number
  updated: number
  categories?: POSCategory[]
  items?: POSMenuItem[]
  errors: string[]
}

export interface POSOrder {
  id: string
  orderNumber: string
  tableNumber?: string
  orderType: string
  items: any[]
  total: number
  tipAmount?: number
  paymentMethod: string
  customerName?: string
  customerPhone?: string
  guestEmail?: string
  notes?: string
}

// Base POS Adapter
export abstract class POSAdapter {
  protected apiKey: string
  protected restaurantId?: string

  constructor(apiKey: string, restaurantId?: string) {
    this.apiKey = apiKey
    this.restaurantId = restaurantId
  }

  abstract testConnection(): Promise<boolean>
  abstract syncMenu(): Promise<POSSyncResult>
  abstract sendOrder(order: POSOrder): Promise<boolean>
  abstract updateOrderStatus(orderId: string, status: string): Promise<boolean>
  abstract syncTables(): Promise<any[]>
}