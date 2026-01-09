import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET() {
  try {
    // Get session
    const session = await auth()
    
    // Get cookies for debugging
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("authjs.session-token") || 
                        cookieStore.get("__Secure-authjs.session-token")
    
    return NextResponse.json({
      session: session ? {
        user: session.user,
        expires: session.expires
      } : null,
      hasSession: !!session,
      hasSessionToken: !!sessionToken,
      sessionTokenName: sessionToken?.name,
      cookies: {
        "authjs.session-token": cookieStore.get("authjs.session-token")?.value ? "exists" : "missing",
        "__Secure-authjs.session-token": cookieStore.get("__Secure-authjs.session-token")?.value ? "exists" : "missing",
      },
      environment: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "set" : "missing",
        NODE_ENV: process.env.NODE_ENV
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}