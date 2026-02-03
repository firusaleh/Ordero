import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import BillingClient from "./client"
import { getSelectedRestaurant } from '@/app/actions/restaurants'

export default async function BillingPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  // Restaurant mit Einstellungen laden
  const restaurant = await getSelectedRestaurant()
  
  if (!restaurant) {
    redirect("/dashboard")
  }
  
  return <BillingClient restaurant={restaurant} />
}