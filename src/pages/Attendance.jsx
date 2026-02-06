import { useState, useEffect, useCallback } from "react";
import { Search, Filter, CheckCircle2, XCircle, Calendar, LayoutGrid, List } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { toast } from "sonner";
import { fetchDepartments, fetchTeacherDepartments } from "@/services/departments";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RippleLoader } from "@/components/ui/RippleLoader";

export function Attendance() {
  const { currentUser, hasPermission } = useAuth();
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teacherDepartmentIds, setTeacherDepartmentIds] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [category, setCategory] = useState("student"); // 'student' or 'staff'
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [attendanceRecords, setAttendanceRecords] = useState(new Map());
  const [hideMarked, setHideMarked] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);

  const canManageAttendance = hasPermission("manage_attendance");
  const isAdminOrViceHead = currentUser?.role === "admin" || currentUser?.role === "vice_head";

  const loadStudents = useCallback(
    async (teacherDeptIds = []) => {
      try {
        // If teacher, we must filter by their assigned departments
        if (currentUser?.role === "teacher") {
          // Use the passed teacherDeptIds (from async call) or fallback to state
          const deptIdsToUse = teacherDeptIds.length > 0 ? teacherDeptIds : teacherDepartmentIds;

          if (deptIdsToUse.length === 0) {
            // Teacher with no departments assigned - show no students
            setStudents([]);
            return;
          }

          // Filter students by teacher's departments
          const response = await api.getUsersByDepartments(deptIdsToUse, "student", "active");
          if (response.error) throw new Error(response.error);
          const data = response.data;

          if (data) {
            // Fetch department names separately
            const departmentIds = [
              ...new Set(data.filter((u) => u.department_id).map((u) => u.department_id)),
            ];
            const deptMap = new Map();

            if (departmentIds.length > 0) {
              const deptResponse = await api.getDepartments({ ids: departmentIds });
              if (!deptResponse.error && deptResponse.data) {
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
              department: row.department_id ? deptMap.get(row.department_id) || null : null,
              createdAt: new Date(row.created_at),
              status: row.status,
              avatar: row.avatar,
              // Store department_id for filtering
              department_id: row.department_id,
            }));
            setStudents(mappedStudents);
          }
          return;
        }

        // For non-teachers (admin, vice_head, etc.), show all students
        const response = await api.getUsers({ role: "student", status: "active" });
        if (response.error) throw new Error(response.error);
        const data = response.data;

        if (data) {
          // Fetch department names separately
          const departmentIds = [
            ...new Set(data.filter((u) => u.department_id).map((u) => u.department_id)),
          ];
          const deptMap = new Map();

          if (departmentIds.length > 0) {
            const deptResponse = await api.getDepartments({ ids: departmentIds });
            if (!deptResponse.error && deptResponse.data) {
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
            department: row.department_id ? deptMap.get(row.department_id) || null : null,
            createdAt: new Date(row.created_at),
            status: row.status,
            avatar: row.avatar,
            // Store department_id for filtering
            department_id: row.department_id,
          }));
          setStudents(mappedStudents);
        }
      } catch (error) {
        console.error("Error loading students:", error);
        toast.error("Failed to load students");
      }
    },
    [currentUser?.role, teacherDepartmentIds]
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Use consolidated API to get all data in one call
      const response = await api.getAttendancePageData(
        currentUser?.id,
        currentUser?.role,
        format(selectedDate, "yyyy-MM-dd"),
        category
      );

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        // Set departments
        const deptData = response.data.departments;
        setDepartments(deptData);

        // Create department map
        const deptMap = new Map();
        if (Array.isArray(deptData)) {
          deptData.forEach((dept) => {
            if (dept.id) deptMap.set(dept.id, dept.name);
          });
        }

        // Set teacher department IDs
        if (response.data.teacherDepartmentIds) {
          setTeacherDepartmentIds(response.data.teacherDepartmentIds);
        }

        // Set students with department names mapped
        const studentsData = response.data.students;
        if (Array.isArray(studentsData) && studentsData.length > 0) {
          const mappedStudents = studentsData.map((student) => ({
            ...student,
            department: student.department_id ? deptMap.get(student.department_id) || null : null,
            // Ensure department_id is preserved for filtering
            department_id: student.department_id || null,
          }));
          console.log("Attendance: Loaded students", mappedStudents.length, "students");
          setStudents(mappedStudents);
        } else {
          console.log("Attendance: No students data or empty array", studentsData);
          setStudents([]);
        }

        // Set attendance records
        if (response.data.attendanceRecords) {
          const recordsMap = new Map();
          response.data.attendanceRecords.forEach((record) => {
            recordsMap.set(record.student_id, record);
          });
          setAttendanceRecords(recordsMap);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.role, currentUser?.id, selectedDate, category]);

  const loadAttendanceForDate = useCallback(async () => {
    if (!selectedDate || students.length === 0) return;

    try {
      // Use consolidated API to reload attendance data
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await api.getAttendancePageData(currentUser?.id, currentUser?.role, dateStr);

      if (response.error) throw new Error(response.error);

      if (response.data?.attendanceRecords) {
        const recordsMap = new Map();
        response.data.attendanceRecords.forEach((record) => {
          recordsMap.set(record.student_id, record);
        });
        setAttendanceRecords(recordsMap);
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
    }
  }, [selectedDate, students, currentUser?.id, currentUser?.role]);

  useEffect(() => {
    // Only load data when component is mounted (i.e., when Attendance tab is active)
    if (currentUser) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.role]);

  // Reload data when category or selectedDate changes
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, selectedDate]);

  useEffect(() => {
    if (selectedDate && students.length > 0) {
      loadAttendanceForDate();
    }
  }, [selectedDate, students, loadAttendanceForDate]);

  // Reload students when teacher department IDs change
  useEffect(() => {
    if (
      category === "student" &&
      currentUser?.role === "teacher" &&
      teacherDepartmentIds.length > 0
    ) {
      loadStudents(teacherDepartmentIds);
    }
  }, [teacherDepartmentIds, currentUser?.role, loadStudents, category]);

  // Listen for attendance updates from AI assistant
  useEffect(() => {
    const handleAttendanceUpdate = () => {
      if (selectedDate && students.length > 0) {
        loadAttendanceForDate();
      }
    };

    window.addEventListener("attendance-updated", handleAttendanceUpdate);
    return () => {
      window.removeEventListener("attendance-updated", handleAttendanceUpdate);
    };
  }, [selectedDate, students, loadAttendanceForDate]);

  const filteredStudents = students.filter((student) => {
    // Department filter
    if (selectedDepartmentId !== "all") {
      const studentDeptId = student.department_id;
      if (!studentDeptId || studentDeptId !== selectedDepartmentId) {
        return false;
      }
    }

    // Strict teacher filter: Only show students in allotted departments
    if (currentUser?.role === "teacher" && teacherDepartmentIds.length > 0) {
      // teacherDepartmentIds might be strings or numbers, so we might want to cast or be loose, 
      // but let's assume strict match is intended if types are consistent. 
      // Safe bet is to check both if unsure, but typically these are strings in this app.
      // However, seeing api.ts, they look like strings usually. 
      if (!student.department_id || !teacherDepartmentIds.includes(student.department_id)) {
        return false;
      }
    }

    // Search filter
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) => {
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
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const markAttendance = async (status) => {
    if (selectedStudentIds.size === 0) {
      toast.error("Please select at least one student");
      return;
    }

    if (!canManageAttendance) {
      toast.error("You do not have permission to manage attendance");
      return;
    }

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const records = Array.from(selectedStudentIds).map((studentId) => ({
        student_id: studentId,
        date: dateStr,
        status,
        marked_by: currentUser?.id || null,
      }));

      // Use consolidated attendance mark endpoint
      const response = await api.markAttendance(records);
      if (response.error) throw new Error(response.error);

      // Refresh attendance records
      await loadAttendanceForDate();
      setSelectedStudentIds(new Set());
      toast.success(`Marked ${selectedStudentIds.size} ${category === "staff" ? "staff member(s)" : "student(s)"} as ${status}`);
    } catch (error) {
      console.error("Error marking attendance:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to mark attendance";
      toast.error(errorMessage);
    }
  };

  const getAttendanceStatus = (studentId) => {
    return attendanceRecords.get(studentId) || null;
  };

  const getStatusStyles = (status, isSelected) => {
    if (isSelected) {
      // When selected, use clean primary border with subtle background
      return "border-2 border-primary bg-primary/5 dark:bg-primary/10 rounded-lg shadow-sm";
    }

    // When not selected, show status with colored left border
    switch (status) {
      case "present":
        return "border-l-4 border-l-green-500 bg-green-50/30 dark:bg-green-950/10 border-r border-t border-b border-border rounded-lg";
      case "absent":
        return "border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/10 border-r border-t border-b border-border rounded-lg";
      case "late":
        return "border-l-4 border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/10 border-r border-t border-b border-border rounded-lg";
      case "excused":
        return "border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10 border-r border-t border-b border-border rounded-lg";
      default:
        return "border border-border bg-card rounded-lg";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "present":
        return "Present";
      case "absent":
        return "Absent";
      case "late":
        return "Late";
      case "excused":
        return "Excused";
      default:
        return "";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500 hover:bg-green-600">Present</Badge>;
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      case "late":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Late</Badge>;
      case "excused":
        return <Badge variant="secondary">Excused</Badge>;
      default:
        return null;
    }
  };

  // Get available departments for filter
  const availableDepartments =
    currentUser?.role === "teacher"
      ? departments.filter((d) => teacherDepartmentIds.includes(d.id))
      : departments;

  return (
    <div className="space-y-4">
      {/* Header with filters and actions */}
      <div className="flex flex-col gap-3">
        {/* First row: Search, Filters, Date */}
        <div className="flex flex-col sm:flex-row gap-3">
          {currentUser?.role !== "teacher" && (
            <Tabs value={category} onValueChange={setCategory} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="student">Students</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                currentUser?.role === "teacher"
                  ? "Search students..."
                  : `Search ${category === "staff" ? "staff" : "students"}...`
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
            <SelectTrigger className="w-full sm:w-48 h-10">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Department" />
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
              <Button
                variant="outline"
                className="w-full sm:w-[200px] h-10 justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select date"}
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

        {/* Second row: Options, Actions, View Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="hide-marked"
                checked={hideMarked}
                onCheckedChange={(checked) => setHideMarked(checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="hide-marked" className="cursor-pointer text-sm">
                Hide marked
              </Label>
            </div>

            {canManageAttendance && filteredStudents.length > 0 && (
              <div className="flex items-center gap-2.5">
                <Checkbox
                  checked={
                    selectedStudentIds.size === filteredStudents.length &&
                    filteredStudents.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                  className="h-4 w-4"
                />
                <Label className="text-sm text-muted-foreground cursor-pointer">
                  Select all ({filteredStudents.length})
                </Label>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {canManageAttendance && selectedStudentIds.size > 0 && (
              <div className="flex gap-2 animate-fade-in-up">
                <Button
                  onClick={() => markAttendance("present")}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 h-9 px-4"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark {selectedStudentIds.size} Present
                </Button>
                <Button
                  onClick={() => markAttendance("absent")}
                  size="sm"
                  variant="destructive"
                  className="h-9 px-4"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark {selectedStudentIds.size} Absent
                </Button>
              </div>
            )}

            {canManageAttendance && filteredStudents.length > 0 && (
              <div className="flex items-center gap-1 border border-border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info banner */}
      {!canManageAttendance && (
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            You have view-only access. Users with "Manage Attendance" permission can mark
            attendance.
          </p>
        </div>
      )}

      {/* Teacher with no departments warning */}
      {currentUser?.role === "teacher" && teacherDepartmentIds.length === 0 && !loading && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 animate-fade-in">
          <p className="text-sm text-warning font-medium">
            ⚠️ No departments assigned. Please contact an administrator to assign departments to
            your account.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            You need to be assigned to at least one department to view and manage student
            attendance.
          </p>
        </div>
      )}

      {/* Students grid */}
      {loading ? (
        <RippleLoader className="min-h-[400px]" />
      ) : (
        <div className="space-y-4">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 rounded-xl border border-border bg-card">
              <p className="text-muted-foreground">
                {students.length === 0
                  ? `No ${category === "staff" ? "staff members" : "students"} available`
                  : `No ${category === "staff" ? "staff members" : "students"} match your filters`}
              </p>
              {students.length > 0 && filteredStudents.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Try adjusting your search or filter settings
                </p>
              )}
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredStudents.map((student, index) => {
                    const attendance = getAttendanceStatus(student.id);
                    const isSelected = selectedStudentIds.has(student.id);

                    return (
                      <div
                        key={student.id}
                        className={`relative rounded-xl p-4 transition-all duration-200 cursor-pointer animate-fade-in-up ${isSelected
                          ? getStatusStyles(attendance?.status || "", true)
                          : attendance
                            ? getStatusStyles(attendance.status, false) +
                            " hover:shadow-md hover:scale-[1.02]"
                            : "border border-border bg-card hover:border-primary/50 hover:shadow-md hover:scale-[1.02]"
                          }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => canManageAttendance && toggleStudentSelection(student.id)}
                      >
                        {canManageAttendance && (
                          <div className="absolute top-3 right-3 z-10">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleStudentSelection(student.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-background"
                            />
                          </div>
                        )}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary shrink-0">
                              {student.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <p className="font-medium text-foreground truncate flex-1">
                              {student.name}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {student.role === "student" || student.role === "teacher"
                              ? student.department || "No department"
                              : student.role
                                ? student.role
                                  .split("_")
                                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                  .join(" ")
                                : "Staff"}
                          </p>
                          {attendance && (
                            <p
                              className={`text-sm font-semibold ${attendance.status === "present"
                                ? "text-green-600 dark:text-green-400"
                                : attendance.status === "absent"
                                  ? "text-red-600 dark:text-red-400"
                                  : attendance.status === "late"
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : "text-blue-600 dark:text-blue-400"
                                }`}
                            >
                              {getStatusText(attendance.status)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStudents.map((student, index) => {
                    const attendance = getAttendanceStatus(student.id);
                    const isSelected = selectedStudentIds.has(student.id);

                    return (
                      <div
                        key={student.id}
                        className={`relative p-4 rounded-xl transition-all duration-200 cursor-pointer animate-fade-in-up ${isSelected
                          ? getStatusStyles(attendance?.status || "", true)
                          : attendance
                            ? getStatusStyles(attendance.status, false) + " hover:shadow-md"
                            : "border border-border bg-card hover:border-primary/50 hover:shadow-md"
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
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.role === "student" || student.role === "teacher"
                                ? student.department || "No department"
                                : student.role
                                  ? student.role
                                    .split("_")
                                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                    .join(" ")
                                  : "Staff"}
                            </p>
                          </div>
                          {attendance && (
                            <p
                              className={`text-sm font-semibold shrink-0 ${attendance.status === "present"
                                ? "text-green-600 dark:text-green-400"
                                : attendance.status === "absent"
                                  ? "text-red-600 dark:text-red-400"
                                  : attendance.status === "late"
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : "text-blue-600 dark:text-blue-400"
                                }`}
                            >
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
