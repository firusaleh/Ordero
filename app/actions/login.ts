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