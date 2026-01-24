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
  Search
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

export default function StaffTranslated() {
  const { language, t } = useLanguage()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'waiter'
  })

  // Diese Daten sollten aus der Datenbank kommen
  const staff: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    lastActive: string;
  }> = []

  const roleMap = {
    manager: { label: t('staff.manager'), color: 'bg-purple-500' },
    waiter: { label: t('staff.waiter'), color: 'bg-blue-500' },
    kitchen: { label: t('staff.kitchen'), color: 'bg-green-500' }
  }

  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddStaff = () => {
    toast.success(t('staff.staffAdded') + ` ${newStaff.name}`)
    setIsAddDialogOpen(false)
    setNewStaff({ name: '', email: '', role: 'waiter' })
  }

  const handleDeleteStaff = (name: string) => {
    if (confirm(t('staff.removeConfirm'))) {
      toast.success(t('staff.staffRemoved') + ` ${name}`)
    }
  }

  return (
    <div className={`p-6 space-y-6 ${language === 'ar' ? 'rtl:space-x-reverse' : ''}`}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('staff.title')}</h1>
          <p className="text-gray-600">{t('staff.subtitle')}</p>
        </div>
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
                <Label htmlFor="name">{t('profile.name')}</Label>
                <Input
                  id="name"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                  placeholder={t('profile.name')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('staff.emailAddress')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                  placeholder={t('profile.email')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">{t('staff.role')}</Label>
                <Select
                  value={newStaff.role}
                  onValueChange={(value) => setNewStaff({...newStaff, role: value})}
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
              <Button onClick={handleAddStaff}>
                {t('staff.sendInvitation')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('tables.total')}</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-gray-500">{t('nav.staff')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('staff.active')}</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staff.filter(s => s.status === 'active').length}
            </div>
            <p className="text-xs text-gray-500">{t('statistics.today')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('staff.waiter')}</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staff.filter(s => s.role === 'waiter').length}
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
              {staff.filter(s => s.role === 'kitchen').length}
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('profile.name')}</TableHead>
                <TableHead>{t('profile.email')}</TableHead>
                <TableHead>{t('staff.role')}</TableHead>
                <TableHead>{t('staff.status')}</TableHead>
                <TableHead>{t('staff.lastActive')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {member.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={roleMap[member.role as keyof typeof roleMap].color}>
                      {roleMap[member.role as keyof typeof roleMap].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                      {member.status === 'active' ? t('staff.active') : t('staff.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {member.lastActive}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('common.actions') || 'Actions'}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="w-4 h-4 mr-2" />
                          {t('staff.permissions')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteStaff(member.name)}
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          {t('staff.removeStaff')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}