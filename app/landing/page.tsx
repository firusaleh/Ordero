'use client'

import { useState, useEffect } from 'react'
import { landingTranslations, type LandingLanguage } from '@/lib/i18n/landing-translations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Menu, 
  X, 
  ChevronRight, 
  Star, 
  Check,
  Globe,
  Smartphone,
  TrendingUp,
  Clock,
  CreditCard,
  BarChart,
  Settings,
  Languages
} from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  const [language, setLanguage] = useState<LandingLanguage>('de')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const t = landingTranslations[language]

  useEffect(() => {
    // Detect browser language
    const browserLang = navigator.language.toLowerCase()
    if (browserLang.startsWith('ar')) {
      setLanguage('ar')
    } else if (browserLang.startsWith('en')) {
      setLanguage('en')
    } else {
      setLanguage('de')
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Set RTL for Arabic
    document.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  const features = [
    { icon: Smartphone, key: 'qrOrdering' },
    { icon: Languages, key: 'multiLanguage' },
    { icon: Clock, key: 'realtime' },
    { icon: CreditCard, key: 'payment' },
    { icon: BarChart, key: 'analytics' },
    { icon: Settings, key: 'management' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all ${scrolled ? 'bg-gray-900/95 backdrop-blur-md shadow-lg' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Oriido
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="hover:text-orange-500 transition-colors">
                {t.nav.features}
              </a>
              <a href="#pricing" className="hover:text-orange-500 transition-colors">
                {t.nav.pricing}
              </a>
              <a href="#contact" className="hover:text-orange-500 transition-colors">
                {t.nav.contact}
              </a>
              <Link href="/login">
                <Button variant="ghost">{t.nav.login}</Button>
              </Link>
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                {t.nav.demo}
              </Button>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-4">
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as LandingLanguage)}
                className="bg-transparent border border-gray-600 rounded px-2 py-1 text-sm"
              >
                <option value="de" className="bg-gray-900">🇩🇪 DE</option>
                <option value="en" className="bg-gray-900">🇬🇧 EN</option>
                <option value="ar" className="bg-gray-900">🇸🇦 AR</option>
              </select>

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden"
              >
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-700">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="hover:text-orange-500 transition-colors">
                  {t.nav.features}
                </a>
                <a href="#pricing" className="hover:text-orange-500 transition-colors">
                  {t.nav.pricing}
                </a>
                <a href="#contact" className="hover:text-orange-500 transition-colors">
                  {t.nav.contact}
                </a>
                <Link href="/login">
                  <Button variant="ghost" className="w-full">{t.nav.login}</Button>
                </Link>
                <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500">
                  {t.nav.demo}
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            {t.hero.title}
          </h1>
          <h2 className="text-2xl md:text-3xl mb-6 text-gray-300">
            {t.hero.subtitle}
          </h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            {t.hero.description}
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
              {t.hero.cta.primary}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
              {t.hero.cta.secondary}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold text-orange-500">{t.hero.stats.revenue}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold text-green-500">{t.hero.stats.time}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold text-blue-500">{t.hero.stats.orders}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-gray-800/30">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            {t.features.title}
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            {t.features.subtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, key }) => (
              <Card key={key} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <Icon className="h-12 w-12 text-orange-500 mb-4" />
                  <CardTitle className="text-white">
                    {t.features.items[key as keyof typeof t.features.items].title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">
                    {t.features.items[key as keyof typeof t.features.items].description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            {t.pricing.title}
          </h2>
          <p className="text-center text-gray-400 mb-4">
            {t.pricing.subtitle}
          </p>
          <p className="text-center text-orange-500 font-semibold mb-12">
            {t.pricing.trial}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {Object.entries(t.pricing.plans).map(([key, plan]) => (
              <Card key={key} className={`bg-gray-800 border-gray-700 ${key === 'professional' ? 'ring-2 ring-orange-500' : ''}`}>
                <CardHeader>
                  {key === 'professional' && 'popular' in plan && (
                    <Badge className="w-fit mb-2 bg-orange-500">{plan.popular}</Badge>
                  )}
                  <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className={`w-full ${key === 'professional' ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    {t.pricing.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-gray-800/30">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            {t.testimonials.title}
          </h2>
          <p className="text-center text-gray-400 mb-12">
            {t.testimonials.subtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {t.testimonials.items.map((item, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex mb-4">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 italic mb-4">"{item.content}"</p>
                  <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-gray-400">{item.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.cta.title}
          </h2>
          <p className="text-gray-400 mb-8">
            {t.cta.subtitle}
          </p>
          <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 mb-4">
            {t.cta.button}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-sm text-gray-500">
            {t.cta.noCard}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4 text-white">{t.footer.company.title}</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.company.about}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.company.careers}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.company.blog}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.company.press}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">{t.footer.product.title}</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.product.features}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.product.pricing}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.product.demo}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.product.api}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">{t.footer.support.title}</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.support.help}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.support.contact}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.support.status}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.support.docs}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">{t.footer.legal.title}</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.legal.privacy}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.legal.terms}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.legal.imprint}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.legal.cookies}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 mb-2">{t.footer.copyright}</p>
            <p className="text-gray-500 text-sm">{t.footer.madeWith}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}