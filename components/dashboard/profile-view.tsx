'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { User, Mail, Phone, Building, Calendar, Key, Shield } from 'lucide-react'

interface ProfileViewProps {
  user: any
}

export default function ProfileView({ user }: ProfileViewProps) {
  const { t } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleSave = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(t('toast.profileUpdated'))
        setIsEditing(false)
      } else {
        toast.error(t('toast.profileUpdateError'))
      }
    } catch (error) {
      toast.error(t('toast.profileUpdateError'))
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('toast.passwordMismatch'))
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error(t('toast.passwordTooShort'))
      return
    }

    try {
      const response = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      if (response.ok) {
        toast.success(t('toast.passwordChanged'))
        setIsChangingPassword(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        toast.error(t('toast.passwordChangeError'))
      }
    } catch (error) {
      toast.error(t('toast.passwordChangeErrorGeneral'))
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('profile.title') || 'Mein Profil'}</h1>
        <p className="text-gray-600">{t('profile.subtitle') || 'Verwalten Sie Ihre persönlichen Informationen'}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profil-Übersicht */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">
                  {getInitials(user.name || user.email)}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{user.name || t('profile.noName') || 'Kein Name'}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Rolle:</span>
              <span>{user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Restaurant Owner'}</span>
            </div>
            {user.restaurantId && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building className="h-4 w-4" />
                <span className="font-medium">Restaurant ID:</span>
                <span className="text-xs font-mono">{user.restaurantId}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Mitglied seit:</span>
              <span>{new Date(user.createdAt || Date.now()).toLocaleDateString('de-DE')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Profil-Informationen */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Persönliche Informationen</CardTitle>
                <CardDescription>
                  Aktualisieren Sie Ihre persönlichen Daten
                </CardDescription>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  Bearbeiten
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <User className="inline-block h-4 w-4 mr-2" />
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="inline-block h-4 w-4 mr-2" />
                  E-Mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">E-Mail kann nicht geändert werden</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="inline-block h-4 w-4 mr-2" />
                  Telefon
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="+49 123 456789"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave}>
                  Speichern
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      name: user.name || '',
                      email: user.email || '',
                      phone: ''
                    })
                  }}
                >
                  Abbrechen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Passwort ändern */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  <Key className="inline-block h-5 w-5 mr-2" />
                  Sicherheit
                </CardTitle>
                <CardDescription>
                  Ändern Sie Ihr Passwort
                </CardDescription>
              </div>
              {!isChangingPassword && (
                <Button
                  variant="outline"
                  onClick={() => setIsChangingPassword(true)}
                >
                  Passwort ändern
                </Button>
              )}
            </div>
          </CardHeader>
          
          {isChangingPassword && (
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Neues Passwort</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">Min. 8 Zeichen</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button onClick={handlePasswordChange}>
                  Passwort ändern
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false)
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    })
                  }}
                >
                  Abbrechen
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}