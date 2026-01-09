"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
type UserRole = "SUPER_ADMIN" | "ADMIN" | "RESTAURANT_OWNER" | "RESTAURANT_STAFF"

interface UseAuthOptions {
  required?: boolean
  redirectTo?: string
  roles?: UserRole[]
}

export function useAuth(options: UseAuthOptions = {}) {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  
  const {
    required = false,
    redirectTo = "/login",
    roles = []
  } = options

  useEffect(() => {
    if (required && status === "unauthenticated") {
      router.push(redirectTo)
    }
    
    if (roles.length > 0 && session?.user && !roles.includes(session.user.role)) {
      router.push("/unauthorized")
    }
  }, [required, redirectTo, roles, session, status, router])

  return {
    session,
    status,
    update,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    user: session?.user || null,
    hasRole: (role: UserRole) => session?.user?.role === role,
    hasAnyRole: (checkRoles: UserRole[]) => 
      checkRoles.includes(session?.user?.role as UserRole),
    isSuperAdmin: session?.user?.role === "SUPER_ADMIN",
    isRestaurantOwner: session?.user?.role === "RESTAURANT_OWNER",
    isStaff: session?.user?.role === "RESTAURANT_STAFF"
  }
}

// Hook für Restaurant-Kontext
export function useRestaurant() {
  const { session } = useAuth({ required: true })
  
  // Diese Daten könnten aus einem Context oder State Management kommen
  const currentRestaurant = session?.user ? {
    id: "current-restaurant-id",
    name: "Mein Restaurant",
    slug: "mein-restaurant"
  } : null
  
  return {
    restaurant: currentRestaurant,
    hasRestaurant: !!currentRestaurant,
    isOwner: session?.user?.role === "RESTAURANT_OWNER",
    canManage: session?.user?.role === "RESTAURANT_OWNER" || 
               session?.user?.role === "SUPER_ADMIN"
  }
}