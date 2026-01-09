// Re-export all types
export * from './restaurant'
export * from './menu'
export * from './order'
export * from './user'

// Re-export Prisma types we need
export type {
  User,
  Restaurant,
  Category,
  MenuItem,
  MenuItemVariant,
  MenuItemExtra,
  Table,
  Order,
  OrderItem,
  Invoice,
  RestaurantSettings,
  RestaurantStaff
} from '@prisma/client'

// Define enums for MongoDB (string-based)
export type UserRole = 'SUPER_ADMIN' | 'RESTAURANT_OWNER' | 'RESTAURANT_STAFF'
export type RestaurantStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'
export type SubscriptionPlan = 'FREE' | 'STANDARD' | 'PREMIUM'
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED' | 'PAID'
export type OrderType = 'DINE_IN' | 'TAKEAWAY'
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'