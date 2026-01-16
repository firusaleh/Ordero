import { ReactNode } from 'react'
import Link from 'next/link'

export default function MarketingLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <img src="/oriido-logo.png" alt="Oriido" className="h-12 w-auto cursor-pointer" />
            </Link>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Preise</a>
            <a href="#contact" className="text-gray-600 hover:text-gray-900">Kontakt</a>
          </nav>
          <div className="flex space-x-4">
            <Link href="/login" className="px-4 py-2 text-gray-600 hover:text-gray-900">
              Anmelden
            </Link>
            <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Kostenlos starten
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t bg-white mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <img src="/oriido-logo.png" alt="Oriido" className="h-12 w-auto" />
              </div>
              <p className="text-gray-600 text-sm">
                Die digitale Speisekarte für moderne Restaurants
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produkt</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#features" className="hover:text-gray-900">Features</a></li>
                <li><a href="#pricing" className="hover:text-gray-900">Preise</a></li>
                <li><a href="#" className="hover:text-gray-900">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Unternehmen</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Über uns</a></li>
                <li><a href="#" className="hover:text-gray-900">Kontakt</a></li>
                <li><a href="#" className="hover:text-gray-900">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Rechtliches</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/imprint" className="hover:text-gray-900">Impressum</Link></li>
                <li><Link href="/privacy" className="hover:text-gray-900">Datenschutz</Link></li>
                <li><Link href="/terms" className="hover:text-gray-900">AGB</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
            © 2024 Oriido. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>
    </div>
  )
}