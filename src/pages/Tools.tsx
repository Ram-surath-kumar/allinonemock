import { useState } from 'react';
import { Wrench, Building2, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleManagementDialog } from '@/components/roles/RoleManagementDialog';
import { DepartmentManagementDialog } from '@/components/departments/DepartmentManagementDialog';

export function Tools() {
  const { currentUser } = useAuth();
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [roleManagementDialogOpen, setRoleManagementDialogOpen] = useState(false);


  return (
    <div className="space-y-3">
      <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
        <CardHeader className="p-3.5 pb-3">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Tools</CardTitle>
          </div>
          <CardDescription>Administrative tools and utilities</CardDescription>
        </CardHeader>
        <CardContent className="p-3.5 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Department Action Box */}
            <button
              onClick={() => setDepartmentDialogOpen(true)}
              className="group relative p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 hover:shadow-depth-2 transition-all duration-200 text-left"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Department</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    Add, edit, or delete departments
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </button>

            {/* Roles Action Box */}
            <button
              onClick={() => setRoleManagementDialogOpen(true)}
              className="group relative p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 hover:shadow-depth-2 transition-all duration-200 text-left"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Roles</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    Add, edit, or delete custom roles
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </button>

            {/* Placeholder for future tools */}
            {/* Add more action boxes here as needed */}
          </div>
        </CardContent>
      </Card>

      {/* Department Management Dialog */}
      <DepartmentManagementDialog
        open={departmentDialogOpen}
        onOpenChange={setDepartmentDialogOpen}
      />

      {/* Role Management Dialog */}
      <RoleManagementDialog
        open={roleManagementDialogOpen}
        onOpenChange={setRoleManagementDialogOpen}
      />
    </div>
  );
}

