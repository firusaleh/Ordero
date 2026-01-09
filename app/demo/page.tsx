'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, ChevronLeft, Play, Pause, RotateCcw, Check, ShoppingCart, Clock, Users, TrendingUp, Menu, QrCode, CreditCard, Globe, Smartphone, Monitor, Settings, ChefHat, Coffee, Pizza, Salad } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const demoSteps = [
  {
    id: 1,
    title: "Willkommen bei Ordero",
    subtitle: "Die komplette Restaurant-Management-Lösung",
    description: "Digitalisieren Sie Ihr Restaurant mit QR-Code-Bestellungen, Echtzeit-Auftragsmanagement und nahtloser POS-Integration.",
    features: [
      "QR-Code Bestellsystem",
      "Echtzeit Dashboard",
      "Multi-Restaurant Support",
      "POS Integration"
    ],
    mockScreen: "welcome"
  },
  {
    id: 2,
    title: "QR-Code Tischbestellung",
    subtitle: "Gäste bestellen direkt vom Tisch",
    description: "Ihre Gäste scannen einfach den QR-Code auf dem Tisch und können sofort bestellen - ohne App-Download, ohne Wartezeit.",
    features: [
      "Kontaktlose Bestellung",
      "Mehrsprachiges Menü",
      "Echtzeit-Updates",
      "Mobile optimiert"
    ],
    mockScreen: "qr-ordering"
  },
  {
    id: 3,
    title: "Digitale Speisekarte",
    subtitle: "Ansprechend und immer aktuell",
    description: "Präsentieren Sie Ihre Speisen mit hochwertigen Bildern, detaillierten Beschreibungen und Allergeninformationen.",
    features: [
      "Kategorisierte Menüs",
      "Produktbilder",
      "Allergene & Zusatzstoffe",
      "Preisanpassungen in Echtzeit"
    ],
    mockScreen: "menu"
  },
  {
    id: 4,
    title: "Echtzeit-Dashboard",
    subtitle: "Alle Bestellungen im Blick",
    description: "Verwalten Sie eingehende Bestellungen, verfolgen Sie den Status und behalten Sie den Überblick über Ihre Umsätze.",
    features: [
      "Live-Bestellübersicht",
      "Statusverwaltung",
      "Küchen-Display",
      "Umsatzstatistiken"
    ],
    mockScreen: "dashboard"
  },
  {
    id: 5,
    title: "POS-Integration",
    subtitle: "Nahtlose Verbindung zu Ihrem Kassensystem",
    description: "Ordero integriert sich perfekt mit führenden POS-Systemen wie Lightspeed, Square und mehr.",
    features: [
      "Automatische Synchronisation",
      "Bestandsverwaltung",
      "Unified Reporting",
      "Keine doppelte Dateneingabe"
    ],
    mockScreen: "pos"
  },
  {
    id: 6,
    title: "Analytics & Insights",
    subtitle: "Datengetriebene Entscheidungen",
    description: "Detaillierte Analysen zu Bestellverhalten, beliebten Gerichten und Umsatzentwicklung.",
    features: [
      "Umsatzberichte",
      "Beliebte Produkte",
      "Kundenverhalten",
      "Trends & Prognosen"
    ],
    mockScreen: "analytics"
  },
  {
    id: 7,
    title: "Multi-Restaurant Management",
    subtitle: "Verwalten Sie mehrere Standorte",
    description: "Perfekt für Restaurantketten - verwalten Sie alle Ihre Standorte von einem zentralen Dashboard aus.",
    features: [
      "Zentrale Verwaltung",
      "Standort-spezifische Menüs",
      "Übergreifende Berichte",
      "Rollen & Berechtigungen"
    ],
    mockScreen: "multi-restaurant"
  },
  {
    id: 8,
    title: "Starten Sie heute!",
    subtitle: "Bereit für die digitale Transformation?",
    description: "Schließen Sie sich hunderten von Restaurants an, die bereits mit Ordero ihre Prozesse optimiert haben.",
    features: [
      "14 Tage kostenlos testen",
      "Keine Kreditkarte erforderlich",
      "Persönlicher Support",
      "Schnelle Einrichtung"
    ],
    mockScreen: "cta"
  }
]

