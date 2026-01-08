import { useState, useEffect } from 'react';
import { Search, Pencil, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { StudentTable } from '@/components/students/StudentTable';
import { EditStudentDialog } from '@/components/students/EditStudentDialog';
import { StudentAttendanceCalendar } from '@/components/students/StudentAttendanceCalendar';
import { fetchTeacherDepartments } from '@/services/departments';

export function Students() {
  const { hasPermission, currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [teacherDepartmentIds, setTeacherDepartmentIds] = useState([]);
  const [viewMode, setViewMode] = useState('grid');

  const canEdit = hasPermission('edit_students');
  const canViewAttendance = hasPermission('view_students') || hasPermission('manage_attendance');

  useEffect(() => {
    // Only load data when component is mounted (i.e., when Students tab is active)
    if (currentUser) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]); // Only reload if user changes

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load teacher departments if user is a teacher
      let teacherDeptIds = [];
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

  const fetchStudents = async (teacherDeptIds = []) => {
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
        const response = await api.getUsersByDepartments(deptIdsToUse, 'student', 'active');
        if (response.error) throw new Error(response.error);
        const data = response.data;

        if (data && Array.isArray(data)) {
          // Fetch department names separately for students with department_id
          const departmentIds = [...new Set(data.filter((u) => u.department_id).map((u) => u.department_id))];
          const deptMap = new Map();
          
          if (departmentIds.length > 0) {
            const deptResponse = await api.getDepartments({ ids: departmentIds });
            if (!deptResponse.error && deptResponse.data && Array.isArray(deptResponse.data)) {
              deptResponse.data.forEach((dept) => {
                deptMap.set(dept.id, dept.name);
              });
            }
          }

          const mappedStudents = data.map((row) => ({
            id: row.id,
            loopid: row.loopid,
            org_id: row.org_id,
            user_id: row.user_id,
            name: row.name,
            email: row.email,
            role: row.role,
            permissions: row.permissions || [],
            department: row.department_id ? deptMap.get(row.department_id) || null : row.department || null,
            createdAt: new Date(row.created_at),
            status: row.status || 'inactive',
            avatar: row.avatar,
          }));
          setStudents(mappedStudents);
        }
        return;
      }

      // For non-teachers (admin, vice_head, etc.), show all students
      const response = await api.getUsers({ role: 'student', status: 'active' });
      if (response.error) throw new Error(response.error);
      const data = response.data;

      if (data && Array.isArray(data)) {
        // Fetch department names separately for students with department_id
        const departmentIds = [...new Set(data.filter((u) => u.department_id).map((u) => u.department_id))];
        const deptMap = new Map();
        
        if (departmentIds.length > 0) {
          const deptResponse = await api.getDepartments({ ids: departmentIds });
          if (!deptResponse.error && deptResponse.data && Array.isArray(deptResponse.data)) {
            deptResponse.data.forEach((dept) => {
              deptMap.set(dept.id, dept.name);
            });
          }
        }

        const mappedStudents = data.map((row) => ({
          id: row.id,
          loopid: row.loopid,
          org_id: row.org_id,
          user_id: row.user_id,
          name: row.name,
          email: row.email,
          role: row.role,
          permissions: row.permissions || [],
          department: row.department_id ? deptMap.get(row.department_id) || null : row.department || null,
          createdAt: new Date(row.created_at),
          status: row.status || 'inactive',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherDepartmentIds]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.department && student.department.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const handleEdit = (student) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit students');
      return;
    }
    setSelectedStudent(student);
    setEditDialogOpen(true);
  };

  const handleViewAttendance = (student) => {
    if (!canViewAttendance) {
      toast.error('You do not have permission to view attendance');
      return;
    }
    setSelectedStudent(student);
    setAttendanceDialogOpen(true);
  };

  const handleUpdate = async (updatedData) => {
    if (!selectedStudent) return;

    try {
      const response = await api.updateUser(selectedStudent.id, {
        name: updatedData.name,
        email: updatedData.email,
        department_id: updatedData.department_id,
      });

      if (response.error) throw new Error(response.error);

      // Refresh students list
      await fetchStudents(teacherDepartmentIds);
      setEditDialogOpen(false);
      setSelectedStudent(null);
      toast.success('Student information updated successfully');
    } catch (error) {
      console.error('Error updating student:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update student';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with search and view toggle */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
        <div className="relative flex-1 min-w-0 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        {/* View toggle - only show on desktop */}
        <div className="hidden md:flex items-center gap-2 border border-border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8 p-0"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
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
          viewMode={viewMode}
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
