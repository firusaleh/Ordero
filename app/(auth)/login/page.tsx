"use client"

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { handleLogin } from '@/app/actions/login'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import LanguageSelector from '@/components/language-selector'
import { translations, type Language } from '@/lib/translations'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [language, setLanguage] = useState<Language>('de')
  const [loginError, setLoginError] = useState<string | null>(null)
  
  const t = translations[language].login

  const loginSchema = z.object({
    email: z.string().email(t.errors.invalidCredentials),
    password: z.string().min(1, t.errors.invalidCredentials),
  })

  type LoginFormData = z.infer<typeof loginSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setLoginError(null) // Reset error before new attempt
    
    try {
      const result = await handleLogin(data.email, data.password)

      if (result?.error) {
        // Zeige Fehlermeldung direkt im UI
        setLoginError(result.error)
        // Auch als Toast für zusätzliche Sichtbarkeit
        toast.error(result.error, {
          duration: 5000,
          position: 'top-center',
          style: {
            background: '#dc2626',
            color: '#ffffff',
            border: '1px solid #b91c1c',
          }
        })
        setIsLoading(false)
      } else {
        // Login war erfolgreich - Server macht den Redirect
        toast.success('Anmeldung erfolgreich!', {
          duration: 2000,
          position: 'top-center'
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      setLoginError(errorMessage)
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#dc2626',
          color: '#ffffff',
          border: '1px solid #b91c1c',
        }
      })
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
            {/* Fehleranzeige direkt im Formular */}
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start space-x-2">
                <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{loginError}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t.emailPlaceholder}
                disabled={isLoading}
                {...register('email')}
                dir="ltr"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.passwordPlaceholder}
                  disabled={isLoading}
                  {...register('password')}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
            <div className="flex items-center justify-between">
              <Link 
                href="/forgot-password" 
                className="text-sm text-blue-600 hover:underline"
              >
                {t.forgotPassword}
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? t.loggingIn : t.loginButton}
            </Button>
            <div className="text-sm text-center text-gray-600">
              {t.noAccount}{' '}
              <Link 
                href="/register" 
                className="text-blue-600 hover:underline font-medium"
              >
                {t.registerNow}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}