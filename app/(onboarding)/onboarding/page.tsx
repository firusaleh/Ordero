"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Stepper from '@/components/onboarding/stepper'
import { generateSlug, generateSlugSuggestions, sanitizeSlug } from '@/lib/utils/slug'
import { useEffect, useCallback } from 'react'

const steps = [
  { id: 1, name: 'Restaurant', description: 'Grunddaten', href: '/onboarding' },
  { id: 2, name: 'Plan', description: 'Wählen', href: '/onboarding/plan' },
  { id: 3, name: 'Speisekarte', description: 'Erstellen', href: '/onboarding/menu' },
  { id: 4, name: 'Tische', description: 'QR-Codes', href: '/onboarding/tables' },
  { id: 5, name: 'Fertig', description: 'Los geht\'s', href: '/onboarding/complete' },
]

const restaurantSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  slug: z.string().min(3, 'URL-Name muss mindestens 3 Zeichen lang sein'),
  description: z.string().optional(),
  cuisine: z.string().min(1, 'Bitte wählen Sie eine Küche'),
  street: z.string().min(3, 'Straße erforderlich'),
  city: z.string().min(2, 'Stadt erforderlich'),
  postalCode: z.string().min(4, 'Postleitzahl erforderlich'),
  phone: z.string().min(6, 'Telefonnummer erforderlich'),
  email: z.string().email('Gültige E-Mail erforderlich'),
  website: z.string().url().optional().or(z.literal('')),
})

type RestaurantFormData = z.infer<typeof restaurantSchema>

