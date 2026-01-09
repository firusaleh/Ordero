import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-gray-300">404</h1>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Seite nicht gefunden
          </h2>
          
          <p className="text-gray-600 mb-8">
            Die gesuchte Seite existiert leider nicht. Möglicherweise wurde sie verschoben oder gelöscht.
          </p>

          <div className="space-y-3">
            <Link href="/">
              <Button className="w-full">
                Zur Startseite
              </Button>
            </Link>
            
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Zum Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}