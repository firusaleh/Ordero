import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import CustomFeesClient from "./client"
import { getSelectedRestaurant } from '@/app/actions/restaurants'

export default async function CustomFeesPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  const restaurant = await getSelectedRestaurant()
  
  if (!restaurant) {
    redirect("/dashboard")
  }
  
  // Ensure settings exist
  if (!restaurant.settings) {
    const settings = await prisma.restaurantSettings.create({
      data: {
        restaurantId: restaurant.id
      },
      include: {
        customFees: true
      }
    })
    restaurant.settings = settings
  }
  
  return <CustomFeesClient restaurant={restaurant} settings={restaurant.settings} />
}