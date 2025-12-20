import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { User, UserRole, ROLE_LABELS, ROLE_DEFAULT_PERMISSIONS, ROLE_HIERARCHY } from '@/types/erp';
import { useAuth } from '@/contexts/AuthContext';
import { UserTable } from '@/components/users/UserTable';
import { AddUserDialog } from '@/components/users/AddUserDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';
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
import { supabase } from '@/lib/supabase';
import { createUserAddedActivity } from '@/services/activities';
import { updateTeacherDepartments } from '@/services/departments';

interface UserManagementProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

export function UserManagement({ dialogOpen, setDialogOpen }: UserManagementProps) {
  const { currentUser, canManageRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users from Supabase
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch users first
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Fetch department names separately for users with department_id
        const departmentIds = [...new Set(data.filter((u: any) => u.department_id).map((u: any) => u.department_id))];
        let deptMap = new Map<string, string>();
        
        if (departmentIds.length > 0) {
          const { data: deptData, error: deptError } = await supabase
            .from('departments')
            .select('id, name')
            .in('id', departmentIds);
          
          if (!deptError && deptData) {
            deptData.forEach((dept: any) => {
              deptMap.set(dept.id, dept.name);
            });
          }
        }

        const mappedUsers: User[] = data.map((row: any) => ({
          id: row.id,
          loopid: row.loopid,
          org_id: row.org_id,
          user_id: row.user_id,
          name: row.name,
          email: row.email,
          role: row.role as UserRole,
          permissions: row.permissions || [],
          department: row.department_id ? deptMap.get(row.department_id) || null : row.department || null,
          createdAt: new Date(row.created_at),
          status: row.status as 'active' | 'inactive',
          avatar: row.avatar,
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = async (newUser: {
    name: string;
    email: string;
    role: UserRole;
    permissions: string[];
    department_id?: string;
    department_ids?: string[];
  }) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          permissions: newUser.permissions,
          department_id: newUser.department_id || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // For teachers, update teacher_departments
        if (newUser.role === 'teacher' && newUser.department_ids && newUser.department_ids.length > 0) {
          const { error: deptError } = await supabase
            .from('teacher_departments')
            .insert(
              newUser.department_ids.map(deptId => ({
                teacher_id: data.id,
                department_id: deptId,
              }))
            );

          if (deptError) throw deptError;
        }

        // Fetch department name for display
        let departmentName = null;
        if (data.department_id) {
          const { data: deptData } = await supabase
            .from('departments')
            .select('name')
            .eq('id', data.department_id)
            .single();
          departmentName = deptData?.name || null;
        }

        const user: User = {
          id: data.id,
          loopid: data.loopid,
          org_id: data.org_id,
          user_id: data.user_id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          permissions: data.permissions || [],
          department: departmentName,
          createdAt: new Date(data.created_at),
          status: data.status as 'active' | 'inactive',
          avatar: data.avatar,
        };
        setUsers(prev => [user, ...prev]);
        
        // Create activity for new user
        await createUserAddedActivity(user.name, user.department || '');
        
        toast.success(`User ${user.name} added successfully`);
      }
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(error.message || 'Failed to add user');
    }
  };

  const handleEditUser = (user: User) => {
    if (!canManageRole(user.role)) {
      toast.error(`You cannot edit users with the ${user.role} role. You can only manage roles below yours in the hierarchy.`);
      return;
    }
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async (user: User, updatedData: {
    name: string;
    email: string;
    role: UserRole;
    permissions: string[];
    department_id?: string;
    department_ids?: string[];
  }) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: updatedData.name,
          email: updatedData.email,
          role: updatedData.role,
          permissions: updatedData.permissions,
          department_id: updatedData.department_id || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      // For teachers, update teacher_departments using the service function
      if (updatedData.role === 'teacher') {
        await updateTeacherDepartments(user.id, updatedData.department_ids || []);
      } else {
        // If role changed from teacher to something else, remove teacher_departments
        const { error: deleteError } = await supabase
          .from('teacher_departments')
          .delete()
          .eq('teacher_id', user.id);
        
        if (deleteError) {
          console.error('Error removing teacher departments:', deleteError);
          // Don't throw - this is cleanup, not critical
        }
      }

      // Refresh users list
      await fetchUsers();
      setEditDialogOpen(false);
      setSelectedUser(null);
      toast.success(`User ${updatedData.name} updated successfully`);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast.success(`User ${user.name} deleted`);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
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
      {loading ? (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
                <div className="h-6 w-20 bg-muted rounded" />
                <div className="h-6 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
      <UserTable
        users={filteredUsers}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />
      )}

      {/* Add User Dialog */}
      <AddUserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAddUser}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        onUpdate={handleUpdateUser}
      />
    </div>
  );
}
