'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import LanguageSelector from '@/components/language-selector'
import { translations, type Language } from '@/lib/translations'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [language, setLanguage] = useState<Language>('de')
  
  const t = translations[language].resetPassword

  useEffect(() => {
    if (!token) {
      setError(t.error.tokenNotFound)
    }
  }, [token])

  const validatePassword = () => {
    if (password.length < 8) {
      toast.error(t.validation.passwordTooShortToast)
      return false
    }
    if (password !== confirmPassword) {
      toast.error(t.validation.passwordMismatchToast)
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePassword()) return
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      if (response.ok) {
        setSuccess(true)
        toast.success(t.errors.successToast)
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        const data = await response.json()
        throw new Error(data.error || t.errors.resetError)
      }
    } catch (error: any) {
      console.error('Reset password error:', error)
      toast.error(error.message || t.errors.resetError)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 p-4">
        <div className="absolute top-4 right-4 z-10">
          <LanguageSelector 
            currentLang={language}
            onLanguageChange={(lang) => setLanguage(lang)}
          />
        </div>
        
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">{t.success.title}</CardTitle>
            <CardDescription className="mt-2">
              {t.success.description}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button className="w-full">
{t.success.loginNow}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (error && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 p-4">
        <div className="absolute top-4 right-4 z-10">
          <LanguageSelector 
            currentLang={language}
            onLanguageChange={(lang) => setLanguage(lang)}
          />
        </div>
        
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">{t.error.invalidToken}</CardTitle>
            <CardDescription className="mt-2">
              {error}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Link href="/forgot-password" className="w-full">
              <Button className="w-full">
{t.error.requestNewLink}
              </Button>
            </Link>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
{t.error.goToLogin}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 p-4">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector 
          currentLang={language}
          onLanguageChange={(lang) => setLanguage(lang)}
        />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{t.title}</CardTitle>
          <CardDescription>
            {t.subtitle}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t.newPassword}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder={t.passwordPlaceholder}
                  required
                  disabled={loading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  placeholder={t.confirmPasswordPlaceholder}
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t.validation.passwordMismatch}
                </AlertDescription>
              </Alert>
            )}

            {password && password.length > 0 && password.length < 8 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t.validation.passwordTooShort}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !password || !confirmPassword || password !== confirmPassword || password.length < 8}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.resetting}
                </>
              ) : (
t.resetButton
              )}
            </Button>
            
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
{t.cancel}
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}