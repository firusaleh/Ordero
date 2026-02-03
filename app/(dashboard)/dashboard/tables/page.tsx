import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import TablesManagerTranslated from '@/components/dashboard/tables-manager-translated'
import { getSelectedRestaurant } from '@/app/actions/restaurants'

async function getTablesData(userId: string) {
  const restaurant = await getSelectedRestaurant()

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

  return <TablesManagerTranslated 
    restaurant={data.restaurant}
    initialTables={data.tables}
  />
}