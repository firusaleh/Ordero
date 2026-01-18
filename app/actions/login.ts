"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"
import { redirect } from 'next/navigation'

export async function handleLogin(email: string, password: string) {
  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false // Wichtig: Kein automatischer Redirect
    })
    
    // Erfolgreicher Login - manueller Redirect
    redirect('/dashboard')
  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Ungültige E-Mail-Adresse oder Passwort' }
        case 'AccessDenied':
          return { error: 'Zugriff verweigert' }
        case 'Configuration':
          return { error: 'Konfigurationsfehler' }
        default:
          return { error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' }
      }
    }
    
    // Unbekannter Fehler
    return { error: 'Ein unerwarteter Fehler ist aufgetreten' }
  }
}