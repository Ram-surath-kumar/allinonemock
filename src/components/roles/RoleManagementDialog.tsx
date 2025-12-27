import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { PERMISSIONS, Permission } from '@/types/erp';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Edit2, Plus, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CustomRole {
  id: string;
  name: string;
  permissions: string[];
  created_at?: string;
  created_by?: string;
}

interface RoleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryLabels: Record<string, string> = {
  student: 'Student Management',
  staff: 'Staff Management',
  finance: 'Finance',
  academic: 'Academic',
  facility: 'Facilities',
};

const groupedPermissions = PERMISSIONS.reduce((acc, perm) => {
  if (!acc[perm.category]) {
    acc[perm.category] = [];
  }
  acc[perm.category].push(perm);
  return acc;
}, {} as Record<string, Permission[]>);

export function RoleManagementDialog({ open, onOpenChange }: RoleManagementDialogProps) {
  const { currentUser } = useAuth();
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (open) {
      loadRoles();
      resetForm();
    }
  }, [open]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await api.getCustomRoles();
      if (response.error) {
        // Check if it's a table not found error
        if (response.error.includes('PGRST205') || response.error.includes('custom_roles')) {
          toast.error('Custom roles table not found. Please run the SQL script to create it. See QUICK_FIX_CUSTOM_ROLES.md', {
            duration: 10000,
          });
        } else {
          throw new Error(response.error);
        }
        return;
      }
      
      if (response.data && Array.isArray(response.data)) {
        setRoles(response.data as CustomRole[]);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load roles';
      if (errorMessage.includes('PGRST205') || errorMessage.includes('custom_roles')) {
        toast.error('Custom roles table not found. Please create it in Supabase. See QUICK_FIX_CUSTOM_ROLES.md', {
          duration: 10000,
        });
      } else {
        toast.error('Failed to load roles');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRoleName('');
    setSelectedPermissions([]);
    setEditingRole(null);
    setIsCreating(false);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleEdit = (role: CustomRole) => {
    setRoleName(role.name);
    setSelectedPermissions([...role.permissions]);
    setEditingRole(role);
    setIsCreating(false);
  };

  const handleCancel = () => {
    resetForm();
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      toast.error('Please enter a role name');
      return;
    }

    if (selectedPermissions.length === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    try {
      setLoading(true);
      
      if (editingRole) {
        // Update existing role
        const response = await api.updateCustomRole(editingRole.id, {
          name: roleName.trim(),
          permissions: selectedPermissions,
        });
        
        if (response.error) throw new Error(response.error);
        toast.success('Role updated successfully');
      } else {
        // Create new role
        const response = await api.createCustomRole({
          name: roleName.trim(),
          permissions: selectedPermissions,
          created_by: currentUser?.id,
        });
        
        if (response.error) throw new Error(response.error);
        toast.success('Role created successfully');
      }

      await loadRoles();
      resetForm();
    } catch (error) {
      console.error('Error saving role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save role';
      if (errorMessage.includes('PGRST205') || errorMessage.includes('custom_roles')) {
        toast.error('Custom roles table not found. Please create it in Supabase. See QUICK_FIX_CUSTOM_ROLES.md', {
          duration: 10000,
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.deleteCustomRole(roleId);
      
      if (response.error) throw new Error(response.error);
      toast.success('Role deleted successfully');
      await loadRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete role';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Custom Roles</DialogTitle>
          <DialogDescription>
            Create and manage custom roles with specific permissions for your organization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Create/Edit Form */}
          {(isCreating || editingRole) && (
            <div className="rounded-lg border border-border p-4 space-y-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </h3>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role-name">Role Name *</Label>
                <Input
                  id="role-name"
                  placeholder="e.g., Department Head, Coordinator"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Permissions *</Label>
                <div className="rounded-lg border border-border p-3 max-h-[300px] overflow-y-auto space-y-4">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category}>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                        {categoryLabels[category] || category}
                      </h4>
                      <div className="space-y-2">
                        {perms.map((permission) => (
                          <div key={permission.id} className="flex items-start gap-2">
                            <Checkbox
                              id={`perm-${permission.id}`}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={`perm-${permission.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {permission.name}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading || !roleName.trim() || selectedPermissions.length === 0}>
                  {editingRole ? 'Update Role' : 'Create Role'}
                </Button>
              </div>
            </div>
          )}

          {/* Roles List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Custom Roles</Label>
              {!isCreating && !editingRole && (
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Role
                </Button>
              )}
            </div>

            {loading && !roles.length ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No custom roles found. Click "Add Role" to create one.
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.length > 0 ? (
                              role.permissions.slice(0, 3).map((permId) => {
                                const perm = PERMISSIONS.find(p => p.id === permId);
                                return perm ? (
                                  <span key={permId} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                    {perm.name}
                                  </span>
                                ) : null;
                              })
                            ) : (
                              <span className="text-xs text-muted-foreground">No permissions</span>
                            )}
                            {role.permissions.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{role.permissions.length - 3} more
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(role)}
                              disabled={loading}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(role.id, role.name)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

