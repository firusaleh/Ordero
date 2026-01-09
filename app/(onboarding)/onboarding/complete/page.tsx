"use client"

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Check,
  Download,
  ExternalLink,
  ArrowRight,
  QrCode,
  ShoppingCart,
  ChefHat,
  Settings,
  Sparkles,
  Rocket
} from 'lucide-react'
import { toast } from 'sonner'
import Stepper from '@/components/onboarding/stepper'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

const steps = [
  { id: 1, name: 'Restaurant', description: 'Grunddaten', href: '/onboarding' },
  { id: 2, name: 'Plan', description: 'Wählen', href: '/onboarding/plan' },
  { id: 3, name: 'Speisekarte', description: 'Erstellen', href: '/onboarding/menu' },
  { id: 4, name: 'Tische', description: 'QR-Codes', href: '/onboarding/tables' },
  { id: 5, name: 'Fertig', description: 'Los geht\'s', href: '/onboarding/complete' },
]

export default function CompletePage() {
  const router = useRouter()

  useEffect(() => {
    // Konfetti-Animation beim Laden
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  const handleDownloadQR = async () => {
    try {
      // In der echten App würde hier der QR-Code Download starten
      toast.success('QR-Codes werden vorbereitet...', {
        description: 'Der Download startet in Kürze.',
      })
      
      // Simuliere Download
      setTimeout(() => {
        toast.success('QR-Codes heruntergeladen!')
      }, 2000)
    } catch (error) {
      toast.error('Fehler beim Download')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Stepper steps={steps} currentStep={4} />
      
      {/* Success Message */}
      <Card className="mb-8 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl">
            🎉 Herzlichen Glückwunsch!
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Ihr Restaurant ist jetzt bereit für digitale Bestellungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Badge variant="secondary" className="text-sm py-1">
              <Check className="mr-1 h-3 w-3" />
              Restaurant erstellt
            </Badge>
            <Badge variant="secondary" className="text-sm py-1">
              <Check className="mr-1 h-3 w-3" />
              Speisekarte angelegt
            </Badge>
            <Badge variant="secondary" className="text-sm py-1">
              <Check className="mr-1 h-3 w-3" />
              QR-Codes generiert
            </Badge>
            <Badge variant="secondary" className="text-sm py-1">
              <Sparkles className="mr-1 h-3 w-3" />
              14 Tage Trial aktiv
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Nächste Schritte */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <QrCode className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">QR-Codes drucken</CardTitle>
                <CardDescription>Laden Sie die QR-Codes herunter</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleDownloadQR}
            >
              <Download className="mr-2 h-4 w-4" />
              QR-Codes herunterladen
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ExternalLink className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Speisekarte testen</CardTitle>
                <CardDescription>Sehen Sie Ihre digitale Speisekarte</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => window.open('/r/restaurant-demo/tisch/1', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Vorschau öffnen
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Quick Links */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Was möchten Sie als nächstes tun?</CardTitle>
          <CardDescription>
            Hier sind einige empfohlene nächste Schritte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => router.push('/dashboard/menu')}
            >
              <ChefHat className="mr-3 h-5 w-5 text-gray-500" />
              <div className="text-left">
                <p className="font-medium">Speisekarte vervollständigen</p>
                <p className="text-sm text-gray-500">Fügen Sie Bilder, Beschreibungen und weitere Artikel hinzu</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => router.push('/dashboard/orders')}
            >
              <ShoppingCart className="mr-3 h-5 w-5 text-gray-500" />
              <div className="text-left">
                <p className="font-medium">Bestellungen verwalten</p>
                <p className="text-sm text-gray-500">Sehen Sie eingehende Bestellungen in Echtzeit</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => router.push('/dashboard/settings')}
            >
              <Settings className="mr-3 h-5 w-5 text-gray-500" />
              <div className="text-left">
                <p className="font-medium">Einstellungen anpassen</p>
                <p className="text-sm text-gray-500">Logo hochladen, Öffnungszeiten und mehr</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Start Button */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Bereit loszulegen?</h3>
              <p className="text-white/90">
                Ihr Dashboard wartet auf Sie
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => router.push('/dashboard')}
            >
              <Rocket className="mr-2 h-5 w-5" />
              Zum Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}