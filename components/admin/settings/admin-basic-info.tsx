'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2, Store, Phone, Mail, MapPin, Save } from 'lucide-react'

const basicInfoSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  description: z.string().min(10, 'Beschreibung muss mindestens 10 Zeichen lang sein'),
  phone: z.string().min(5, 'Telefonnummer ist erforderlich'),
  email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
  website: z.string().url('Gültige Website-URL erforderlich').optional().or(z.literal('')),
  street: z.string().min(5, 'Straße und Hausnummer erforderlich'),
  city: z.string().min(2, 'Stadt ist erforderlich'),
  postalCode: z.string().min(4, 'Postleitzahl ist erforderlich'),
  country: z.string().min(2, 'Land ist erforderlich'),
})

type BasicInfoFormValues = z.infer<typeof basicInfoSchema>

interface AdminBasicInfoProps {
  restaurantId: string
  initialData?: Partial<BasicInfoFormValues>
}

export default function AdminBasicInfo({ restaurantId, initialData }: AdminBasicInfoProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      website: initialData?.website || '',
      street: initialData?.street || '',
      city: initialData?.city || '',
      postalCode: initialData?.postalCode || '',
      country: initialData?.country || 'Deutschland',
    },
  })

  const onSubmit = async (values: BasicInfoFormValues) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/admin/restaurants/${restaurantId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Fehler beim Speichern')
      }

      toast.success('Grundinformationen erfolgreich aktualisiert')
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Ein unerwarteter Fehler ist aufgetreten'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Store className="h-6 w-6" />
          Grundinformationen
        </h2>
        <p className="text-gray-600 mt-2">
          Verwalten Sie die grundlegenden Informationen Ihres Restaurants
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Restaurant Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Restaurant Details
              </CardTitle>
              <CardDescription>
                Grundlegende Informationen über Ihr Restaurant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restaurant Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Mein Restaurant"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail Adresse *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="info@restaurant.de"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschreibung *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Beschreiben Sie Ihr Restaurant und was es besonders macht..."
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Diese Beschreibung wird auf Ihrer öffentlichen Restaurant-Seite angezeigt
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefonnummer *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+49 30 12345678"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://restaurant.de"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Optional: Link zu Ihrer Restaurant-Website
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Adresse
              </CardTitle>
              <CardDescription>
                Die Adresse Ihres Restaurants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Straße und Hausnummer *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Musterstraße 123"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postleitzahl *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="10115"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stadt *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Berlin"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Land *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Deutschland"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              size="lg"
              disabled={isLoading}
              className="min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Speichern
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}