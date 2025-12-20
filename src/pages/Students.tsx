import { useState, useEffect } from 'react';
import { Search, Pencil } from 'lucide-react';
import { User } from '@/types/erp';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { StudentTable } from '@/components/students/StudentTable';
import { EditStudentDialog } from '@/components/students/EditStudentDialog';
import { StudentAttendanceCalendar } from '@/components/students/StudentAttendanceCalendar';
import { fetchTeacherDepartments } from '@/services/departments';

export function Students() {
  const { hasPermission, currentUser } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [teacherDepartmentIds, setTeacherDepartmentIds] = useState<string[]>([]);

  const canEdit = hasPermission('edit_students');
  const canViewAttendance = hasPermission('view_students') || hasPermission('manage_attendance');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load teacher departments if user is a teacher
      let teacherDeptIds: string[] = [];
      if (currentUser?.role === 'teacher' && currentUser.id) {
        teacherDeptIds = await fetchTeacherDepartments(currentUser.id);
        setTeacherDepartmentIds(teacherDeptIds);
      }

      // Load students with teacher department IDs
      await fetchStudents(teacherDeptIds);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (teacherDeptIds: string[] = []) => {
    try {
      // If teacher, filter by their departments
      if (currentUser?.role === 'teacher') {
        const deptIdsToUse = teacherDeptIds.length > 0 ? teacherDeptIds : teacherDepartmentIds;
        
        if (deptIdsToUse.length === 0) {
          // Teacher with no departments assigned - show no students
          setStudents([]);
          return;
        }

        // Filter students by teacher's departments
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'student')
          .eq('status', 'active')
          .in('department_id', deptIdsToUse)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          // Fetch department names separately for students with department_id
          const departmentIds = [...new Set(data.filter((u: any) => u.department_id).map((u: any) => u.department_id))];
          let deptMap = new Map<string, string>();
          
          if (departmentIds.length > 0) {
            const { data: deptData, error: deptError } = await supabase
              .from('departments')
              .select('id, name')
              .in('id', departmentIds);
            
            if (!deptError && deptData) {
              deptData.forEach((dept: any) => {
                deptMap.set(dept.id, dept.name);
              });
            }
          }

          const mappedStudents: User[] = data.map((row: any) => ({
            id: row.id,
            loopid: row.loopid,
            org_id: row.org_id,
            user_id: row.user_id,
            name: row.name,
            email: row.email,
            role: row.role as 'student',
            permissions: row.permissions || [],
            department: row.department_id ? deptMap.get(row.department_id) || null : row.department || null,
            createdAt: new Date(row.created_at),
            status: row.status as 'active' | 'inactive',
            avatar: row.avatar,
          }));
          setStudents(mappedStudents);
        }
        return;
      }

      // For non-teachers (admin, vice_head, etc.), show all students
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Fetch department names separately for students with department_id
        const departmentIds = [...new Set(data.filter((u: any) => u.department_id).map((u: any) => u.department_id))];
        let deptMap = new Map<string, string>();
        
        if (departmentIds.length > 0) {
          const { data: deptData, error: deptError } = await supabase
            .from('departments')
            .select('id, name')
            .in('id', departmentIds);
          
          if (!deptError && deptData) {
            deptData.forEach((dept: any) => {
              deptMap.set(dept.id, dept.name);
            });
          }
        }

        const mappedStudents: User[] = data.map((row: any) => ({
          id: row.id,
          loopid: row.loopid,
          org_id: row.org_id,
          user_id: row.user_id,
          name: row.name,
          email: row.email,
          role: row.role as 'student',
          permissions: row.permissions || [],
          department: row.department_id ? deptMap.get(row.department_id) || null : row.department || null,
          createdAt: new Date(row.created_at),
          status: row.status as 'active' | 'inactive',
          avatar: row.avatar,
        }));
        setStudents(mappedStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // Reload students when teacher department IDs change
  useEffect(() => {
    if (currentUser?.role === 'teacher' && teacherDepartmentIds.length > 0) {
      fetchStudents(teacherDepartmentIds);
    }
  }, [teacherDepartmentIds]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.department && student.department.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const handleEdit = (student: User) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit students');
      return;
    }
    setSelectedStudent(student);
    setEditDialogOpen(true);
  };

  const handleViewAttendance = (student: User) => {
    if (!canViewAttendance) {
      toast.error('You do not have permission to view attendance');
      return;
    }
    setSelectedStudent(student);
    setAttendanceDialogOpen(true);
  };

  const handleUpdate = async (updatedData: {
    name: string;
    email: string;
    department_id: string;
  }) => {
    if (!selectedStudent) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: updatedData.name,
          email: updatedData.email,
          department_id: updatedData.department_id,
        })
        .eq('id', selectedStudent.id);

      if (error) throw error;

      // Refresh students list
      await fetchStudents(teacherDepartmentIds);
      setEditDialogOpen(false);
      setSelectedStudent(null);
      toast.success('Student information updated successfully');
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast.error(error.message || 'Failed to update student');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Info banner */}
      {!canEdit && (
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            You have view-only access. Users with "Edit Student Data" permission can edit student information.
          </p>
        </div>
      )}

      {/* Teacher with no departments warning */}
      {currentUser?.role === 'teacher' && teacherDepartmentIds.length === 0 && !loading && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 animate-fade-in">
          <p className="text-sm text-warning font-medium">
            ⚠️ No departments assigned. Please contact an administrator to assign departments to your account.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            You need to be assigned to at least one department to view students.
          </p>
        </div>
      )}

      {/* Students table */}
      {loading ? (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
                <div className="h-6 w-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <StudentTable
          students={filteredStudents}
          onEdit={handleEdit}
          onViewAttendance={handleViewAttendance}
          canEdit={canEdit}
          canViewAttendance={canViewAttendance}
        />
      )}

      {/* Edit Student Dialog */}
      {selectedStudent && (
        <EditStudentDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          student={selectedStudent}
          onUpdate={handleUpdate}
        />
      )}

      {/* Attendance Calendar Dialog */}
      {selectedStudent && (
        <StudentAttendanceCalendar
          open={attendanceDialogOpen}
          onOpenChange={setAttendanceDialogOpen}
          student={selectedStudent}
        />
      )}
    </div>
  );
}

