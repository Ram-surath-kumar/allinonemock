import { MoreHorizontal, Pencil, Trash2, Shield, Mail } from "lucide-react";
import { ROLE_LABELS } from "@/types/erp";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Helper function to check if user was created in the last 3 days
const isUserRecent = (user) => {
  if (!user.createdAt) return false;
  const createdAt = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt);
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  return createdAt >= threeDaysAgo;
};

export function UserTable({ users, onEdit, onDelete, onResendEmail }) {
  const { canManageRole } = useAuth();

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <caption className="sr-only">List of registered users</caption>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead scope="col" className="font-semibold">User</TableHead>
              <TableHead scope="col" className="font-semibold">Role</TableHead>
              <TableHead scope="col" className="font-semibold">Department</TableHead>
              <TableHead scope="col" className="font-semibold">Permissions</TableHead>
              <TableHead scope="col" className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, index) => {
              const canManage = canManageRole(user.role);

              return (
                <TableRow
                  key={user.id}
                  className="animate-fade-in-up hover:bg-muted/50 transition-colors duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-muted/50 text-foreground border border-border/50">
                      {ROLE_LABELS[user.role]}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.department || "-"}</TableCell>
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
                          {onResendEmail && user.college_email && isUserRecent(user) && (
                            <DropdownMenuItem onClick={() => onResendEmail(user)}>
                              <Mail className="mr-2 h-4 w-4" />
                              Resend Welcome Email
                            </DropdownMenuItem>
                          )}
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
    </div>
  );
}
