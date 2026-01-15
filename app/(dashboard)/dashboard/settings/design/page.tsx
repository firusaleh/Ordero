import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import RestaurantDesign from '@/components/dashboard/restaurant-design'

export default async function DesignSettingsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  
  // Hole das Restaurant des Benutzers
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      OR: [
        { ownerId: session.user.id },
        { 
          staff: { 
            some: { 
              userId: session.user.id,
              role: { in: ['ADMIN', 'MANAGER'] }
            } 
          } 
        }
      ]
    },
    select: {
      id: true,
      logo: true,
      banner: true,
      primaryColor: true
    }
  })
  
  if (!restaurant) {
    redirect('/dashboard')
  }
  
  const initialData = {
    logo: restaurant.logo || undefined,
    coverImage: restaurant.banner || undefined,
    primaryColor: restaurant.primaryColor || undefined
  }
  
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Design & Aussehen</h1>
        <p className="text-gray-600 mt-2">
          Passen Sie das Erscheinungsbild Ihres digitalen Menüs an
        </p>
      </div>
      
      <RestaurantDesign 
        restaurantId={restaurant.id}
        initialData={initialData}
      />
    </div>
  )
}