import { MoreHorizontal, Pencil, Trash2, Shield } from 'lucide-react';
import { User, ROLE_LABELS, ROLE_HIERARCHY } from '@/types/erp';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  const { currentUser, canManageRole } = useAuth();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'vice_head':
        return 'secondary';
      case 'teacher':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">User</TableHead>
            <TableHead className="font-semibold">Role</TableHead>
            <TableHead className="font-semibold">Department</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Permissions</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => {
            const canManage = canManageRole(user.role);
            
            return (
              <TableRow 
                key={user.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.department || '-'}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={user.status === 'active' ? 'default' : 'secondary'}
                    className={user.status === 'active' ? 'bg-success hover:bg-success/90' : ''}
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {user.permissions.length} permissions
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {canManage ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(user)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-xs text-muted-foreground">No access</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
