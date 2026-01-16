import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import FeesSettingsClient from "./client"

export default async function FeesSettingsPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      ownerId: session.user.id
    },
    include: {
      settings: true
    }
  })
  
  if (!restaurant) {
    redirect("/dashboard")
  }
  
  // Ensure settings exist
  if (!restaurant.settings) {
    const settings = await prisma.restaurantSettings.create({
      data: {
        restaurantId: restaurant.id
      }
    })
    restaurant.settings = settings
  }
  
  return <FeesSettingsClient restaurant={restaurant} settings={restaurant.settings} />
}