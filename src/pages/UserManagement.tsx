import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { User, UserRole, ROLE_LABELS, ROLE_DEFAULT_PERMISSIONS, ROLE_HIERARCHY } from '@/types/erp';
import { useAuth } from '@/contexts/AuthContext';
import { UserTable } from '@/components/users/UserTable';
import { AddUserDialog } from '@/components/users/AddUserDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Mock initial users
const initialUsers: User[] = [
  {
    id: '2',
    name: 'Prof. Michael Chen',
    email: 'vicehead@school.edu',
    role: 'vice_head',
    permissions: ROLE_DEFAULT_PERMISSIONS.vice_head,
    department: 'Academic Affairs',
    createdAt: new Date('2021-03-20'),
    status: 'active',
  },
  {
    id: '3',
    name: 'Ms. Emily Parker',
    email: 'teacher@school.edu',
    role: 'teacher',
    permissions: ROLE_DEFAULT_PERMISSIONS.teacher,
    department: 'Science',
    createdAt: new Date('2022-08-01'),
    status: 'active',
  },
  {
    id: '4',
    name: 'Alex Thompson',
    email: 'student@school.edu',
    role: 'student',
    permissions: ROLE_DEFAULT_PERMISSIONS.student,
    department: 'Grade 10',
    createdAt: new Date('2023-09-01'),
    status: 'active',
  },
  {
    id: '5',
    name: 'John Martinez',
    email: 'maintenance@school.edu',
    role: 'housekeeping',
    permissions: ROLE_DEFAULT_PERMISSIONS.housekeeping,
    department: 'Facilities',
    createdAt: new Date('2021-06-15'),
    status: 'active',
  },
  {
    id: '6',
    name: 'Lisa Wong',
    email: 'library@school.edu',
    role: 'librarian',
    permissions: ROLE_DEFAULT_PERMISSIONS.librarian,
    department: 'Library',
    createdAt: new Date('2020-09-01'),
    status: 'active',
  },
  {
    id: '7',
    name: 'Robert Davis',
    email: 'accounts@school.edu',
    role: 'accountant',
    permissions: ROLE_DEFAULT_PERMISSIONS.accountant,
    department: 'Finance',
    createdAt: new Date('2019-11-10'),
    status: 'inactive',
  },
];

interface UserManagementProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

export function UserManagement({ dialogOpen, setDialogOpen }: UserManagementProps) {
  const { currentUser, canManageRole } = useAuth();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = (newUser: {
    name: string;
    email: string;
    role: UserRole;
    permissions: string[];
    department: string;
  }) => {
    const user: User = {
      id: Date.now().toString(),
      ...newUser,
      createdAt: new Date(),
      status: 'active',
    };
    setUsers(prev => [...prev, user]);
  };

  const handleEditUser = (user: User) => {
    toast.info(`Edit user: ${user.name}`);
    // In a real app, this would open an edit dialog
  };

  const handleDeleteUser = (user: User) => {
    setUsers(prev => prev.filter(u => u.id !== user.id));
    toast.success(`User ${user.name} deleted`);
  };

  // Filter roles based on what current user can manage
  const manageableRoles = (Object.keys(ROLE_LABELS) as UserRole[]).filter(role => canManageRole(role));

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {manageableRoles.map(role => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Role Hierarchy:</strong> As a{' '}
          <span className="font-medium text-foreground">
            {currentUser && ROLE_LABELS[currentUser.role]}
          </span>
          , you can manage users with roles below yours in the hierarchy. Lower-level users cannot manage higher-level users.
        </p>
      </div>

      {/* User table */}
      <UserTable
        users={filteredUsers}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />

      {/* Add User Dialog */}
      <AddUserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAddUser}
      />
    </div>
  );
}