const MockScreen = ({ type }: { type: string }) => {
  const [orderCount, setOrderCount] = useState(12)
  const [revenue, setRevenue] = useState(1842.50)

  useEffect(() => {
    if (type === 'dashboard') {
      const interval = setInterval(() => {
        setOrderCount(prev => prev + Math.floor(Math.random() * 3))
        setRevenue(prev => prev + (Math.random() * 50))
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [type])

  switch (type) {
    case 'welcome':
      return (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-8 h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Coffee className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Ordero</h3>
            <p className="text-gray-600">Restaurant Management System</p>
          </div>
        </div>
      )
    
    case 'qr-ordering':
      return (
        <div className="bg-white rounded-lg p-8 h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="bg-black p-4 rounded-lg inline-block mb-4">
              <QrCode className="w-32 h-32 text-white" />
            </div>
            <p className="text-sm text-gray-600 mb-2">Scannen Sie den QR-Code</p>
            <div className="flex items-center justify-center gap-2">
              <Smartphone className="w-5 h-5 text-green-500" />
              <span className="text-green-500 font-semibold">Bereit zum Bestellen</span>
            </div>
          </div>
        </div>
      )
    
    case 'menu':
      return (
        <div className="bg-white rounded-lg p-6 h-[400px] overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="w-20 h-20 bg-orange-100 rounded-lg flex items-center justify-center">
                <Pizza className="w-10 h-10 text-orange-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Margherita Pizza</h4>
                <p className="text-sm text-gray-600">Tomaten, Mozzarella, Basilikum</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-orange-500">€12.90</span>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    <ShoppingCart className="w-4 h-4 mr-1" /> Hinzufügen
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center">
                <Salad className="w-10 h-10 text-green-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Caesar Salat</h4>
                <p className="text-sm text-gray-600">Römersalat, Parmesan, Croutons</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-orange-500">€9.50</span>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    <ShoppingCart className="w-4 h-4 mr-1" /> Hinzufügen
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="w-20 h-20 bg-amber-100 rounded-lg flex items-center justify-center">
                <ChefHat className="w-10 h-10 text-amber-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Pasta Carbonara</h4>
                <p className="text-sm text-gray-600">Spaghetti, Ei, Pancetta, Parmesan</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-orange-500">€14.50</span>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    <ShoppingCart className="w-4 h-4 mr-1" /> Hinzufügen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    
    case 'dashboard':
      return (
        <div className="bg-gray-50 rounded-lg p-6 h-[400px]">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="w-8 h-8 text-orange-500" />
                <Badge className="bg-green-100 text-green-700">Live</Badge>
              </div>
              <p className="text-2xl font-bold">{orderCount}</p>
              <p className="text-sm text-gray-600">Bestellungen heute</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <span className="text-sm text-green-500">+12%</span>
              </div>
              <p className="text-2xl font-bold">€{revenue.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Umsatz heute</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">18 min</p>
              <p className="text-sm text-gray-600">Ø Bearbeitungszeit</p>
            </Card>
          </div>
          <div className="space-y-2">
            <div className="bg-white rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-yellow-100 text-yellow-700">Neu</Badge>
                <div>
                  <p className="font-semibold">Tisch 12</p>
                  <p className="text-sm text-gray-600">2x Margherita, 1x Caesar Salat</p>
                </div>
              </div>
              <Button size="sm" className="bg-green-500 hover:bg-green-600">
                Annehmen
              </Button>
            </div>
            <div className="bg-white rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-100 text-blue-700">In Bearbeitung</Badge>
                <div>
                  <p className="font-semibold">Tisch 8</p>
                  <p className="text-sm text-gray-600">1x Pasta Carbonara</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Fertig
              </Button>
            </div>
          </div>
        </div>
      )
    
    case 'pos':
      return (
        <div className="bg-white rounded-lg p-8 h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                <Monitor className="w-10 h-10 text-gray-600" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="w-12 h-0.5 bg-green-500"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="w-20 h-20 bg-orange-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-10 h-10 text-orange-500" />
              </div>
            </div>
            <p className="text-green-500 font-semibold mb-2">Verbunden mit Lightspeed POS</p>
            <p className="text-sm text-gray-600">Automatische Synchronisation aktiv</p>
          </div>
        </div>
      )
    
    case 'analytics':
      return (
        <div className="bg-white rounded-lg p-6 h-[400px]">
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Umsatzentwicklung</h4>
            <div className="h-32 bg-gradient-to-r from-orange-100 to-orange-50 rounded-lg flex items-end p-2 gap-1">
              {[40, 65, 45, 70, 85, 90, 75, 95, 88, 92].map((height, i) => (
                <div key={i} className="flex-1 bg-orange-500 rounded-t" style={{ height: `${height}%` }}></div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-3">
              <p className="text-sm text-gray-600 mb-1">Beliebtestes Gericht</p>
              <p className="font-semibold">Margherita Pizza</p>
              <p className="text-sm text-green-500">324 Bestellungen</p>
            </Card>
            <Card className="p-3">
              <p className="text-sm text-gray-600 mb-1">Stoßzeit heute</p>
              <p className="font-semibold">19:00 - 20:00</p>
              <p className="text-sm text-blue-500">42 Bestellungen</p>
            </Card>
          </div>
        </div>
      )
    
    case 'multi-restaurant':
      return (
        <div className="bg-gray-50 rounded-lg p-6 h-[400px]">
          <div className="space-y-3">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Berlin Mitte</h4>
                  <p className="text-sm text-gray-600">Hauptstraße 123</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-700">Online</Badge>
                  <p className="text-sm font-semibold mt-1">€2,842.50</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Berlin Friedrichshain</h4>
                  <p className="text-sm text-gray-600">Warschauer Str. 45</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-700">Online</Badge>
                  <p className="text-sm font-semibold mt-1">€1,923.75</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">München Schwabing</h4>
                  <p className="text-sm text-gray-600">Leopoldstraße 78</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-700">Online</Badge>
                  <p className="text-sm font-semibold mt-1">€3,156.00</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    
    case 'cta':
      return (
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-8 h-[400px] flex items-center justify-center text-white">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">Bereit loszulegen?</h3>
            <p className="mb-6">Keine Kreditkarte erforderlich • 14 Tage kostenlos testen</p>
            <Button size="lg" className="bg-white text-orange-500 hover:bg-gray-100">
              Jetzt starten
            </Button>
            <div className="mt-8 flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold">500+</p>
                <p className="text-sm">Restaurants</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">50K+</p>
                <p className="text-sm">Bestellungen/Tag</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">4.9★</p>
                <p className="text-sm">Bewertung</p>
              </div>
            </div>
          </div>
        </div>
      )
    
    default:
      return null
  }
}

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const currentDemo = demoSteps[currentStep]

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (currentStep < demoSteps.length - 1) {
              setCurrentStep(curr => curr + 1)
              return 0
            } else {
              setIsPlaying(false)
              return 100
            }
          }
          return prev + 2
        })
      }, 100)
    }

    return () => clearInterval(interval)
  }, [isPlaying, currentStep])

  useEffect(() => {
    setProgress(0)
  }, [currentStep])

  const handleNext = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1)
      setProgress(0)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setProgress(0)
    }
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setProgress(0)
    setIsPlaying(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Ordero Demo
          </h1>
          <p className="text-lg text-gray-600">
            Entdecken Sie, wie Ordero Ihr Restaurant transformieren kann
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="text-orange-500 border-orange-500">
                  Schritt {currentStep + 1} von {demoSteps.length}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRestart}
                    disabled={currentStep === 0 && progress === 0}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentDemo.title}
                  </h2>
                  <p className="text-lg text-orange-600 mb-4">
                    {currentDemo.subtitle}
                  </p>
                  <p className="text-gray-600 mb-6">
                    {currentDemo.description}
                  </p>

                  <div className="space-y-3">
                    {currentDemo.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-orange-500" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Fortschritt</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Zurück
                </Button>
                <div className="flex items-center gap-1">
                  {demoSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentStep(index)
                        setProgress(0)
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentStep
                          ? 'bg-orange-500 w-6'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
                <Button
                  onClick={handleNext}
                  disabled={currentStep === demoSteps.length - 1}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Weiter
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>

          <div>
            <Card className="p-2 bg-gray-100">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-xs text-gray-400">ordero.de</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MockScreen type={currentDemo.mockScreen} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </Card>

            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Schnelle Navigation</h3>
              <div className="grid grid-cols-2 gap-2">
                {demoSteps.map((step, index) => (
                  <Button
                    key={index}
                    variant={index === currentStep ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setCurrentStep(index)
                      setProgress(0)
                    }}
                    className={index === currentStep ? 'bg-orange-500 hover:bg-orange-600' : ''}
                  >
                    {step.title}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}