import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { authEdge } from "@/lib/auth-edge"

export default authEdge((req) => {
  const { nextUrl, auth } = req
  const isLoggedIn = !!auth?.user
  const isAdmin = auth?.user?.role === "SUPER_ADMIN" || auth?.user?.role === "ADMIN"
  
  // Öffentliche Routen
  const publicRoutes = ["/", "/login", "/register", "/r"]
  const isPublicRoute = publicRoutes.some(route => 
    nextUrl.pathname === route || nextUrl.pathname.startsWith("/r/")
  )
  
  // Admin-Routen
  const isAdminRoute = nextUrl.pathname.startsWith("/admin")
  
  // Dashboard-Routen
  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard")
  
  // API-Routen (immer erlauben)
  const isApiRoute = nextUrl.pathname.startsWith("/api")
  
  // Onboarding-Route
  const isOnboardingRoute = nextUrl.pathname.startsWith("/onboarding")
  
  // API-Routen immer durchlassen
  if (isApiRoute) {
    return NextResponse.next()
  }
  
  // Admin-Routen nur für Admins
  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }
  
  // Dashboard und Onboarding benötigen Anmeldung
  if ((isDashboardRoute || isOnboardingRoute) && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl)
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Admin-User, die zum Dashboard gehen, zum Admin-Panel leiten
  if (isDashboardRoute && isAdmin) {
    return NextResponse.redirect(new URL("/admin", nextUrl))
  }
  
  // Bereits angemeldete User von Auth-Seiten weglenken
  if ((nextUrl.pathname === "/login" || nextUrl.pathname === "/register") && isLoggedIn) {
    // Admin-User zum Admin-Dashboard
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin", nextUrl))
    }
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.webp$).*)",
  ],
}