'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Mail,
  Phone,
  Shield,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  EyeOff,
  Crown,
  Briefcase,
  Calendar,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import EmptyState from '@/components/shared/empty-state'

interface StaffMember {
  id: string
  name: string
  email: string
  phone?: string | null
  role: 'OWNER' | 'MANAGER' | 'STAFF' | 'WAITER' | 'COOK' | 'CASHIER'
  permissions: string[]
  isActive: boolean
  inviteStatus: 'PENDING' | 'ACCEPTED' | 'EXPIRED'
  invitedAt?: string | null
  joinedAt?: string | null
  lastActiveAt?: string | null
  notes?: string | null
  avatar?: string | null
}

interface ActivityLog {
  id: string
  userId: string
  action: string
  details: string
  timestamp: string
  ipAddress?: string
}

interface AdminStaffManagerProps {
  restaurantId: string
}

const staffRoles = {
  OWNER: { 
    label: 'Inhaber', 
    color: 'bg-purple-500', 
    icon: Crown,
    description: 'Vollzugriff auf alle Funktionen'
  },
  MANAGER: { 
    label: 'Manager', 
    color: 'bg-blue-500', 
    icon: Briefcase,
    description: 'Verwaltung von Personal und Einstellungen'
  },
  STAFF: { 
    label: 'Mitarbeiter', 
    color: 'bg-green-500', 
    icon: Users,
    description: 'Grundlegende Funktionen'
  },
  WAITER: { 
    label: 'Kellner', 
    color: 'bg-orange-500', 
    icon: Users,
    description: 'Bestellungen und Tischverwaltung'
  },
  COOK: { 
    label: 'Koch', 
    color: 'bg-red-500', 
    icon: Users,
    description: 'Küchenverwaltung und Bestellungen'
  },
  CASHIER: { 
    label: 'Kassierer', 
    color: 'bg-yellow-500', 
    icon: Users,
    description: 'Kasse und Zahlungsabwicklung'
  }
}

const availablePermissions = [
  { id: 'orders.view', label: 'Bestellungen anzeigen', category: 'Bestellungen' },
  { id: 'orders.manage', label: 'Bestellungen verwalten', category: 'Bestellungen' },
  { id: 'menu.view', label: 'Speisekarte anzeigen', category: 'Speisekarte' },
  { id: 'menu.edit', label: 'Speisekarte bearbeiten', category: 'Speisekarte' },
  { id: 'tables.view', label: 'Tische anzeigen', category: 'Tische' },
  { id: 'tables.manage', label: 'Tische verwalten', category: 'Tische' },
  { id: 'reports.view', label: 'Berichte anzeigen', category: 'Berichte' },
  { id: 'reports.export', label: 'Berichte exportieren', category: 'Berichte' },
  { id: 'settings.view', label: 'Einstellungen anzeigen', category: 'Einstellungen' },
  { id: 'settings.edit', label: 'Einstellungen bearbeiten', category: 'Einstellungen' },
  { id: 'staff.view', label: 'Personal anzeigen', category: 'Personal' },
  { id: 'staff.manage', label: 'Personal verwalten', category: 'Personal' }
]

const inviteSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
  phone: z.string().optional(),
  role: z.enum(['MANAGER', 'STAFF', 'WAITER', 'COOK', 'CASHIER']),
  permissions: z.array(z.string()),
  notes: z.string().optional()
})

type InviteFormValues = z.infer<typeof inviteSchema>

