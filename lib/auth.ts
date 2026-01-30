import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null // Rückgabe von null löst CredentialsSignin aus
        }
        
        const user = await prisma.user.findUnique({
          where: { 
            email: credentials.email as string
          },
          include: {
            ownedRestaurants: {
              select: {
                id: true,
                status: true,
                name: true
              }
            }
          }
        })
        
        if (!user || !user.password) {
          console.log('User not found or no password:', credentials.email)
          return null // Rückgabe von null löst CredentialsSignin aus
        }
        
        const isValid = await bcrypt.compare(
          credentials.password as string, 
          user.password
        )
        
        if (!isValid) {
          console.log('Invalid password for user:', credentials.email)
          return null // Rückgabe von null löst CredentialsSignin aus
        }
        
        // Check if restaurant owner with pending restaurant
        if (user.role === "RESTAURANT_OWNER" && user.ownedRestaurants.length > 0) {
          const pendingRestaurant = user.ownedRestaurants.find(r => r.status === "PENDING")
          if (pendingRestaurant) {
            console.log('Restaurant pending approval:', pendingRestaurant.name)
            throw new Error("RESTAURANT_PENDING_APPROVAL")
          }
        }
        
        console.log('Login successful for:', user.email)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role as any,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Bei OAuth-Anmeldung: Setze Standardrolle wenn neue User
      if (account?.provider !== "credentials") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })
        
        if (!existingUser) {
          await prisma.user.update({
            where: { email: user.email! },
            data: { 
              role: "RESTAURANT_OWNER",
              emailVerified: new Date()
            }
          })
        }
      }
      
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.createdAt = user.createdAt
      }
      
      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as any
        session.user.createdAt = token.createdAt as any
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Nach Login: Redirect basierend auf Rolle
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
})

// Helper function to get session in server components
export async function getServerSession() {
  return await auth()
}

// Helper function to check if user has access to restaurant
export async function checkRestaurantAccess(restaurantId: string) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Nicht authentifiziert")
  }
  
  // Super Admin hat immer Zugriff
  if (session.user.role === "SUPER_ADMIN") {
    return true
  }
  
  // Check ob User Owner oder Staff ist
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      id: restaurantId,
      OR: [
        { ownerId: session.user.id },
        { 
          staff: { 
            some: { 
              userId: session.user.id 
            } 
          } 
        }
      ]
    }
  })
  
  if (!restaurant) {
    throw new Error("Kein Zugriff auf dieses Restaurant")
  }
  
  return restaurant
}