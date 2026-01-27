import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminRestaurantDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  // Redirect to settings as the main management page
  redirect(`/admin/restaurants/${resolvedParams.id}/settings`)
}