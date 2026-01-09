import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import TablesManager from '@/components/dashboard/tables-manager'

async function getTablesData(userId: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      OR: [
        { ownerId: userId },
        { staff: { some: { userId } } }
      ]
    }
  })

  if (!restaurant) {
    return null
  }

  const tables = await prisma.table.findMany({
    where: {
      restaurantId: restaurant.id
    },
    orderBy: {
      number: 'asc'
    }
  })

  return { restaurant, tables }
}

export default async function TablesPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const data = await getTablesData(session.user.id)

  if (!data) {
    redirect('/onboarding')
  }

  return <TablesManager 
    restaurant={data.restaurant}
    initialTables={data.tables}
  />
}