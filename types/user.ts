import { User, Restaurant } from '@prisma/client'

export type UserWithRestaurants = User & {
  ownedRestaurants: Restaurant[]
}

export type CreateUserInput = {
  email: string
  password: string
  name?: string
  phone?: string
}

export type UpdateUserInput = {
  name?: string
  phone?: string
  image?: string
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  email: string
  password: string
  name: string
  phone?: string
  restaurantName?: string
}