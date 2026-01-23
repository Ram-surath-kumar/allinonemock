import { useState, useEffect } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { ROLE_LABELS, ROLE_DEFAULT_PERMISSIONS, ROLE_HIERARCHY } from "@/types/erp";
import { useAuth } from "@/contexts/AuthContext";
import { UserTable } from "@/components/users/UserTable";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { EditUserDialog } from "@/components/users/EditUserDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { api } from "@/services/api";
import { createUserAddedActivity, createBulkUserAddedActivities } from "@/services/activities";
import { updateTeacherDepartments } from "@/services/departments";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function UserManagement({ dialogOpen, setDialogOpen }) {
  const { currentUser, canManageRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Only fetch users when component is mounted (i.e., when User Management tab is active)
  useEffect(() => {
    fetchUsers();
  }, []); // Only load once when component mounts

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch users first
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // Fetch department names separately for users with department_id
        const departmentIds = [
          ...new Set(data.filter((u) => u.department_id).map((u) => u.department_id)),
        ];
        const deptMap = new Map();

        if (departmentIds.length > 0) {
          const { data: deptData, error: deptError } = await supabase
            .from("departments")
            .select("id, name")
            .in("id", departmentIds);

          if (!deptError && deptData) {
            deptData.forEach((dept) => {
              deptMap.set(dept.id, dept.name);
            });
          }
        }

        const mappedUsers = data.map((row) => ({
          id: row.id,
          loopid: row.loopid,
          org_id: row.org_id,
          user_id: row.user_id,
          name: row.name,
          email: row.email,
          college_email: row.college_email,
          role: row.role,
          permissions: row.permissions || [],
          department: row.department_id
            ? deptMap.get(row.department_id) || null
            : row.department || null,
          createdAt: new Date(row.created_at),
          status: row.status || "inactive",
          avatar: row.avatar,
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = async (newUser) => {
    try {
      const email = newUser.email;
      const loopid = newUser.loopid;
      const college_email = newUser.college_email;

      // Generate temporary email if not provided (will be updated after user_id is known)
      let tempEmail = email;
      if (!tempEmail) {
        // For all roles, use temporary email - will be updated after user_id is known
        tempEmail = `temp-${currentUser?.organization?.org_id || "org"}-${Date.now()}@loopverse.in`;
      }

      // Use API to create user (which will handle email sending)
      const response = await api.createUser({
        name: newUser.name,
        email: tempEmail, // Always provide email to satisfy NOT NULL constraint
        role: newUser.role,
        permissions: newUser.permissions,
        department_id: newUser.department_id || null,
        loopid: loopid || null, // Will be updated after user_id is known
        status: "active",
        college_email: college_email, // Pass college email to backend
      });

      if (response.error) throw new Error(response.error);
      const data = response.data;

      // For all users: Generate email as org_id + user_id @loopverse.in
      if (data && currentUser?.organization?.org_id && data.user_id) {
        const generatedEmail = `${currentUser.organization.org_id}${data.user_id}@loopverse.in`;

        // For students, also generate loopid
        const updateData =
          newUser.role === "student"
            ? {
                email: generatedEmail,
                loopid: `${currentUser.organization.org_id}${data.user_id}`,
              }
            : { email: generatedEmail };

        // Update the user with generated email (and loopid for students)
        const { error: updateError } = await supabase
          .from("users")
          .update(updateData)
          .eq("id", data.id);

        if (updateError) {
          console.error("Error updating email and loopid:", updateError);
          throw updateError;
        } else {
          // Update data object with new values
          data.email = generatedEmail;
          if (newUser.role === "student") {
            data.loopid = updateData.loopid;
          }
        }
      }

      // Send welcome email after user is fully created with final email and loopid
      if (college_email && data) {
        try {
          const emailResponse = await api.sendWelcomeEmail({
            college_email,
            loop_email: data.email,
            loopid: data.loopid || "",
            user_name: data.name,
            user_id: data.user_id,
          });

          if (emailResponse.error) {
            console.error("Error sending welcome email:", emailResponse.error);
            // Don't fail user creation if email fails
            toast.warning(
              "User created but email could not be sent. Please check email configuration."
            );
          } else {
            toast.success("Welcome email sent successfully");
          }
        } catch (emailError) {
          console.error("Error sending welcome email:", emailError);
          // Don't fail user creation if email fails
        }
      }

      if (data) {
        // For teachers, update teacher_departments
        if (
          newUser.role === "teacher" &&
          newUser.department_ids &&
          newUser.department_ids.length > 0
        ) {
          const { error: deptError } = await supabase.from("teacher_departments").insert(
            newUser.department_ids.map((deptId) => ({
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
            .from("departments")
            .select("name")
            .eq("id", data.department_id)
            .single();
          departmentName = deptData?.name || null;
        }

        const user = {
          id: data.id,
          loopid: data.loopid,
          org_id: data.org_id,
          user_id: data.user_id,
          name: data.name,
          email: data.email,
          role: data.role,
          permissions: data.permissions || [],
          department: departmentName,
          createdAt: new Date(data.created_at),
          status: data.status || "inactive",
          avatar: data.avatar,
        };
        setUsers((prev) => [user, ...prev]);

        // Create activity for new user
        await createUserAddedActivity(user.name, user.department || "");

        toast.success(`User ${user.name} added successfully`);
      }
    } catch (error) {
      console.error("Error adding user:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add user";
      toast.error(errorMessage);
    }
  };

  const handleAddMultipleUsers = async (users) => {
    try {
      if (!currentUser?.organization?.org_id) {
        throw new Error("Organization ID is required");
      }

      // Prepare users for bulk insert with temporary emails
      const usersToInsert = users.map((user, index) => {
        let tempEmail = user.email;
        if (!tempEmail) {
          // For all roles, generate unique temporary email - will be updated after user_id is known
          tempEmail = `temp-${currentUser.organization.org_id}-${Date.now()}-${index}@loopverse.in`;
        }

        return {
          name: user.name,
          email: tempEmail,
          role: user.role,
          permissions: user.permissions || [],
          department_id: user.department_id || null,
          loopid: user.loopid || null,
          status: "active",
        };
      });

      // Bulk insert all users at once
      const { data: insertedUsers, error: insertError } = await supabase
        .from("users")
        .insert(usersToInsert)
        .select();

      if (insertError) throw insertError;
      if (!insertedUsers || insertedUsers.length === 0) {
        throw new Error("No users were inserted");
      }

      // For all users, update email in batch (format: org_id + user_id @loopverse.in)
      // For students, also update loopid
      const userUpdates = insertedUsers
        .map((user, index) => {
          const originalUser = users[index];
          if (user.user_id) {
            const generatedEmail = `${currentUser.organization.org_id}${user.user_id}@loopverse.in`;
            const update = {
              id: user.id,
              email: generatedEmail,
            };
            // For students, also generate loopid
            if (originalUser.role === "student") {
              update.loopid = `${currentUser.organization.org_id}${user.user_id}`;
            }
            return update;
          }
          return null;
        })
        .filter((update) => update !== null);

      // Batch update all user emails (and loopids for students)
      if (userUpdates.length > 0) {
        // Use Promise.all to update all users in parallel
        const updatePromises = userUpdates.map((update) =>
          supabase
            .from("users")
            .update({
              email: update.email,
              ...(update.loopid && { loopid: update.loopid }),
            })
            .eq("id", update.id)
        );

        const updateResults = await Promise.all(updatePromises);
        const updateErrors = updateResults.filter((result) => result.error);

        if (updateErrors.length > 0) {
          console.error("Some email updates failed:", updateErrors);
          // Update insertedUsers with new values for successful updates
          userUpdates.forEach((update) => {
            const user = insertedUsers.find((u) => u.id === update.id);
            if (user) {
              user.email = update.email;
              if (update.loopid) {
                user.loopid = update.loopid;
              }
            }
          });
        } else {
          // Update all successfully
          userUpdates.forEach((update) => {
            const user = insertedUsers.find((u) => u.id === update.id);
            if (user) {
              user.email = update.email;
              if (update.loopid) {
                user.loopid = update.loopid;
              }
            }
          });
        }
      }

      // Handle teacher_departments for teachers
      const teacherInserts = insertedUsers
        .map((user, index) => {
          const originalUser = users[index];
          if (
            originalUser.role === "teacher" &&
            originalUser.department_ids &&
            originalUser.department_ids.length > 0
          ) {
            return originalUser.department_ids.map((deptId) => ({
              teacher_id: user.id,
              department_id: deptId,
            }));
          }
          return [];
        })
        .flat();

      if (teacherInserts.length > 0) {
        const { error: deptError } = await supabase
          .from("teacher_departments")
          .insert(teacherInserts);

        if (deptError) {
          console.error("Error inserting teacher departments:", deptError);
          // Don't throw - users were created, just department mapping failed
        }
      }

      // Fetch department names for display
      const departmentIds = [...new Set(insertedUsers.map((u) => u.department_id).filter(Boolean))];
      const deptMap = new Map();

      if (departmentIds.length > 0) {
        const { data: deptData } = await supabase
          .from("departments")
          .select("id, name")
          .in("id", departmentIds);

        if (deptData) {
          deptData.forEach((dept) => {
            deptMap.set(dept.id, dept.name);
          });
        }
      }

      // Map to User objects and add to state
      const newUsers = insertedUsers.map((row) => ({
        id: row.id,
        loopid: row.loopid,
        org_id: row.org_id,
        user_id: row.user_id,
        name: row.name,
        email: row.email,
        role: row.role,
        permissions: row.permissions || [],
        department: row.department_id ? deptMap.get(row.department_id) || null : null,
        createdAt: new Date(row.created_at),
        status: row.status,
        avatar: row.avatar,
      }));

      setUsers((prev) => [...newUsers, ...prev]);

      // Create activities for new users in bulk (single API call)
      await createBulkUserAddedActivities(
        newUsers.map((user) => ({
          name: user.name,
          department: user.department || undefined,
        }))
      );

      toast.success(`Successfully added ${newUsers.length} user(s)`);
    } catch (error) {
      console.error("Error adding multiple users:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add users";
      toast.error(errorMessage);
      throw error; // Re-throw so caller can handle it
    }
  };

  const handleEditUser = (user) => {
    if (!canManageRole(user.role)) {
      toast.error(
        `You cannot edit users with the ${user.role} role. You can only manage roles below yours in the hierarchy.`
      );
      return;
    }
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async (user, updatedData) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: updatedData.name,
          email: updatedData.email,
          role: updatedData.role,
          permissions: updatedData.permissions,
          department_id: updatedData.department_id || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      // For teachers, update teacher_departments using the service function
      if (updatedData.role === "teacher") {
        await updateTeacherDepartments(user.id, updatedData.department_ids || []);
      } else {
        // If role changed from teacher to something else, remove teacher_departments
        const { error: deleteError } = await supabase
          .from("teacher_departments")
          .delete()
          .eq("teacher_id", user.id);

        if (deleteError) {
          console.error("Error removing teacher departments:", deleteError);
          // Don't throw - this is cleanup, not critical
        }
      }

      // Refresh users list
      await fetchUsers();
      setEditDialogOpen(false);
      setSelectedUser(null);
      toast.success(`User ${updatedData.name} updated successfully`);
    } catch (error) {
      console.error("Error updating user:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update user";
      toast.error(errorMessage);
    }
  };

  const handleResendEmail = async (user) => {
    try {
      if (!user.college_email) {
        toast.error("College email not found for this user");
        return;
      }

      const emailResponse = await api.sendWelcomeEmail({
        college_email: user.college_email,
        loop_email: user.email || "",
        loopid: user.loopid || "",
        user_name: user.name,
        user_id: user.user_id,
      });

      if (emailResponse.error) {
        throw new Error(emailResponse.error);
      }

      toast.success("Welcome email sent successfully");
    } catch (error) {
      console.error("Error resending welcome email:", error);
      toast.error(error.message || "Failed to resend welcome email");
    }
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    // Store user reference for API call and potential rollback
    const user = userToDelete;
    const previousUsers = [...users];

    // Optimistic Update: Immediately remove from UI and close dialog
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    setDeleteDialogOpen(false);
    setUserToDelete(null);
    toast.info(`Deleting ${user.name}...`);

    try {
      // Use API to delete user, which handles cascading delete of all associated data on the backend
      const response = await api.deleteUser(user.id);

      if (response.error) throw new Error(response.error);

      toast.success(`User ${user.name} permanently deleted`);
    } catch (error) {
      console.error("Error deleting user:", error);

      // Revert state on error
      setUsers(previousUsers);

      const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
      toast.error(`Failed to delete user: ${errorMessage}`);
    }
  };

  // Filter roles based on what current user can manage
  const manageableRoles = Object.keys(ROLE_LABELS).filter((role) => canManageRole(role));

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row flex-1 gap-3 sm:gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {manageableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Role Hierarchy:</strong> As a{" "}
          <span className="font-medium text-foreground">
            {currentUser && ROLE_LABELS[currentUser.role]}
          </span>
          , you can manage users with roles below yours in the hierarchy. Lower-level users cannot
          manage higher-level users.
        </p>
      </div>

      {/* User table */}
      {loading ? (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              >
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
          onResendEmail={handleResendEmail}
        />
      )}

      {/* Add User Dialog */}
      <AddUserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAddUser}
        onAddMultiple={async (users) => {
          // Handle multiple users from AI extraction - use bulk insert
          try {
            await handleAddMultipleUsers(users);
            await fetchUsers(); // Refresh the list
          } catch (error) {
            console.error("Error adding multiple users:", error);
            // Error already shown in handleAddMultipleUsers
          }
        }}
      />

      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        onUpdate={handleUpdateUser}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong>{userToDelete?.name}</strong> and remove all associated data including grades,
              attendance, and fee records from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
