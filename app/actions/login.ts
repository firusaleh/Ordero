"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export async function handleLogin(email: string, password: string) {
  try {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false // Wichtig: Kein automatischer Redirect
    })
    
    console.log('Login result:', result)
    
    // Erfolgreicher Login
    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    
    // Check for custom restaurant pending approval error
    if (error instanceof Error && error.message === 'RESTAURANT_PENDING_APPROVAL') {
      return { 
        error: 'Ihr Restaurant wartet auf Freigabe durch den Administrator. Sie erhalten eine E-Mail, sobald Ihr Restaurant freigegeben wurde.' 
      }
    }
    
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Ungültige E-Mail-Adresse oder Passwort' }
        case 'AccessDenied':
          return { error: 'Zugriff verweigert' }
        default:
          return { error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' }
      }
    }
    
    // Unbekannter Fehler
    return { error: 'Ein unerwarteter Fehler ist aufgetreten' }
  }
}