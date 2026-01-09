import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ChefHat, 
  QrCode, 
  Smartphone, 
  BarChart3, 
  Clock, 
  Users,
  Check,
  ArrowRight,
  Star
} from 'lucide-react'

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            14 Tage kostenlos testen
          </Badge>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Digitale Speisekarten für moderne Restaurants
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Verwandeln Sie Ihr Restaurant mit QR-Code-Bestellungen. 
            Steigern Sie den Umsatz, reduzieren Sie Wartezeiten und begeistern Sie Ihre Gäste.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Kostenlos starten <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#demo">
                Demo ansehen
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Alles, was Ihr Restaurant braucht</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Von der digitalen Speisekarte bis zur Bestellverwaltung - alle Funktionen in einer Plattform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <QrCode className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>QR-Code Bestellung</CardTitle>
                <CardDescription>
                  Gäste scannen den QR-Code am Tisch und bestellen direkt über ihr Smartphone
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <ChefHat className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Digitale Speisekarte</CardTitle>
                <CardDescription>
                  Erstellen und verwalten Sie Ihre Speisekarte online. Änderungen in Echtzeit.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Smartphone className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Mobile Optimiert</CardTitle>
                <CardDescription>
                  Perfekt optimiert für alle Smartphones. Keine App-Installation notwendig.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Statistiken</CardTitle>
                <CardDescription>
                  Detaillierte Einblicke in Bestellungen, Umsätze und Kundenverhalten.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Echtzeit-Updates</CardTitle>
                <CardDescription>
                  Neue Bestellungen erscheinen sofort im Dashboard. Keine Verzögerungen.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Team-Management</CardTitle>
                <CardDescription>
                  Fügen Sie Mitarbeiter hinzu und verwalten Sie Zugriffsrechte.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Einfache, transparente Preise</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Keine versteckten Kosten. Keine Einrichtungsgebühren. Jederzeit kündbar.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Trial</CardTitle>
                <CardDescription>Perfekt zum Testen</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">€0</span>
                  <span className="text-gray-600">/14 Tage</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Alle Features
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Unbegrenzte Bestellungen
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    E-Mail Support
                  </li>
                </ul>
                <Button className="w-full mt-6" asChild>
                  <Link href="/register">Kostenlos starten</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-blue-600 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600">Beliebt</Badge>
              </div>
              <CardHeader>
                <CardTitle>Standard</CardTitle>
                <CardDescription>Für wachsende Restaurants</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">€79</span>
                  <span className="text-gray-600">/Monat</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Alles aus Trial
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    POS-Integration
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Priority Support
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Erweiterte Statistiken
                  </li>
                </ul>
                <Button className="w-full mt-6" asChild>
                  <Link href="/register">Jetzt starten</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Premium</CardTitle>
                <CardDescription>Für große Restaurants</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">€149</span>
                  <span className="text-gray-600">/Monat</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Alles aus Standard
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Mehrere Standorte
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    24/7 Support
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    API-Zugang
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline" asChild>
                  <Link href="/register">Kontakt aufnehmen</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Was unsere Kunden sagen</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardDescription>
                  "Oriido hat unseren Service revolutioniert. Die Bestellungen kommen schneller rein und die Gäste sind begeistert."
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">Maria Schmidt</p>
                <p className="text-sm text-gray-600">Restaurant Zur Post</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardDescription>
                  "Die Integration war kinderleicht. Innerhalb von 30 Minuten waren wir startklar."
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">Thomas Müller</p>
                <p className="text-sm text-gray-600">Pizzeria Bella Vista</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardDescription>
                  "Der Support ist erstklassig und die Software wird ständig verbessert."
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">Lisa Weber</p>
                <p className="text-sm text-gray-600">Café am Markt</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardHeader>
              <CardTitle className="text-3xl mb-4">
                Bereit, Ihr Restaurant zu digitalisieren?
              </CardTitle>
              <CardDescription className="text-white/90 text-lg mb-6">
                Starten Sie jetzt Ihre 14-tägige kostenlose Testversion. Keine Kreditkarte erforderlich.
              </CardDescription>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">
                  Jetzt kostenlos starten <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
          </Card>
        </div>
      </section>
    </>
  )
}