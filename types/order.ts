import { Order, OrderItem, Table, MenuItem } from '@prisma/client'

export type OrderWithDetails = Order & {
  items: OrderItemWithDetails[]
  table: Table | null
}

export type OrderItemWithDetails = OrderItem & {
  menuItem: MenuItem
}

export type CreateOrderInput = {
  restaurantId: string
  tableId?: string
  type: 'DINE_IN' | 'TAKEAWAY'
  guestName?: string
  guestPhone?: string
  guestEmail?: string
  notes?: string
  items: CreateOrderItemInput[]
}

export type CreateOrderItemInput = {
  menuItemId: string
  quantity: number
  variant?: string
  variantPrice?: number
  extras?: {
    name: string
    price: number
  }[]
  notes?: string
}

export type UpdateOrderStatusInput = {
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED' | 'PAID'
}

export type OrderStats = {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersByStatus: {
    status: string
    count: number
  }[]
}