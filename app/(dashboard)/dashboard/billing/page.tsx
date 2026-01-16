import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import BillingClient from "./client"

export default async function BillingPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  // Restaurant mit Einstellungen laden
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
  
  return <BillingClient restaurant={restaurant} />
}