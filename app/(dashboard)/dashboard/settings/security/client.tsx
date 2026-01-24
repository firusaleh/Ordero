'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Shield, Key, Lock, UserCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { showErrorToast, showSuccessToast, parseApiResponse } from '@/lib/error-handling'
import { useLanguage } from '@/contexts/language-context'

export default function SecuritySettingsClient() {
  const { t } = useLanguage()
  const [twoFactor, setTwoFactor] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState('30')
  const [passwordExpiry, setPasswordExpiry] = useState('90')
  const [loginAttempts, setLoginAttempts] = useState('5')
  const [ipRestriction, setIpRestriction] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  const handlePasswordChange = async () => {
    setSaving('password')
    try {
      // Simuliere API-Call für Demo
      // In Produktion: const response = await fetch('/api/settings/security/password', {...})
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simuliere zufälligen Fehler für Demo (20% Chance)
          if (Math.random() < 0.2) {
            reject(new Error(t('settings.security.password.updateError')))
          } else {
            resolve(true)
          }
        }, 1000)
      })
      
      showSuccessToast(t('settings.security.password.updateSuccess'))
    } catch (error) {
      showErrorToast(error, t('settings.security.password.saveError'))
    } finally {
      setSaving(null)
    }
  }

  const handleSave = async () => {
    setSaving('session')
    try {
      // Validierung
      const timeout = parseInt(sessionTimeout)
      if (isNaN(timeout) || timeout < 5 || timeout > 1440) {
        throw new Error(t('settings.security.session.timeoutError'))
      }

      // Simuliere API-Call für Demo
      // In Produktion: const response = await fetch('/api/settings/security/session', {...})
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simuliere zufälligen Fehler für Demo (20% Chance)
          if (Math.random() < 0.2) {
            reject(new Error(t('common.connectionError')))
          } else {
            resolve(true)
          }
        }, 1000)
      })
      
      showSuccessToast(t('settings.security.saveSuccess'))
    } catch (error) {
      showErrorToast(error, t('settings.security.session.saveError'))
    } finally {
      setSaving(null)
    }
  }

  const handle2FAToggle = async (enabled: boolean) => {
    setTwoFactor(enabled)
    
    if (enabled) {
      setSaving('2fa')
      try {
        // In Produktion: API-Call zum Aktivieren von 2FA
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() < 0.2) {
              reject(new Error(t('settings.security.twoFactor.activationError')))
            } else {
              resolve(true)
            }
          }, 1000)
        })
        
        showSuccessToast(t('settings.security.twoFactor.activated'))
      } catch (error) {
        setTwoFactor(false) // Zurücksetzen bei Fehler
        showErrorToast(error, t('settings.security.twoFactor.enableError'))
      } finally {
        setSaving(null)
      }
    } else {
      showSuccessToast(t('settings.security.twoFactor.deactivated'))
    }
  }

  const handleAccessControl = async () => {
    setSaving('access')
    try {
      // Validierung
      const attempts = parseInt(loginAttempts)
      if (isNaN(attempts) || attempts < 1 || attempts > 10) {
        throw new Error(t('settings.security.access.attemptsError'))
      }

      // Simuliere API-Call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() < 0.2) {
            reject(new Error(t('settings.security.access.updateError')))
          } else {
            resolve(true)
          }
        }, 1000)
      })
      
      showSuccessToast(t('settings.security.access.updateSuccess'))
    } catch (error) {
      showErrorToast(error, t('settings.security.access.saveError'))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('settings.security.title')}</h1>
        <p className="text-gray-600">{t('settings.security.description')}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t('settings.security.password.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.security.password.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="passwordExpiry">{t('settings.security.password.expiry')}</Label>
              <Input
                id="passwordExpiry"
                type="number"
                value={passwordExpiry}
                onChange={(e) => setPasswordExpiry(e.target.value)}
                disabled={saving === 'password'}
              />
              <p className="text-sm text-gray-500 mt-1">
                {t('settings.security.password.expiryHelp')}
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="strongPassword">{t('settings.security.password.enforceStrong')}</Label>
              <Switch id="strongPassword" defaultChecked disabled={saving === 'password'} />
            </div>

            <Button 
              onClick={handlePasswordChange} 
              className="w-full"
              disabled={saving !== null}
            >
              {saving === 'password' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.security.password.save')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('settings.security.twoFactor.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.security.twoFactor.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="2fa">{t('settings.security.twoFactor.enable')}</Label>
              <Switch
                id="2fa"
                checked={twoFactor}
                onCheckedChange={handle2FAToggle}
                disabled={saving === '2fa'}
              />
            </div>

            {twoFactor && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  {t('settings.security.twoFactor.scanQR')}
                </p>
                <div className="mt-4 bg-white p-4 rounded flex items-center justify-center">
                  <div className="text-gray-400">{t('settings.security.twoFactor.qrPlaceholder')}</div>
                </div>
              </div>
            )}

            <Button disabled={!twoFactor || saving === '2fa'} className="w-full">
              {saving === '2fa' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.security.twoFactor.setup')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t('settings.security.session.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.security.session.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sessionTimeout">{t('settings.security.session.timeout')}</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                disabled={saving === 'session'}
                min="5"
                max="1440"
              />
              <p className="text-sm text-gray-500 mt-1">
                {t('settings.security.session.timeoutHelp')}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="singleSession">{t('settings.security.session.singleSession')}</Label>
              <Switch id="singleSession" disabled={saving === 'session'} />
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full"
              disabled={saving !== null}
            >
              {saving === 'session' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.security.session.save')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              {t('settings.security.access.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.security.access.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="loginAttempts">{t('settings.security.access.maxAttempts')}</Label>
              <Input
                id="loginAttempts"
                type="number"
                value={loginAttempts}
                onChange={(e) => setLoginAttempts(e.target.value)}
                disabled={saving === 'access'}
                min="1"
                max="10"
              />
              <p className="text-sm text-gray-500 mt-1">
                {t('settings.security.access.maxAttemptsHelp')}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ipRestriction">{t('settings.security.access.ipRestriction')}</Label>
              <Switch
                id="ipRestriction"
                checked={ipRestriction}
                onCheckedChange={setIpRestriction}
                disabled={saving === 'access'}
              />
            </div>

            {ipRestriction && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">
                      {t('settings.security.access.ipRestrictionActive')}
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {t('settings.security.access.ipRestrictionHelp')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleAccessControl} 
              className="w-full"
              disabled={saving !== null}
            >
              {saving === 'access' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.security.access.save')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}