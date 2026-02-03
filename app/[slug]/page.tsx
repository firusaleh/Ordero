import { redirect } from 'next/navigation'

interface DirectRestaurantPageProps {
  params: Promise<{ slug: string }>
}

export default async function DirectRestaurantPage({ params }: DirectRestaurantPageProps) {
  const { slug } = await params
  
  // Redirect to the actual restaurant page under /r/
  redirect(`/r/${slug}`)
}