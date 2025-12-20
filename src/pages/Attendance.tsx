import { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle2, XCircle, Calendar, LayoutGrid, List } from 'lucide-react';
import { User } from '@/types/erp';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { fetchDepartments, fetchTeacherDepartments, Department } from '@/services/departments';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface AttendanceRecord {
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export function Attendance() {
  const { currentUser, hasPermission } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teacherDepartmentIds, setTeacherDepartmentIds] = useState<string[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceRecord>>(new Map());
  const [hideMarked, setHideMarked] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  const canManageAttendance = hasPermission('manage_attendance');
  const isAdminOrViceHead = currentUser?.role === 'admin' || currentUser?.role === 'vice_head';

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedDate && students.length > 0) {
      loadAttendanceForDate();
    }
  }, [selectedDate, students]);

  // Reload students when teacher department IDs change
  useEffect(() => {
    if (currentUser?.role === 'teacher' && teacherDepartmentIds.length > 0) {
      loadStudents(teacherDepartmentIds);
    }
  }, [teacherDepartmentIds]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load departments
      const depts = await fetchDepartments();
      setDepartments(depts);

      // Load teacher departments if user is a teacher
      let teacherDeptIds: string[] = [];
      if (currentUser?.role === 'teacher' && currentUser.id) {
        teacherDeptIds = await fetchTeacherDepartments(currentUser.id);
        setTeacherDepartmentIds(teacherDeptIds);
      }

      // Load students with teacher department IDs
      await loadStudents(teacherDeptIds);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (teacherDeptIds: string[] = []) => {
    try {
      // If teacher, we must filter by their assigned departments
      if (currentUser?.role === 'teacher') {
        // Use the passed teacherDeptIds (from async call) or fallback to state
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
          .order('name', { ascending: true });

        if (error) throw error;

        if (data) {
          // Fetch department names separately
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
            department: row.department_id ? deptMap.get(row.department_id) || null : null,
            createdAt: new Date(row.created_at),
            status: row.status as 'active' | 'inactive',
            avatar: row.avatar,
            // Store department_id for filtering
            department_id: row.department_id,
          } as User & { department_id?: string }));
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
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        // Fetch department names separately
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
          department: row.department_id ? deptMap.get(row.department_id) || null : null,
          createdAt: new Date(row.created_at),
          status: row.status as 'active' | 'inactive',
          avatar: row.avatar,
          // Store department_id for filtering
          department_id: row.department_id,
        } as User & { department_id?: string }));
        setStudents(mappedStudents);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    }
  };

  const loadAttendanceForDate = async () => {
    if (!selectedDate || students.length === 0) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const studentIds = students.map(s => s.id);

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', dateStr)
        .in('student_id', studentIds);

      if (error) throw error;

      const recordsMap = new Map<string, AttendanceRecord>();
      data?.forEach((record: any) => {
        recordsMap.set(record.student_id, {
          student_id: record.student_id,
          date: record.date,
          status: record.status,
        });
      });
      setAttendanceRecords(recordsMap);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const filteredStudents = students.filter(student => {
    // Department filter
    if (selectedDepartmentId !== 'all') {
      const studentDeptId = (student as any).department_id;
      if (!studentDeptId || studentDeptId !== selectedDepartmentId) {
        return false;
      }
    }

    // Search filter
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.department && student.department.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Hide marked filter
    if (hideMarked) {
      const isMarked = attendanceRecords.has(student.id);
      return !isMarked;
    }

    return true;
  });

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === filteredStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const markAttendance = async (status: 'present' | 'absent') => {
    if (selectedStudentIds.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    if (!canManageAttendance) {
      toast.error('You do not have permission to manage attendance');
      return;
    }

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const records = Array.from(selectedStudentIds).map(studentId => ({
        student_id: studentId,
        date: dateStr,
        status,
        marked_by: currentUser?.id || null,
      }));

      // Use upsert to handle both insert and update
      const { error } = await supabase
        .from('attendance')
        .upsert(records, {
          onConflict: 'student_id,date',
        });

      if (error) throw error;

      // Refresh attendance records
      await loadAttendanceForDate();
      setSelectedStudentIds(new Set());
      toast.success(`Marked ${selectedStudentIds.size} student(s) as ${status}`);
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      toast.error(error.message || 'Failed to mark attendance');
    }
  };

  const getAttendanceStatus = (studentId: string): AttendanceRecord | null => {
    return attendanceRecords.get(studentId) || null;
  };

  const getStatusStyles = (status: string, isSelected: boolean) => {
    if (isSelected) {
      // When selected, prioritize selection styling
      if (status === 'present') {
        return 'border-2 border-primary bg-green-50/30 dark:bg-green-950/10 ring-2 ring-primary ring-offset-1 rounded-lg';
      } else if (status === 'absent') {
        return 'border-2 border-primary bg-red-50/30 dark:bg-red-950/10 ring-2 ring-primary ring-offset-1 rounded-lg';
      } else if (status === 'late') {
        return 'border-2 border-primary bg-yellow-50/30 dark:bg-yellow-950/10 ring-2 ring-primary ring-offset-1 rounded-lg';
      } else if (status === 'excused') {
        return 'border-2 border-primary bg-blue-50/30 dark:bg-blue-950/10 ring-2 ring-primary ring-offset-1 rounded-lg';
      }
      return 'border-2 border-primary bg-primary/5 ring-2 ring-primary ring-offset-1 rounded-lg';
    }
    
    // When not selected, show status with colored left border
    switch (status) {
      case 'present':
        return 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20 border-r border-t border-b border-border rounded-lg';
      case 'absent':
        return 'border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20 border-r border-t border-b border-border rounded-lg';
      case 'late':
        return 'border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20 border-r border-t border-b border-border rounded-lg';
      case 'excused':
        return 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20 border-r border-t border-b border-border rounded-lg';
      default:
        return 'border border-border bg-card rounded-lg';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'late':
        return 'Late';
      case 'excused':
        return 'Excused';
      default:
        return '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500 hover:bg-green-600">Present</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Late</Badge>;
      case 'excused':
        return <Badge variant="secondary">Excused</Badge>;
      default:
        return null;
    }
  };

  // Get available departments for filter
  const availableDepartments = currentUser?.role === 'teacher' 
    ? departments.filter(d => teacherDepartmentIds.includes(d.id))
    : departments;

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {availableDepartments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="hide-marked"
              checked={hideMarked}
              onCheckedChange={(checked) => setHideMarked(checked as boolean)}
            />
            <Label htmlFor="hide-marked" className="cursor-pointer">
              Hide already marked students
            </Label>
          </div>

          {canManageAttendance && selectedStudentIds.size > 0 && (
            <div className="flex gap-2 animate-fade-in-up">
              <Button
                onClick={() => markAttendance('present')}
                size="sm"
                className="bg-green-500 hover:bg-green-600 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark {selectedStudentIds.size} as Present
              </Button>
              <Button
                onClick={() => markAttendance('absent')}
                size="sm"
                variant="destructive"
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Mark {selectedStudentIds.size} as Absent
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Info banner */}
      {!canManageAttendance && (
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            You have view-only access. Users with "Manage Attendance" permission can mark attendance.
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
            You need to be assigned to at least one department to view and manage student attendance.
          </p>
        </div>
      )}

      {/* Students grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-3 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 rounded-xl border border-border bg-card">
              <p className="text-muted-foreground">No students found</p>
            </div>
          ) : (
            <>
              {canManageAttendance && filteredStudents.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <Label className="text-sm text-muted-foreground cursor-pointer">
                      Select all ({filteredStudents.length})
                    </Label>
                  </div>
                  <div className="flex items-center gap-2 border border-border rounded-lg p-1 ml-auto">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 w-8 p-0"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 w-8 p-0"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredStudents.map((student, index) => {
                  const attendance = getAttendanceStatus(student.id);
                  const isSelected = selectedStudentIds.has(student.id);
                  
                  return (
                    <div
                      key={student.id}
                      className={`relative rounded-lg p-4 transition-all duration-200 cursor-pointer animate-fade-in-up ${
                        isSelected 
                          ? getStatusStyles(attendance?.status || '', true) + ' scale-105' 
                          : attendance 
                            ? getStatusStyles(attendance.status, false) + ' hover:shadow-md hover:scale-[1.02]'
                            : 'border border-border bg-card hover:border-primary/50 hover:shadow-md hover:scale-[1.02]'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => canManageAttendance && toggleStudentSelection(student.id)}
                    >
                      {canManageAttendance && (
                        <div className="absolute top-2 right-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleStudentSelection(student.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary shrink-0">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <p className="font-medium text-foreground text-sm truncate flex-1">
                            {student.name}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {student.department || 'No department'}
                        </p>
                        {attendance && (
                          <p className={`text-xs font-semibold ${
                            attendance.status === 'present' ? 'text-green-600 dark:text-green-400' :
                            attendance.status === 'absent' ? 'text-red-600 dark:text-red-400' :
                            attendance.status === 'late' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-blue-600 dark:text-blue-400'
                          }`}>
                            {getStatusText(attendance.status)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              ) : (
              <div className="space-y-2">
                {filteredStudents.map((student, index) => {
                  const attendance = getAttendanceStatus(student.id);
                  const isSelected = selectedStudentIds.has(student.id);
                  
                  return (
                    <div
                      key={student.id}
                      className={`relative p-4 transition-all duration-200 cursor-pointer animate-fade-in-up ${
                        isSelected 
                          ? getStatusStyles(attendance?.status || '', true)
                          : attendance 
                            ? getStatusStyles(attendance.status, false) + ' hover:shadow-md'
                            : 'border border-border rounded-lg bg-card hover:border-primary/50 hover:shadow-md'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => canManageAttendance && toggleStudentSelection(student.id)}
                    >
                      <div className="flex items-center gap-4">
                        {canManageAttendance && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleStudentSelection(student.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary shrink-0">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {student.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {student.department || 'No department'}
                          </p>
                        </div>
                        {attendance && (
                          <p className={`text-sm font-semibold shrink-0 ${
                            attendance.status === 'present' ? 'text-green-600 dark:text-green-400' :
                            attendance.status === 'absent' ? 'text-red-600 dark:text-red-400' :
                            attendance.status === 'late' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-blue-600 dark:text-blue-400'
                          }`}>
                            {getStatusText(attendance.status)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

