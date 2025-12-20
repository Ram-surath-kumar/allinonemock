import { useState } from 'react';
import { UserRole, ROLE_LABELS, ROLE_HIERARCHY, PERMISSIONS, ROLE_DEFAULT_PERMISSIONS, Permission } from '@/types/erp';
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

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (user: {
    name: string;
    email: string;
    role: UserRole;
    permissions: string[];
    department: string;
  }) => void;
}

export function AddUserDialog({ open, onOpenChange, onAdd }: AddUserDialogProps) {
  const { currentUser, canManageRole } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [department, setDepartment] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const availableRoles = (Object.keys(ROLE_LABELS) as UserRole[]).filter(r => canManageRole(r));

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setSelectedPermissions(ROLE_DEFAULT_PERMISSIONS[newRole] || []);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !role) {
      toast.error('Please fill in all required fields');
      return;
    }

    onAdd({
      name,
      email,
      role,
      permissions: selectedPermissions,
      department,
    });

    // Reset form
    setName('');
    setEmail('');
    setRole('');
    setDepartment('');
    setSelectedPermissions([]);
    onOpenChange(false);
    toast.success('User added successfully');
  };

  const groupedPermissions = PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const categoryLabels: Record<string, string> = {
    student: 'Student Data',
    staff: 'Staff Management',
    finance: 'Finance',
    academic: 'Academics',
    facility: 'Facilities',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account and assign their role and permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@school.edu"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Science, Administration"
              />
            </div>
          </div>

          {role && (
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
                            id={permission.id}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
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
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add User</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
