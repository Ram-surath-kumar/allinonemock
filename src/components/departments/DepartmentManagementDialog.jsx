import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Edit2, Plus, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function DepartmentManagementDialog({ open, onOpenChange }) {
  const { currentUser } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [departmentName, setDepartmentName] = useState("");
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (open) {
      loadDepartments();
      resetForm();
    }
  }, [open]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.getDepartments();
      if (response.error) throw new Error(response.error);

      if (response.data && Array.isArray(response.data)) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error("Error loading departments:", error);
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const response = await api.getUsers({ role: "teacher", status: "active" });
      if (response.error) throw new Error(response.error);

      if (response.data && Array.isArray(response.data)) {
        const teacherList = response.data.map((t) => ({
          id: t.id,
          name: t.name,
          email: t.email,
        }));
        setTeachers(teacherList);
      }
    } catch (error) {
      console.error("Error loading teachers:", error);
      toast.error("Failed to load teachers");
    } finally {
      setLoadingTeachers(false);
    }
  };

  const resetForm = () => {
    setDepartmentName("");
    setSelectedTeachers([]);
    setEditingDepartment(null);
    setIsCreating(false);
    setTeachers([]);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
    loadTeachers();
  };

  const handleEdit = (department) => {
    setDepartmentName(department.name);
    setEditingDepartment(department);
    setIsCreating(false);
    loadTeachers();
    // Load teachers already mapped to this department
    loadDepartmentTeachers(department.id);
  };

  const loadDepartmentTeachers = async (departmentId) => {
    try {
      // Get all teachers and check which ones have this department
      const response = await api.getUsers({ role: "teacher", status: "active" });
      if (response.error) throw new Error(response.error);

      if (response.data && Array.isArray(response.data)) {
        const mappedTeachers = [];
        for (const teacher of response.data) {
          const deptResponse = await api.getTeacherDepartments(teacher.id);
          if (!deptResponse.error && deptResponse.data && Array.isArray(deptResponse.data)) {
            const hasDepartment = deptResponse.data.some((td) => td.department_id === departmentId);
            if (hasDepartment) {
              mappedTeachers.push(teacher.id);
            }
          }
        }
        setSelectedTeachers(mappedTeachers);
      }
    } catch (error) {
      console.error("Error loading department teachers:", error);
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const toggleTeacher = (teacherId) => {
    setSelectedTeachers((prev) =>
      prev.includes(teacherId) ? prev.filter((id) => id !== teacherId) : [...prev, teacherId]
    );
  };

  const handleSave = async () => {
    if (!departmentName.trim()) {
      toast.error("Please enter a department name");
      return;
    }

    try {
      setLoading(true);

      if (editingDepartment) {
        // Update existing department
        const updateResponse = await api.updateDepartment(editingDepartment.id, {
          name: departmentName.trim(),
        });

        if (updateResponse.error) throw new Error(updateResponse.error);

        // Update teacher mappings if needed
        if (selectedTeachers.length > 0) {
          // Get current teachers for this department
          const currentTeachers = [];
          for (const teacher of teachers) {
            const deptResponse = await api.getTeacherDepartments(teacher.id);
            if (!deptResponse.error && deptResponse.data && Array.isArray(deptResponse.data)) {
              const hasDepartment = deptResponse.data.some(
                (td) => td.department_id === editingDepartment.id
              );
              if (hasDepartment) {
                currentTeachers.push(teacher.id);
              }
            }
          }

          // Remove department from teachers who are no longer selected
          for (const teacherId of currentTeachers) {
            if (!selectedTeachers.includes(teacherId)) {
              const deptResponse = await api.getTeacherDepartments(teacherId);
              let currentDeptIds = [];

              if (!deptResponse.error && deptResponse.data && Array.isArray(deptResponse.data)) {
                currentDeptIds = deptResponse.data.map((td) => td.department_id);
              }

              const updatedDeptIds = currentDeptIds.filter((id) => id !== editingDepartment.id);
              await api.updateTeacherDepartments(teacherId, updatedDeptIds);
            }
          }

          // Add department to newly selected teachers
          for (const teacherId of selectedTeachers) {
            if (!currentTeachers.includes(teacherId)) {
              const deptResponse = await api.getTeacherDepartments(teacherId);
              let currentDeptIds = [];

              if (!deptResponse.error && deptResponse.data && Array.isArray(deptResponse.data)) {
                currentDeptIds = deptResponse.data.map((td) => td.department_id);
              }

              const updatedDeptIds = [...new Set([...currentDeptIds, editingDepartment.id])];
              await api.updateTeacherDepartments(teacherId, updatedDeptIds);
            }
          }
        }

        toast.success("Department updated successfully");
      } else {
        // Create new department
        const deptResponse = await api.createDepartment({
          name: departmentName.trim(),
          created_by: currentUser?.id,
        });

        if (deptResponse.error) throw new Error(deptResponse.error);
        if (!deptResponse.data) throw new Error("Failed to create department");

        const newDepartment = deptResponse.data;
        const departmentId = newDepartment.id;

        // Map selected teachers to the new department
        if (selectedTeachers.length > 0) {
          for (const teacherId of selectedTeachers) {
            // Get current teacher departments
            const currentDeptResponse = await api.getTeacherDepartments(teacherId);
            let currentDeptIds = [];

            if (
              !currentDeptResponse.error &&
              currentDeptResponse.data &&
              Array.isArray(currentDeptResponse.data)
            ) {
              currentDeptIds = currentDeptResponse.data.map((td) => td.department_id);
            }

            // Add the new department to the list
            const updatedDeptIds = [...new Set([...currentDeptIds, departmentId])];

            // Update teacher departments
            await api.updateTeacherDepartments(teacherId, updatedDeptIds);
          }
        }

        toast.success(
          `Department "${departmentName}" created successfully${selectedTeachers.length > 0 ? ` and mapped to ${selectedTeachers.length} teacher(s)` : ""}`
        );
      }

      await loadDepartments();
      resetForm();
    } catch (error) {
      console.error("Error saving department:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save department";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (departmentId, departmentName) => {
    if (
      !confirm(
        `Are you sure you want to delete the department "${departmentName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.deleteDepartment(departmentId);

      if (response.error) throw new Error(response.error);
      toast.success("Department deleted successfully");
      await loadDepartments();
    } catch (error) {
      console.error("Error deleting department:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete department";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Departments</DialogTitle>
          <DialogDescription>
            Add, edit, or delete departments and map teachers to them
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create/Edit Form */}
          {(isCreating || editingDepartment) && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingDepartment ? "Edit Department" : "Create New Department"}
                </h3>
                <Button variant="ghost" size="icon" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department-name">Department Name *</Label>
                <Input
                  id="department-name"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="Enter department name"
                />
              </div>

              <div className="space-y-2">
                <Label>Map Teachers (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Select teachers who should have access to this department
                </p>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  {loadingTeachers ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : teachers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No teachers available</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <span className="text-sm font-medium">
                          {selectedTeachers.length} of {teachers.length} selected
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (selectedTeachers.length === teachers.length) {
                              setSelectedTeachers([]);
                            } else {
                              setSelectedTeachers(teachers.map((t) => t.id));
                            }
                          }}
                          className="h-6 text-xs"
                        >
                          {selectedTeachers.length === teachers.length
                            ? "Deselect All"
                            : "Select All"}
                        </Button>
                      </div>
                      {teachers.map((teacher) => (
                        <div
                          key={teacher.id}
                          className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
                        >
                          <Checkbox
                            checked={selectedTeachers.includes(teacher.id)}
                            onCheckedChange={() => toggleTeacher(teacher.id)}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{teacher.name}</div>
                            <div className="text-xs text-muted-foreground">{teacher.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {editingDepartment ? "Update Department" : "Create Department"}
                </Button>
              </div>
            </div>
          )}

          {/* Departments List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Departments</h3>
              {!isCreating && !editingDepartment && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              )}
            </div>

            {loading && !departments.length ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : departments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No departments found. Click "Add Department" to create one.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department Name</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(dept)}
                            disabled={loading}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(dept.id, dept.name)}
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
