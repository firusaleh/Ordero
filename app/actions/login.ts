"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export async function handleLogin(email: string, password: string) {
  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard'
    })
    
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Ungültige Anmeldedaten' }
        default:
          return { error: 'Ein Fehler ist aufgetreten' }
      }
    }
    throw error
  }
}