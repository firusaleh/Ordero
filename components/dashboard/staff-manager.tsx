"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  UserPlus, 
  Mail,
  Shield,
  Clock,
  MoreVertical,
  Edit,
  Trash,
  Search,
  Crown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/language-context'
import { formatDistanceToNow } from 'date-fns'
import { de, enUS, ar } from 'date-fns/locale'

interface StaffMember {
  id: string
  name: string
  email: string
  role: 'manager' | 'waiter' | 'kitchen'
  isOwner: boolean
  createdAt: Date
}

interface StaffManagerProps {
  restaurantId: string
  staffMembers: StaffMember[]
  currentUserId: string
  isOwner: boolean
}

export default function StaffManager({ 
  restaurantId, 
  staffMembers: initialStaffMembers,
  currentUserId,
  isOwner
}: StaffManagerProps) {
  const { language, t } = useLanguage()
  const [staffMembers, setStaffMembers] = useState(initialStaffMembers)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'waiter' as const
  })

  const roleMap = {
    manager: { label: t('staff.manager'), color: 'bg-purple-500' },
    waiter: { label: t('staff.waiter'), color: 'bg-blue-500' },
    kitchen: { label: t('staff.kitchen'), color: 'bg-green-500' }
  }

  const getLocale = () => {
    switch (language) {
      case 'de': return de
      case 'ar': return ar
      default: return enUS
    }
  }

  const filteredStaff = staffMembers.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddStaff = async () => {
    if (!newStaff.email) {
      toast.error(t('staff.emailRequired') || 'E-Mail Adresse ist erforderlich')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Hinzufügen')
      }

      const data = await response.json()
      
      // Füge den neuen Mitarbeiter zur Liste hinzu
      setStaffMembers([...staffMembers, {
        id: data.staff.id,
        name: data.staff.user.name || newStaff.name || newStaff.email,
        email: data.staff.user.email,
        role: data.staff.role.toLowerCase() as 'waiter' | 'kitchen' | 'manager',
        isOwner: false,
        createdAt: new Date(data.staff.createdAt)
      }])
      
      toast.success(t('staff.staffAdded') || `Mitarbeiter ${newStaff.email} wurde hinzugefügt`)
      setIsAddDialogOpen(false)
      setNewStaff({ name: '', email: '', role: 'waiter' })
    } catch (error: any) {
      toast.error(error.message || t('staff.errorAddingStaff') || 'Fehler beim Hinzufügen des Mitarbeiters')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteStaff = async (member: StaffMember) => {
    if (member.isOwner) {
      toast.error('Der Besitzer kann nicht entfernt werden')
      return
    }

    if (!confirm(t('staff.removeConfirm') || `Möchten Sie ${member.name} wirklich entfernen?`)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/staff/${member.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Fehler beim Entfernen')
      }

      setStaffMembers(staffMembers.filter(s => s.id !== member.id))
      toast.success(t('staff.staffRemoved') || `${member.name} wurde entfernt`)
    } catch (error) {
      toast.error(t('staff.errorRemovingStaff') || 'Fehler beim Entfernen des Mitarbeiters')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRole = async (member: StaffMember, newRole: string) => {
    if (member.isOwner) {
      toast.error('Die Rolle des Besitzers kann nicht geändert werden')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/staff/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole.toUpperCase() })
      })

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren')
      }

      setStaffMembers(staffMembers.map(s => 
        s.id === member.id ? { ...s, role: newRole as any } : s
      ))
      toast.success('Rolle wurde aktualisiert')
    } catch (error) {
      toast.error('Fehler beim Aktualisieren der Rolle')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`p-6 space-y-6 ${language === 'ar' ? 'rtl:space-x-reverse' : ''}`}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('staff.title')}</h1>
          <p className="text-gray-600">{t('staff.subtitle')}</p>
        </div>
        {isOwner && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                {t('staff.addStaff')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('staff.inviteStaff')}</DialogTitle>
                <DialogDescription>
                  {t('staff.inviteTeamMembers')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('profile.name')} (Optional)</Label>
                  <Input
                    id="name"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    placeholder={t('profile.name')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('staff.emailAddress')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    placeholder={t('profile.email')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">{t('staff.role')}</Label>
                  <Select
                    value={newStaff.role}
                    onValueChange={(value: any) => setNewStaff({...newStaff, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('staff.selectRole')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">{t('staff.manager')}</SelectItem>
                      <SelectItem value="waiter">{t('staff.waiter')}</SelectItem>
                      <SelectItem value="kitchen">{t('staff.kitchen')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleAddStaff} disabled={isLoading}>
                  {isLoading ? 'Wird hinzugefügt...' : t('staff.sendInvitation')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('tables.total')}</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffMembers.length}</div>
            <p className="text-xs text-gray-500">{t('nav.staff')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('staff.manager')}</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffMembers.filter(s => s.role === 'manager').length}
            </div>
            <p className="text-xs text-gray-500">Manager</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('staff.waiter')}</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffMembers.filter(s => s.role === 'waiter').length}
            </div>
            <p className="text-xs text-gray-500">{t('staff.waiter')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('staff.kitchen')}</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffMembers.filter(s => s.role === 'kitchen').length}
            </div>
            <p className="text-xs text-gray-500">{t('staff.kitchen')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('staff.staffMember')}</CardTitle>
          <CardDescription>
            {t('staff.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('common.search') + "..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'Keine Mitarbeiter gefunden' : 'Keine Mitarbeiter vorhanden'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('profile.name')}</TableHead>
                  <TableHead>{t('profile.email')}</TableHead>
                  <TableHead>{t('staff.role')}</TableHead>
                  <TableHead>{t('staff.joined')}</TableHead>
                  {isOwner && <TableHead className="text-right">{t('common.actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {member.name}
                        {member.isOwner && (
                          <span title="Besitzer">
                            <Crown className="w-4 h-4 text-yellow-500" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {member.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleMap[member.role].color}>
                        {roleMap[member.role].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(member.createdAt), { 
                        addSuffix: true,
                        locale: getLocale()
                      })}
                    </TableCell>
                    {isOwner && (
                      <TableCell className="text-right">
                        {!member.isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                const newRole = prompt('Neue Rolle (manager, waiter, kitchen):', member.role)
                                if (newRole && ['manager', 'waiter', 'kitchen'].includes(newRole)) {
                                  handleUpdateRole(member, newRole)
                                }
                              }}>
                                <Edit className="w-4 h-4 mr-2" />
                                {t('staff.changeRole') || 'Rolle ändern'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteStaff(member)}
                              >
                                <Trash className="w-4 h-4 mr-2" />
                                {t('staff.removeStaff')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}