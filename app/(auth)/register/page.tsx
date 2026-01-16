"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import LanguageSelector from '@/components/language-selector'
import { translations, type Language } from '@/lib/translations'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [language, setLanguage] = useState<Language>('de')
  const [country, setCountry] = useState<string>('DE')
  
  const t = translations[language].register

  const registerSchema = z.object({
    name: z.string().min(2, t.errors.weakPassword),
    email: z.string().email(t.errors.genericError),
    password: z.string().min(8, t.errors.weakPassword),
    confirmPassword: z.string(),
    restaurantName: z.string().min(2, t.errors.genericError),
    phone: z.string().optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t.errors.passwordMismatch,
    path: ['confirmPassword'],
  })

  type RegisterFormData = z.infer<typeof registerSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          restaurantName: data.restaurantName,
          phone: data.phone,
          country: country,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error?.includes('email')) {
          throw new Error(t.errors.emailExists)
        }
        throw new Error(result.error || t.errors.genericError)
      }

      toast.success('✓')
      
      // Automatisch anmelden nach Registrierung
      router.push('/login?registered=true')
    } catch (error: any) {
      toast.error(error.message || t.errors.genericError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector 
          currentLang={language}
          onLanguageChange={(lang) => setLanguage(lang)}
        />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t.title}
          </CardTitle>
          <CardDescription className="text-center">
            {t.subtitle}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.ownerName}</Label>
                <Input
                  id="name"
                  placeholder={t.ownerNamePlaceholder}
                  {...register('name')}
                  disabled={isLoading}
                  dir="ltr"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="restaurantName">{t.restaurantName}</Label>
                <Input
                  id="restaurantName"
                  placeholder={t.restaurantNamePlaceholder}
                  {...register('restaurantName')}
                  disabled={isLoading}
                  dir="ltr"
                />
                {errors.restaurantName && (
                  <p className="text-sm text-red-500">{errors.restaurantName.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t.emailPlaceholder}
                {...register('email')}
                disabled={isLoading}
                dir="ltr"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t.phone}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t.phonePlaceholder}
                  {...register('phone')}
                  disabled={isLoading}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{t.country}</Label>
                <Select value={country} onValueChange={setCountry} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectCountry} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DE">
                      <span className="flex items-center">
                        <span className="mr-2">🇩🇪</span>
                        {t.germany}
                      </span>
                    </SelectItem>
                    <SelectItem value="JO">
                      <span className="flex items-center">
                        <span className="mr-2">🇯🇴</span>
                        {t.jordan}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.passwordPlaceholder}
                  {...register('password')}
                  disabled={isLoading}
                  dir="ltr"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t.confirmPasswordPlaceholder}
                  {...register('confirmPassword')}
                  disabled={isLoading}
                  dir="ltr"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.registering}
                </>
              ) : (
                t.registerButton
              )}
            </Button>
            <p className="text-xs text-center text-gray-600">
              {t.termsPrefix}
              <Link href="/terms" className="text-blue-600 hover:underline">
                {t.termsLink}
              </Link>
              {t.termsMiddle}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                {t.privacyLink}
              </Link>
              {t.termsSuffix}
            </p>
            <div className="text-sm text-center text-gray-600">
              {t.haveAccount}{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                {t.loginNow}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}