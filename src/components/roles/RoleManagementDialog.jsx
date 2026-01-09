import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { PERMISSIONS } from '@/types/erp';
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





const categoryLabels= {
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
}, {});

export function RoleManagementDialog({ open, onOpenChange }) {
  const { currentUser } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
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
            duration: 5000
          });
        } else {
          throw new Error(response.error);
        }
        return;
      }
      
      if (response.data && Array.isArray(response.data)) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load roles';
      if (errorMessage.includes('PGRST205') || errorMessage.includes('custom_roles')) {
        toast.error('Custom roles table not found. Please create it in Supabase. See QUICK_FIX_CUSTOM_ROLES.md', {
          duration: 5000
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

  const handleEdit = (role) => {
    setRoleName(role.name);
    setSelectedPermissions([...role.permissions]);
    setEditingRole(role);
    setIsCreating(false);
  };

  const handleCancel = () => {
    resetForm();
  };

  const togglePermission = (permissionId) => {
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
          permissions: selectedPermissions
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
          duration: 5000
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId, roleName) => {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Custom Roles</DialogTitle>
          <DialogDescription>
            Create and manage custom roles with specific permissions for your organization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create/Edit Form */}
          {(isCreating || editingRole) && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </h3>
                <Button variant="ghost" size="icon" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role-name">Role Name *</Label>
                <Input
                  id="role-name"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Enter role name"
                />
              </div>

              <div className="space-y-2">
                <Label>Permissions *</Label>
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-4">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        {categoryLabels[category] || category}
                      </h4>
                      <div className="space-y-2 pl-4">
                        {perms.map((permission) => (
                          <div key={permission.id} className="flex items-start gap-3 p-2 hover:bg-muted rounded">
                            <Checkbox
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{permission.name}</div>
                              <div className="text-xs text-muted-foreground">{permission.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {editingRole ? 'Update Role' : 'Create Role'}
                </Button>
              </div>
            </div>
          )}

          {/* Roles List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Custom Roles</h3>
              {!isCreating && !editingRole && (
                <Button onClick={handleCreate}>
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
              <p className="text-center text-muted-foreground py-8">
                No custom roles found. Click "Add Role" to create one.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions && role.permissions.length > 0 ? (
                            role.permissions.slice(0, 3).map((permId) => {
                              const perm = PERMISSIONS.find(p => p.id === permId);
                              return perm ? (
                                <span key={permId} className="text-xs px-2 py-1 bg-muted rounded">
                                  {perm.name}
                                </span>
                              ) : null;
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground">No permissions</span>
                          )}
                          {role.permissions && role.permissions.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                              +{role.permissions.length - 3} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(role)}
                            disabled={loading}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
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
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

