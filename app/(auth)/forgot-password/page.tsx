'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import LanguageSelector from '@/components/language-selector'
import { translations, type Language } from '@/lib/translations'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [language, setLanguage] = useState<Language>('de')
  
  const t = translations[language].forgotPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error(t.errors.emailRequired)
      return
    }

    setLoading(true)

    try {
      // TODO: Implementiere Password-Reset API
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        setSent(true)
        toast.success(t.emailSent)
      } else {
        const data = await response.json()
        throw new Error(data.error || t.errors.emailSendError)
      }
    } catch (error: any) {
      console.error('Forgot password error:', error)
      toast.error(error.message || t.errors.genericError)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
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
            <CardTitle className="text-2xl">{t.emailSent}</CardTitle>
            <CardDescription className="mt-2">
              {t.emailSentDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                {t.checkEmail} <strong>{email}</strong> {t.followInstructions}
              </AlertDescription>
            </Alert>
            
            <p className="text-sm text-muted-foreground text-center mt-4">
              {t.noEmailReceived}{' '}
              <button
                onClick={() => {
                  setSent(false)
                  setEmail('')
                }}
                className="text-primary hover:underline"
              >
                {t.tryAgain}
              </button>
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
{t.backToLogin}
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
              <Label htmlFor="email">{t.email}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                {t.linkValid}
              </AlertDescription>
            </Alert>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.sendingEmail}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {t.sendEmail}
                </>
              )}
            </Button>
            
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
{t.backToLogin}
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}