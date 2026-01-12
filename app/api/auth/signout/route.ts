import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Get the cookies
    const cookieStore = await cookies()
    
    // Delete the session cookie - NextAuth v5 uses 'authjs.session-token' for production
    // and 'authjs.session-token' for development
    cookieStore.delete('authjs.session-token')
    cookieStore.delete('__Secure-authjs.session-token')
    
    // Also try the old next-auth cookie names just in case
    cookieStore.delete('next-auth.session-token')
    cookieStore.delete('__Secure-next-auth.session-token')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signout error:', error)
    return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 })
  }
}