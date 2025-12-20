import { useState, useEffect } from 'react';
import { User, UserRole, ROLE_LABELS, ROLE_HIERARCHY, PERMISSIONS, ROLE_DEFAULT_PERMISSIONS, ROLE_ALLOWED_PERMISSIONS, Permission } from '@/types/erp';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { fetchDepartments, fetchTeacherDepartments, Department } from '@/services/departments';
import { supabase } from '@/lib/supabase';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onUpdate: (user: User, updatedData: {
    name: string;
    email: string;
    role: UserRole;
    permissions: string[];
    department_id?: string;
    department_ids?: string[];
  }) => void;
}

export function EditUserDialog({ open, onOpenChange, user, onUpdate }: EditUserDialogProps) {
  const { currentUser, canManageRole } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [departmentId, setDepartmentId] = useState('');
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  useEffect(() => {
    if (open) {
      loadDepartments();
    }
  }, [open]);

  useEffect(() => {
    if (user && open) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      
      // Filter permissions to only include allowed ones for the role
      const allowedPerms = ROLE_ALLOWED_PERMISSIONS[user.role] || [];
      const userPerms = user.permissions || [];
      const filteredPerms = userPerms.filter(p => allowedPerms.includes(p));
      setSelectedPermissions(filteredPerms);
      
      // Load department for student or teacher departments
      if (user.role === 'student') {
        loadStudentDepartment(user.id);
      } else if (user.role === 'teacher') {
        loadTeacherDepartments(user.id);
      } else {
        setDepartmentId('');
        setSelectedDepartmentIds([]);
      }
    }
  }, [user, open]);

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const depts = await fetchDepartments();
      setDepartments(depts);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadStudentDepartment = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('department_id')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setDepartmentId(data?.department_id || '');
    } catch (error) {
      console.error('Error loading student department:', error);
    }
  };

  const loadTeacherDepartments = async (teacherId: string) => {
    try {
      const deptIds = await fetchTeacherDepartments(teacherId);
      setSelectedDepartmentIds(deptIds);
    } catch (error) {
      console.error('Error loading teacher departments:', error);
    }
  };

  const availableRoles = (Object.keys(ROLE_LABELS) as UserRole[]).filter(r => canManageRole(r));

  const handleRoleChange = (newRole: UserRole) => {
    const previousRole = role;
    setRole(newRole);
    // If changing role (not initial load), update permissions to default for that role
    // User can still customize after, but only from allowed permissions
    if (previousRole && previousRole !== newRole) {
      const defaultPerms = ROLE_DEFAULT_PERMISSIONS[newRole] || [];
      const allowedPerms = ROLE_ALLOWED_PERMISSIONS[newRole] || [];
      // Filter to only include allowed permissions
      setSelectedPermissions(defaultPerms.filter(p => allowedPerms.includes(p)));
      // Reset department selections when role changes
      setDepartmentId('');
      setSelectedDepartmentIds([]);
    }
  };

  const toggleDepartment = (deptId: string) => {
    setSelectedDepartmentIds(prev =>
      prev.includes(deptId)
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const togglePermission = (permissionId: string) => {
    // Only allow toggling permissions that are allowed for the current role
    const allowedPerms = ROLE_ALLOWED_PERMISSIONS[role] || [];
    if (!allowedPerms.includes(permissionId)) {
      return; // Don't allow toggling disallowed permissions
    }
    
    setSelectedPermissions(prev => {
      const filtered = prev.filter(p => allowedPerms.includes(p)); // Remove any disallowed permissions
      return filtered.includes(permissionId)
        ? filtered.filter(p => p !== permissionId)
        : [...filtered, permissionId];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !role || !user) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if user can manage this role
    if (!canManageRole(role)) {
      toast.error(`You cannot assign the ${ROLE_LABELS[role]} role. You can only manage roles below yours in the hierarchy.`);
      return;
    }

    // For students, department is required
    if (role === 'student' && !departmentId) {
      toast.error('Please select a department for the student');
      return;
    }

    // For teachers, at least one department is required
    if (role === 'teacher' && selectedDepartmentIds.length === 0) {
      toast.error('Please select at least one department for the teacher');
      return;
    }

    onUpdate(user, {
      name,
      email,
      role,
      permissions: selectedPermissions,
      ...(role === 'student' ? { department_id: departmentId } : {}),
      ...(role === 'teacher' ? { department_ids: selectedDepartmentIds } : {}),
    });

    onOpenChange(false);
  };

  // Get allowed permissions for the selected role
  const getAllowedPermissions = (role: UserRole | ''): Permission[] => {
    if (!role) return [];
    const allowedPermissionIds = ROLE_ALLOWED_PERMISSIONS[role] || [];
    return PERMISSIONS.filter(p => allowedPermissionIds.includes(p.id));
  };

  const groupedPermissions = (() => {
    const allowedPerms = getAllowedPermissions(role);
    return allowedPerms.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
  })();

  const categoryLabels: Record<string, string> = {
    student: 'Student Data',
    staff: 'Staff Management',
    finance: 'Finance',
    academic: 'Academics',
    facility: 'Facilities',
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information, role, and permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@school.edu"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role *</Label>
              <Select value={role} onValueChange={(value) => handleRoleChange(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {role === 'student' && (
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department *</Label>
                <Select 
                  value={departmentId} 
                  onValueChange={setDepartmentId}
                  disabled={loadingDepartments}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {role === 'teacher' && (
              <div className="space-y-2">
                <Label>Departments *</Label>
                <div className="rounded-lg border border-border p-3 min-h-[80px] max-h-[200px] overflow-y-auto">
                  {loadingDepartments ? (
                    <p className="text-sm text-muted-foreground">Loading departments...</p>
                  ) : departments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No departments available</p>
                  ) : (
            <div className="space-y-2">
                      {departments.map((dept) => (
                        <div key={dept.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`edit-dept-${dept.id}`}
                            checked={selectedDepartmentIds.includes(dept.id)}
                            onCheckedChange={() => toggleDepartment(dept.id)}
                          />
                          <Label
                            htmlFor={`edit-dept-${dept.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {dept.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            </div>
            )}
          </div>

          {role && role !== 'student' && Object.keys(groupedPermissions).length > 0 && (
            <div className="space-y-4">
              <Label>Permissions</Label>
              <div className="rounded-lg border border-border p-4 space-y-6">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-foreground mb-3">
                      {categoryLabels[category]}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-start gap-3">
                          <Checkbox
                            id={`edit-${permission.id}`}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <div className="grid gap-0.5">
                            <Label
                              htmlFor={`edit-${permission.id}`}
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
          )}
          {role === 'student' && (
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                Students can only view their own data. No additional permissions are required.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

