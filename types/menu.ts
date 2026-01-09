import { Category, MenuItem, MenuItemVariant, MenuItemExtra } from '@prisma/client'

export type CategoryWithItems = Category & {
  menuItems: MenuItemWithDetails[]
}

export type MenuItemWithDetails = MenuItem & {
  category: Category
  variants: MenuItemVariant[]
  extras: MenuItemExtra[]
}

export type CreateCategoryInput = {
  name: string
  description?: string
  sortOrder?: number
  color?: string
  icon?: string
  isActive?: boolean
}

export type CreateMenuItemInput = {
  categoryId: string
  name: string
  description?: string
  price: number
  image?: string
  isActive?: boolean
  isAvailable?: boolean
  allergens?: string[]
  additives?: string[]
  tags?: string[]
  calories?: number
  sortOrder?: number
}

export type CreateMenuItemVariantInput = {
  name: string
  price: number
  sortOrder?: number
}

export type CreateMenuItemExtraInput = {
  name: string
  price: number
  sortOrder?: number
}

export type MenuData = {
  categories: CategoryWithItems[]
}