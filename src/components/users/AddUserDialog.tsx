import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserRole, ROLE_LABELS, ROLE_HIERARCHY, PERMISSIONS, ROLE_DEFAULT_PERMISSIONS, ROLE_ALLOWED_PERMISSIONS, Permission } from '@/types/erp';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { fetchDepartments, Department } from '@/services/departments';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (user: {
    name: string;
    email: string;
    role: UserRole;
    permissions: string[];
    department_id?: string;
    department_ids?: string[];
  }) => void;
}

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'vice_head', 'teacher', 'student', 'housekeeping', 'librarian', 'accountant'] as const, {
    required_error: 'Please select a role',
  }),
  department_id: z.string().optional(),
  department_ids: z.array(z.string()).optional(),
  permissions: z.array(z.string()),
}).refine((data) => {
  if (data.role === 'student') {
    return !!data.department_id && data.department_id.length > 0;
  }
  return true;
}, {
  message: 'Please select a department for the student',
  path: ['department_id'],
}).refine((data) => {
  if (data.role === 'teacher') {
    return data.department_ids && data.department_ids.length > 0;
  }
  return true;
}, {
  message: 'Please select at least one department for the teacher',
  path: ['department_ids'],
});

type FormValues = z.infer<typeof formSchema>;

export function AddUserDialog({ open, onOpenChange, onAdd }: AddUserDialogProps) {
  const { currentUser, canManageRole } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const availableRoles = (Object.keys(ROLE_LABELS) as UserRole[]).filter(r => canManageRole(r));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role: undefined as any,
      department_id: '',
      department_ids: [],
      permissions: [],
    },
    mode: 'onChange',
  });

  const watchedRole = form.watch('role');

  useEffect(() => {
    if (open) {
      loadDepartments();
      form.reset();
    }
  }, [open, form]);

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

  useEffect(() => {
    if (watchedRole) {
      const defaultPermissions = ROLE_DEFAULT_PERMISSIONS[watchedRole] || [];
      form.setValue('permissions', defaultPermissions);
      form.setValue('department_id', '');
      form.setValue('department_ids', []);
    }
  }, [watchedRole, form]);

  const togglePermission = (permissionId: string, currentPermissions: string[]) => {
    // Only allow toggling permissions that are allowed for the current role
    const allowedPerms = ROLE_ALLOWED_PERMISSIONS[watchedRole] || [];
    if (!allowedPerms.includes(permissionId)) {
      return; // Don't allow toggling disallowed permissions
    }
    
    const filtered = currentPermissions.filter(p => allowedPerms.includes(p)); // Remove any disallowed permissions
    const newPermissions = filtered.includes(permissionId)
      ? filtered.filter(p => p !== permissionId)
      : [...filtered, permissionId];
    form.setValue('permissions', newPermissions);
  };

  const toggleDepartment = (deptId: string, currentDeptIds: string[]) => {
    const newDeptIds = currentDeptIds.includes(deptId)
      ? currentDeptIds.filter(id => id !== deptId)
      : [...currentDeptIds, deptId];
    form.setValue('department_ids', newDeptIds);
  };

  const onSubmit = (values: FormValues) => {
    onAdd({
      name: values.name,
      email: values.email,
      role: values.role,
      permissions: values.permissions,
      ...(values.role === 'student' ? { department_id: values.department_id } : {}),
      ...(values.role === 'teacher' ? { department_ids: values.department_ids || [] } : {}),
    });

    form.reset();
    onOpenChange(false);
    toast.success('User added successfully');
  };

  // Get allowed permissions for the selected role
  const getAllowedPermissions = (role: UserRole | ''): Permission[] => {
    if (!role) return [];
    const allowedPermissionIds = ROLE_ALLOWED_PERMISSIONS[role] || [];
    return PERMISSIONS.filter(p => allowedPermissionIds.includes(p.id));
  };

  const groupedPermissions = (() => {
    const allowedPerms = getAllowedPermissions(watchedRole);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account and assign their role and permissions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
              <Input
                placeholder="Enter full name"
                        {...field}
                        className={form.formState.errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                      />
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
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
              <Input
                type="email"
                placeholder="user@school.edu"
                        {...field}
                        className={form.formState.errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('department_id', '');
                        form.setValue('department_ids', []);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className={form.formState.errors.role ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                      </FormControl>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedRole === 'student' && (
                <FormField
                  control={form.control}
                  name="department_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department *</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                        disabled={loadingDepartments}
                      >
                        <FormControl>
                          <SelectTrigger className={form.formState.errors.department_id ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {watchedRole === 'teacher' && (
                <FormField
                  control={form.control}
                  name="department_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departments *</FormLabel>
                      <div className={`rounded-lg border p-3 min-h-[80px] max-h-[200px] overflow-y-auto ${
                        form.formState.errors.department_ids ? 'border-destructive' : 'border-border'
                      }`}>
                        {loadingDepartments ? (
                          <p className="text-sm text-muted-foreground">Loading departments...</p>
                        ) : departments.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No departments available</p>
                        ) : (
                          <div className="space-y-2">
                            {departments.map((dept) => (
                              <div key={dept.id} className="flex items-center gap-2">
                                <Checkbox
                                  id={`dept-${dept.id}`}
                                  checked={field.value?.includes(dept.id) || false}
                                  onCheckedChange={() => toggleDepartment(dept.id, field.value || [])}
                                />
                                <Label
                                  htmlFor={`dept-${dept.id}`}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {dept.name}
                                </Label>
            </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
          </div>

            {watchedRole && watchedRole !== 'student' && Object.keys(groupedPermissions).length > 0 && (
              <FormField
                control={form.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissions</FormLabel>
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
                            id={permission.id}
                                  checked={field.value?.includes(permission.id) || false}
                                  onCheckedChange={() => togglePermission(permission.id, field.value || [])}
                          />
                          <div className="grid gap-0.5">
                            <Label
                              htmlFor={permission.id}
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
                    <FormDescription>
                      Select the permissions for this user role
                    </FormDescription>
                  </FormItem>
                )}
              />
            )}
            {watchedRole === 'student' && (
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  Students can only view their own data. No additional permissions are required.
                </p>
            </div>
          )}

          <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                form.reset();
                onOpenChange(false);
              }}>
              Cancel
            </Button>
            <Button type="submit">Add User</Button>
          </DialogFooter>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
