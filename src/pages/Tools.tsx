import { useState, useEffect } from 'react';
import { Wrench, Building2, Plus, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Teacher {
  id: string;
  name: string;
  email: string;
}

export function Tools() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [departmentName, setDepartmentName] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [addDepartmentDialogOpen, setAddDepartmentDialogOpen] = useState(false);

  useEffect(() => {
    if (addDepartmentDialogOpen && teachers.length === 0) {
      loadTeachers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addDepartmentDialogOpen]);

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const response = await api.getUsers({ role: 'teacher', status: 'active' });
      if (response.error) throw new Error(response.error);
      
      if (response.data && Array.isArray(response.data)) {
        interface ApiTeacher {
          id: string;
          name: string;
          email: string;
        }
        const teacherList: Teacher[] = response.data.map((t: ApiTeacher) => ({
          id: t.id,
          name: t.name,
          email: t.email,
        }));
        setTeachers(teacherList);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast.error('Failed to load teachers');
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!departmentName.trim()) {
      toast.error('Please enter a department name');
      return;
    }

    try {
      setLoading(true);

      // Create the department
      const deptResponse = await api.createDepartment({
        name: departmentName.trim(),
        created_by: currentUser?.id || '',
      });

      if (deptResponse.error) throw new Error(deptResponse.error);
      if (!deptResponse.data) throw new Error('Failed to create department');

      interface DepartmentData {
        id: string;
        name: string;
      }
      const newDepartment = deptResponse.data as DepartmentData;
      const departmentId = newDepartment.id;

      // Map selected teachers to the new department
      if (selectedTeachers.length > 0) {
        for (const teacherId of selectedTeachers) {
          // Get current teacher departments
          const currentDeptResponse = await api.getTeacherDepartments(teacherId);
          let currentDeptIds: string[] = [];
          
          if (!currentDeptResponse.error && currentDeptResponse.data && Array.isArray(currentDeptResponse.data)) {
            interface TeacherDepartment {
              department_id: string;
            }
            currentDeptIds = currentDeptResponse.data.map((td: TeacherDepartment) => td.department_id);
          }

          // Add the new department to the list
          const updatedDeptIds = [...new Set([...currentDeptIds, departmentId])];

          // Update teacher departments
          await api.updateTeacherDepartments(teacherId, updatedDeptIds);
        }
      }

      toast.success(`Department "${departmentName}" created successfully${selectedTeachers.length > 0 ? ` and mapped to ${selectedTeachers.length} teacher(s)` : ''}`);
      
      // Reset form and close dialog
      setDepartmentName('');
      setSelectedTeachers([]);
      setAddDepartmentDialogOpen(false);
    } catch (error) {
      console.error('Error creating department:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create department';
      
      // Check if it's a service role key error
      if (errorMessage.includes('SUPABASE_SERVICE_ROLE_KEY') || errorMessage.includes('row-level security')) {
        toast.error(
          'Server configuration error: Service Role Key is required. Please check SETUP_SERVICE_ROLE_KEY.md for instructions.',
          { duration: 10000 }
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleTeacher = (teacherId: string) => {
    setSelectedTeachers(prev =>
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

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
            {/* Add Department Action Box */}
            <button
              onClick={() => setAddDepartmentDialogOpen(true)}
              className="group relative p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 hover:shadow-depth-2 transition-all duration-200 text-left"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Add Department</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    Create a new department and map teachers to it
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

      {/* Add Department Dialog */}
      <Dialog open={addDepartmentDialogOpen} onOpenChange={setAddDepartmentDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription>
              Create a new department and optionally map teachers to it
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="department-name">Department Name *</Label>
              <Input
                id="department-name"
                placeholder="e.g., Computer Science, Mathematics"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Map Teachers (Optional)</Label>
              <p className="text-xs text-muted-foreground">
                Select teachers who should have access to this department
              </p>
              <div className="rounded-lg border border-border p-3 min-h-[100px] max-h-[300px] overflow-y-auto bg-muted/20">
                {loadingTeachers ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : teachers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No teachers available
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
                      <span className="text-xs font-medium text-muted-foreground">
                        {selectedTeachers.length} of {teachers.length} selected
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (selectedTeachers.length === teachers.length) {
                            setSelectedTeachers([]);
                          } else {
                            setSelectedTeachers(teachers.map(t => t.id));
                          }
                        }}
                        className="h-6 text-xs"
                      >
                        {selectedTeachers.length === teachers.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    {teachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`teacher-${teacher.id}`}
                          checked={selectedTeachers.includes(teacher.id)}
                          onCheckedChange={() => toggleTeacher(teacher.id)}
                        />
                        <Label
                          htmlFor={`teacher-${teacher.id}`}
                          className="flex-1 cursor-pointer text-sm font-medium"
                        >
                          {teacher.name}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {teacher.email}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAddDepartmentDialogOpen(false);
                  setDepartmentName('');
                  setSelectedTeachers([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateDepartment}
                disabled={loading || !departmentName.trim()}
              >
                {loading ? (
                  <>
                    <span className="mr-2">Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Department
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