export default function AdminStaffManager({ restaurantId }: AdminStaffManagerProps) {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [filterRole, setFilterRole] = useState<string>('ALL')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  
  // Dialog states
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)
  const [showActivityDialog, setShowActivityDialog] = useState(false)
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null)

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'STAFF',
      permissions: [],
      notes: ''
    },
  })

  // Load data
  useEffect(() => {
    loadStaffMembers()
    loadActivityLogs()
  }, [restaurantId])

  const loadStaffMembers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/restaurants/${restaurantId}/staff`)
      if (!response.ok) throw new Error('Fehler beim Laden der Mitarbeiter')
      
      const data = await response.json()
      setStaffMembers(data.staff || [])
    } catch (error) {
      toast.error('Fehler beim Laden der Mitarbeiter')
    } finally {
      setIsLoading(false)
    }
  }

  const loadActivityLogs = async () => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/staff/activity`)
      if (!response.ok) throw new Error('Fehler beim Laden der Aktivitätslogs')
      
      const data = await response.json()
      setActivityLogs(data.logs || [])
    } catch (error) {
      console.error('Fehler beim Laden der Aktivitätslogs:', error)
    }
  }

  const handleInviteStaff = async (values: InviteFormValues) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/staff/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Fehler beim Einladen')
      }

      const newMember = await response.json()
      setStaffMembers([...staffMembers, newMember.data])
      
      toast.success(`Einladung an ${values.email} gesendet`)
      setShowInviteDialog(false)
      form.reset()
    } catch (error) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Fehler beim Einladen des Mitarbeiters'
      )
    }
  }

  const handleUpdateMember = async (memberId: string, updates: Partial<StaffMember>) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/staff/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) throw new Error('Fehler beim Aktualisieren')

      setStaffMembers(staffMembers.map(member => 
        member.id === memberId ? { ...member, ...updates } : member
      ))
      
      toast.success('Mitarbeiter aktualisiert')
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Mitarbeiters')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    const member = staffMembers.find(m => m.id === memberId)
    if (!member) return

    if (!confirm(`Möchten Sie ${member.name} wirklich entfernen?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/staff/${memberId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Fehler beim Entfernen')

      setStaffMembers(staffMembers.filter(member => member.id !== memberId))
      toast.success('Mitarbeiter entfernt')
    } catch (error) {
      toast.error('Fehler beim Entfernen des Mitarbeiters')
    }
  }

  const handleResendInvite = async (memberId: string) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/staff/${memberId}/resend-invite`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Fehler beim Senden')

      toast.success('Einladung erneut gesendet')
    } catch (error) {
      toast.error('Fehler beim Senden der Einladung')
    }
  }

  const handleToggleActive = async (memberId: string, isActive: boolean) => {
    await handleUpdateMember(memberId, { isActive })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getPermissionsByCategory = () => {
    const categories: { [key: string]: typeof availablePermissions } = {}
    availablePermissions.forEach(permission => {
      if (!categories[permission.category]) {
        categories[permission.category] = []
      }
      categories[permission.category].push(permission)
    })
    return categories
  }

  const getDefaultPermissionsForRole = (role: string): string[] => {
    switch (role) {
      case 'MANAGER':
        return [
          'orders.view', 'orders.manage', 'menu.view', 'menu.edit',
          'tables.view', 'tables.manage', 'reports.view', 'staff.view'
        ]
      case 'WAITER':
        return ['orders.view', 'orders.manage', 'tables.view', 'menu.view']
      case 'COOK':
        return ['orders.view', 'orders.manage', 'menu.view']
      case 'CASHIER':
        return ['orders.view', 'orders.manage', 'reports.view']
      default:
        return ['orders.view', 'menu.view', 'tables.view']
    }
  }

  const filteredStaffMembers = staffMembers.filter(member => {
    const roleMatch = filterRole === 'ALL' || member.role === filterRole
    const statusMatch = filterStatus === 'ALL' || 
      (filterStatus === 'ACTIVE' && member.isActive) ||
      (filterStatus === 'INACTIVE' && !member.isActive) ||
      (filterStatus === 'PENDING' && member.inviteStatus === 'PENDING')
    
    return roleMatch && statusMatch
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Personal verwalten
          </h2>
          <p className="text-gray-600 mt-2">
            Mitarbeiter einladen, Rollen verwalten und Aktivitäten überwachen
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowActivityDialog(true)}
          >
            <Activity className="mr-2 h-4 w-4" />
            Aktivität anzeigen
          </Button>
          <Button onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Personal einladen
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gesamt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffMembers.length}</div>
            <p className="text-xs text-gray-500">Mitarbeiter</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aktiv</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {staffMembers.filter(m => m.isActive).length}
            </div>
            <p className="text-xs text-gray-500">Online</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ausstehend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {staffMembers.filter(m => m.inviteStatus === 'PENDING').length}
            </div>
            <p className="text-xs text-gray-500">Einladungen</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rollen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Set(staffMembers.map(m => m.role)).size}
            </div>
            <p className="text-xs text-gray-500">Verschiedene</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Rolle filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Alle Rollen</SelectItem>
              {Object.entries(staffRoles).map(([role, info]) => (
                <SelectItem key={role} value={role}>
                  {info.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Alle Status</SelectItem>
            <SelectItem value="ACTIVE">Aktiv</SelectItem>
            <SelectItem value="INACTIVE">Inaktiv</SelectItem>
            <SelectItem value="PENDING">Ausstehend</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredStaffMembers.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Users}
              title="Keine Mitarbeiter"
              description="Laden Sie Ihr Team ein, um zusammenzuarbeiten"
              action={{
                label: 'Personal einladen',
                onClick: () => setShowInviteDialog(true)
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStaffMembers.map((member) => {
            const roleInfo = staffRoles[member.role]
            const RoleIcon = roleInfo.icon
            
            return (
              <Card key={member.id}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar || undefined} alt={member.name} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{member.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </CardDescription>
                        {member.phone && (
                          <CardDescription className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${roleInfo.color} text-white border-0`}
                      >
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {roleInfo.label}
                      </Badge>
                      {member.inviteStatus === 'PENDING' && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          Einladung ausstehend
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <div className="flex items-center gap-2">
                      {member.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm ${member.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {member.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                  </div>

                  {member.joinedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Beigetreten:</span>
                      <span className="text-sm">
                        {new Date(member.joinedAt).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  )}

                  {member.lastActiveAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Zuletzt aktiv:</span>
                      <span className="text-sm">
                        {new Date(member.lastActiveAt).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Berechtigungen:</span>
                    <span className="text-sm font-medium">
                      {member.permissions.length} erteilt
                    </span>
                  </div>

                  {member.notes && (
                    <div className="text-sm text-gray-600 italic">
                      "{member.notes}"
                    </div>
                  )}
                </CardContent>

                <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                  <Switch
                    checked={member.isActive}
                    onCheckedChange={(checked) => handleToggleActive(member.id, checked)}
                    disabled={member.role === 'OWNER'}
                  />
                  <div className="flex gap-1">
                    {member.inviteStatus === 'PENDING' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResendInvite(member.id)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingMember(member)
                        setShowPermissionsDialog(true)
                      }}
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingMember(member)
                        setShowEditDialog(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {member.role !== 'OWNER' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Einlade Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Personal einladen</DialogTitle>
            <DialogDescription>
              Laden Sie ein neues Teammitglied ein und legen Sie dessen Rolle und Berechtigungen fest
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleInviteStaff)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Max Mustermann" {...field} />
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
                      <FormLabel>E-Mail *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="max@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input placeholder="+49 30 12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rolle *</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value)
                          form.setValue('permissions', getDefaultPermissionsForRole(value))
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(staffRoles)
                            .filter(([role]) => role !== 'OWNER')
                            .map(([role, info]) => (
                            <SelectItem key={role} value={role}>
                              <div className="flex items-center gap-2">
                                <info.icon className={`h-4 w-4 text-white p-1 rounded ${info.color}`} />
                                <div>
                                  <div className="font-medium">{info.label}</div>
                                  <div className="text-xs text-gray-500">{info.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notizen</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Zusätzliche Informationen über den Mitarbeiter..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Berechtigungen</FormLabel>
                    <FormDescription>
                      Wählen Sie die Berechtigungen für diesen Mitarbeiter aus
                    </FormDescription>
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {Object.entries(getPermissionsByCategory()).map(([category, permissions]) => (
                        <div key={category}>
                          <h4 className="font-medium text-sm mb-2">{category}</h4>
                          <div className="grid grid-cols-2 gap-2 ml-4">
                            {permissions.map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value?.includes(permission.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, permission.id])
                                    } else {
                                      field.onChange(field.value?.filter((p) => p !== permission.id))
                                    }
                                  }}
                                />
                                <Label className="text-sm">
                                  {permission.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Abbrechen
                </Button>
                <Button type="submit">
                  Einladung senden
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Berechtigungen Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Berechtigungen verwalten - {editingMember?.name}
            </DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Berechtigungen für diesen Mitarbeiter
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(getPermissionsByCategory()).map(([category, permissions]) => (
              <div key={category}>
                <h4 className="font-medium text-sm mb-2">{category}</h4>
                <div className="grid grid-cols-2 gap-2 ml-4">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={editingMember?.permissions.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          if (!editingMember) return
                          let newPermissions = [...editingMember.permissions]
                          if (checked) {
                            newPermissions.push(permission.id)
                          } else {
                            newPermissions = newPermissions.filter(p => p !== permission.id)
                          }
                          handleUpdateMember(editingMember.id, { permissions: newPermissions })
                          setEditingMember({ ...editingMember, permissions: newPermissions })
                        }}
                      />
                      <Label className="text-sm">
                        {permission.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowPermissionsDialog(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Aktivitäts Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Aktivitätslogs</DialogTitle>
            <DialogDescription>
              Übersicht über Aktivitäten der Teammitglieder
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activityLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Noch keine Aktivitäten aufgezeichnet</p>
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{log.action}</h4>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString('de-DE')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                    {log.ipAddress && (
                      <p className="text-xs text-gray-400 mt-1">IP: {log.ipAddress}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowActivityDialog(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}