const cuisineTypes = [
  { value: 'german', label: 'Deutsch' },
  { value: 'italian', label: 'Italienisch' },
  { value: 'asian', label: 'Asiatisch' },
  { value: 'greek', label: 'Griechisch' },
  { value: 'turkish', label: 'Türkisch' },
  { value: 'indian', label: 'Indisch' },
  { value: 'mexican', label: 'Mexikanisch' },
  { value: 'american', label: 'Amerikanisch' },
  { value: 'french', label: 'Französisch' },
  { value: 'spanish', label: 'Spanisch' },
  { value: 'cafe', label: 'Café' },
  { value: 'bakery', label: 'Bäckerei' },
  { value: 'other', label: 'Andere' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [slug, setSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [slugError, setSlugError] = useState('')
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([])
  const [checkingSlug, setCheckingSlug] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
  })

  const restaurantName = watch('name')

  // Generiere Slug automatisch wenn Restaurant-Name eingegeben wird
  useEffect(() => {
    if (restaurantName && restaurantName.length >= 2) {
      const generatedSlug = generateSlug(restaurantName)
      setSlug(generatedSlug)
      setValue('slug', generatedSlug)
      
      // Generiere Vorschläge
      const suggestions = generateSlugSuggestions(restaurantName)
      setSlugSuggestions(suggestions)
      
      // Prüfe Verfügbarkeit
      if (generatedSlug.length >= 3) {
        checkSlugAvailability(generatedSlug)
      }
    }
  }, [restaurantName, setValue])

  const checkSlugAvailability = useCallback(async (slugToCheck: string) => {
    if (!slugToCheck || slugToCheck.length < 3) {
      setSlugStatus('idle')
      return
    }

    setCheckingSlug(true)
    setSlugStatus('checking')
    setSlugError('')

    try {
      const response = await fetch('/api/slug/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slugToCheck }),
      })

      const data = await response.json()

      if (data.available) {
        setSlugStatus('available')
      } else {
        setSlugStatus('taken')
        setSlugError(data.error || 'Dieser Name ist bereits vergeben')
      }
    } catch (error) {
      setSlugStatus('idle')
      setSlugError('Fehler bei der Überprüfung')
    } finally {
      setCheckingSlug(false)
    }
  }, [])

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlug = sanitizeSlug(e.target.value)
    setSlug(newSlug)
    setValue('slug', newSlug)
    
    if (newSlug.length >= 3) {
      checkSlugAvailability(newSlug)
    } else {
      setSlugStatus('idle')
      setSlugError('')
    }
  }

  const selectSuggestion = (suggestion: string) => {
    setSlug(suggestion)
    setValue('slug', suggestion)
    checkSlugAvailability(suggestion)
  }

  const onSubmit = async (data: RestaurantFormData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/onboarding/restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Fehler beim Speichern')
      }

      toast.success('Restaurant-Daten gespeichert!')
      router.push('/onboarding/plan')
    } catch (error: any) {
      toast.error('Fehler', {
        description: error.message || 'Bitte versuchen Sie es erneut.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Stepper steps={steps} currentStep={0} />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Restaurant-Informationen</CardTitle>
          <CardDescription>
            Erzählen Sie uns mehr über Ihr Restaurant. Diese Informationen werden in Ihrer digitalen Speisekarte angezeigt.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Grunddaten */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Restaurant Name *</Label>
                <Input
                  id="name"
                  placeholder="Restaurant Zur Post"
                  {...register('name')}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cuisine">Küche *</Label>
                <Select
                  onValueChange={(value) => setValue('cuisine', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie eine Küche" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisineTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cuisine && (
                  <p className="text-sm text-red-500">{errors.cuisine.message}</p>
                )}
              </div>
            </div>

            {/* URL-Name (Slug) */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                URL-Name *
                <span className="text-sm text-gray-500 ml-2">
                  (oriido.de/restaurant/{slug || 'ihr-restaurant'})
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="slug"
                  placeholder="ihr-restaurant"
                  value={slug}
                  onChange={handleSlugChange}
                  disabled={isLoading}
                  className={`pr-10 ${
                    slugStatus === 'available' ? 'border-green-500' : 
                    slugStatus === 'taken' ? 'border-red-500' : ''
                  }`}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {checkingSlug && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  )}
                  {!checkingSlug && slugStatus === 'available' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {!checkingSlug && slugStatus === 'taken' && (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              {slugError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {slugError}
                </p>
              )}
              {slugStatus === 'available' && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Dieser Name ist verfügbar!
                </p>
              )}
              {errors.slug && (
                <p className="text-sm text-red-500">{errors.slug.message}</p>
              )}
              
              {/* Slug-Vorschläge */}
              {slugSuggestions.length > 0 && slugStatus === 'taken' && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">Verfügbare Alternativen:</p>
                  <div className="flex flex-wrap gap-2">
                    {slugSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => selectSuggestion(suggestion)}
                        className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                        disabled={isLoading}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                placeholder="Beschreiben Sie Ihr Restaurant in wenigen Sätzen..."
                rows={3}
                {...register('description')}
                disabled={isLoading}
              />
            </div>

            {/* Adresse */}
            <div className="space-y-4">
              <h3 className="font-medium">Adresse</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">Straße und Hausnummer *</Label>
                  <Input
                    id="street"
                    placeholder="Musterstraße 123"
                    {...register('street')}
                    disabled={isLoading}
                  />
                  {errors.street && (
                    <p className="text-sm text-red-500">{errors.street.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postleitzahl *</Label>
                  <Input
                    id="postalCode"
                    placeholder="12345"
                    {...register('postalCode')}
                    disabled={isLoading}
                  />
                  {errors.postalCode && (
                    <p className="text-sm text-red-500">{errors.postalCode.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">Stadt *</Label>
                  <Input
                    id="city"
                    placeholder="Berlin"
                    {...register('city')}
                    disabled={isLoading}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-500">{errors.city.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Kontakt */}
            <div className="space-y-4">
              <h3 className="font-medium">Kontakt</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+49 123 456789"
                    {...register('phone')}
                    disabled={isLoading}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="info@restaurant.de"
                    {...register('email')}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://www.restaurant.de"
                    {...register('website')}
                    disabled={isLoading}
                  />
                  {errors.website && (
                    <p className="text-sm text-red-500">{errors.website.message}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
              disabled={isLoading}
            >
              Später fortsetzen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  Weiter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  )
}