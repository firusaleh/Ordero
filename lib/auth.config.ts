import type { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

type UserRole = "SUPER_ADMIN" | "ADMIN" | "RESTAURANT_OWNER" | "RESTAURANT_STAFF"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: UserRole
    }
  }
  
  interface User {
    role: UserRole
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    role: UserRole
  }
}

// Basis-Konfiguration ohne Prisma-Abhängigkeiten (für Edge Runtime)
export const authConfig: NextAuthConfig = {
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
    newUser: "/onboarding",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Wird in auth.ts überschrieben mit Prisma-Logik
        return null
      },
    }),
    // Google OAuth Provider (optional)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Nach Login: Standard-Redirect zum Dashboard
      // Die rollenbasierte Weiterleitung wird in der Middleware behandelt
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard`
      }
      
      // Erlaubte Redirects
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      
      if (url.startsWith(baseUrl)) {
        return url
      }
      
      return baseUrl
    }
  },
}