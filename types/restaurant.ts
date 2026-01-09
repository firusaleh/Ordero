import { Restaurant, RestaurantSettings, Category, MenuItem, Table } from '@prisma/client'

export type RestaurantWithSettings = Restaurant & {
  settings: RestaurantSettings | null
}

export type RestaurantWithDetails = Restaurant & {
  settings: RestaurantSettings | null
  categories: Category[]
  menuItems: MenuItem[]
  tables: Table[]
  _count: {
    orders: number
    staff: number
  }
}

export type CreateRestaurantInput = {
  name: string
  slug: string
  description?: string
  cuisine?: string
  street?: string
  city?: string
  postalCode?: string
  country?: string
  phone?: string
  email?: string
  website?: string
}

export type UpdateRestaurantInput = Partial<CreateRestaurantInput> & {
  logo?: string
  coverImage?: string
  primaryColor?: string
}