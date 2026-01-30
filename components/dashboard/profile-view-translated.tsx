'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { User, Mail, Phone, Building, Calendar, Key, Shield } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface ProfileViewProps {
  user: any
}

export default function ProfileViewTranslated({ user }: ProfileViewProps) {
  const { language, t } = useLanguage()
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
        toast.success(t('profile.profileUpdated'))
        setIsEditing(false)
      } else {
        toast.error(t('profile.errorUpdating'))
      }
    } catch (error) {
      toast.error(t('profile.errorUpdating'))
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('profile.errorChangingPassword'))
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error(t('profile.errorChangingPassword'))
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
        toast.success(t('profile.passwordChanged'))
        setIsChangingPassword(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        toast.error(t('profile.errorChangingPassword'))
      }
    } catch (error) {
      toast.error(t('profile.errorChangingPassword'))
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
    <div className={`space-y-6 ${language === 'ar' ? 'rtl:space-x-reverse' : ''}`}>
      <div>
        <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
        <p className="text-gray-600">{t('profile.subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Overview */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">
                  {getInitials(user.name || user.email)}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{user.name || t('profile.name')}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span className="font-medium">{t('profile.role')}:</span>
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
              <span className="font-medium">{t('profile.memberSince')}:</span>
              <span>
                {user.createdAt 
                  ? new Date(user.createdAt).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'ar' ? 'ar-SA' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : '-'
                }
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t('profile.personalInfo')}</CardTitle>
                <CardDescription>
                  {t('profile.updateInfo')}
                </CardDescription>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  {t('common.edit')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <User className="inline-block h-4 w-4 mr-2" />
                  {t('profile.name')}
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
                  {t('profile.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">{t('profile.email')} kann nicht geändert werden</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="inline-block h-4 w-4 mr-2" />
                  {t('profile.phone')}
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
                  {t('common.save')}
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
                  {t('common.cancel')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  <Key className="inline-block h-5 w-5 mr-2" />
                  {t('profile.security')}
                </CardTitle>
                <CardDescription>
                  {t('profile.changePassword')}
                </CardDescription>
              </div>
              {!isChangingPassword && (
                <Button
                  variant="outline"
                  onClick={() => setIsChangingPassword(true)}
                >
                  {t('profile.changePassword')}
                </Button>
              )}
            </div>
          </CardHeader>
          
          {isChangingPassword && (
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t('profile.currentPassword')}</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">Min. 8 Zeichen</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('profile.confirmPassword')}</Label>
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
                  {t('profile.changePassword')}
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
                  {t('common.cancel')}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}