import { useState, useEffect } from "react";
import {
  Search,
  Pencil,
  LayoutGrid,
  List,
  User,
  Users,
  GraduationCap,
  MessageSquare,
  Filter,
  Plus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { toast } from "sonner";
import { StudentTable } from "@/components/students/StudentTable";
import { EditStudentDialog } from "@/components/students/EditStudentDialog";
import { StudentAttendanceCalendar } from "@/components/students/StudentAttendanceCalendar";

import { StudentProfileView } from "@/components/students/StudentProfileView";
import { CommunicationCenter } from "@/components/students/Communication/CommunicationCenter";
import { AdmissionPortal } from "@/components/students/Admission/AdmissionPortal";
import { AddStudentDialog } from "@/components/students/AddStudentDialog";

import { fetchTeacherDepartments, fetchDepartments } from "@/services/departments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Students() {
  const { hasPermission, currentUser } = useAuth();
  const { t } = useI18n();
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [teacherDepartmentIds, setTeacherDepartmentIds] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [activeTab, setActiveTab] = useState("directory");
  const [departments, setDepartments] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const canEdit = hasPermission("edit_students");
  const canViewAttendance = hasPermission("view_students") || hasPermission("manage_attendance");

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser?.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      let teacherDeptIds = [];
      if (currentUser?.role === "teacher" && currentUser.id) {
        teacherDeptIds = await fetchTeacherDepartments(currentUser.id);
        setTeacherDepartmentIds(teacherDeptIds);
      }

      await Promise.all([fetchStudents(teacherDeptIds), loadDepartments()]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(t("students.failedToLoadData"));
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const depts = await fetchDepartments();
      setDepartments(depts);
    } catch (error) {
      console.error("Failed to load departments");
    }
  };

  const fetchStudents = async (teacherDeptIds = []) => {
    try {
      if (currentUser?.role === "teacher") {
        const deptIdsToUse = teacherDeptIds.length > 0 ? teacherDeptIds : teacherDepartmentIds;

        if (deptIdsToUse.length === 0) {
          setStudents([]);
          return;
        }

        const response = await api.getUsersByDepartments(deptIdsToUse, "student", "active");
        if (response.error) throw new Error(response.error);
        const data = response.data;

        if (data && Array.isArray(data)) {
          const departmentIds = [
            ...new Set(data.filter((u) => u.department_id).map((u) => u.department_id)),
          ];
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
            department: row.department_id
              ? deptMap.get(row.department_id) || null
              : row.department || null,
            createdAt: new Date(row.created_at),
            status: row.status || "inactive",
            avatar: row.avatar,
          }));
          setStudents(mappedStudents);
        }
        return;
      }

      const response = await api.getUsers({ role: "student", status: "active" });
      if (response.error) throw new Error(response.error);
      const data = response.data;

      if (data && Array.isArray(data)) {
        const departmentIds = [
          ...new Set(data.filter((u) => u.department_id).map((u) => u.department_id)),
        ];
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
          department: row.department_id
            ? deptMap.get(row.department_id) || null
            : row.department || null,
          createdAt: new Date(row.created_at),
          status: row.status || "inactive",
          avatar: row.avatar,
        }));
        setStudents(mappedStudents);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error(t("students.failedToLoadStudents"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "teacher" && teacherDepartmentIds.length > 0) {
      fetchStudents(teacherDepartmentIds);
    }
  }, [teacherDepartmentIds]);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.department && student.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept =
      departmentFilter === "all" ||
      (student.department &&
        student.department === departments.find((d) => d.id === departmentFilter)?.name);

    return matchesSearch && matchesDept;
  });

  const handleViewAttendance = (student) => {
    if (!canViewAttendance) {
      toast.error(t("students.noPermissionViewAttendance"));
      return;
    }
    setSelectedStudent(student);
    setAttendanceDialogOpen(true);
  };

  const handleViewProfile = (student) => {
    setViewingProfile(student);
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

      await fetchStudents(teacherDepartmentIds);
      setEditDialogOpen(false);
      setSelectedStudent(null);
      toast.success(t("students.studentInfoUpdated"));
    } catch (error) {
      console.error("Error updating student:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update student";
      toast.error(errorMessage);
    }
  };

  if (viewingProfile) {
    return <StudentProfileView student={viewingProfile} onBack={() => setViewingProfile(null)} />;
  }

  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("students.studentManagement")}</h1>
          <p className="text-muted-foreground">{t("students.manageStudentDirectory")}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[800px] mb-6">
          <TabsTrigger value="directory" className="flex gap-2">
            <Users className="h-4 w-4" /> {t("students.directory")}
          </TabsTrigger>
          <TabsTrigger value="admissions" className="flex gap-2">
            <GraduationCap className="h-4 w-4" /> {t("students.admissions")}
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex gap-2">
            <MessageSquare className="h-4 w-4" /> {t("students.messageCenter")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card/50 p-1 rounded-lg">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("students.searchByNameEmail")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-background"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* View Mode */}
              <div className="hidden md:flex items-center gap-1 bg-background border rounded-md p-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("table")}
                  className="h-8 w-8"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <div className="h-6 w-px bg-border hidden sm:block mx-1" />

              {/* Department Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-[200px] justify-between bg-background"
                  >
                    <Filter className="mr-2 h-4 w-4 opacity-50" />
                    {departmentFilter === "all"
                      ? t("students.allDepartments")
                      : departments.find((dept) => dept.id === departmentFilter)?.name ||
                        t("students.selectDepartment")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder={t("students.searchDepartment")} />
                    <CommandList>
                      <CommandEmpty>{t("students.noDepartmentFound")}</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="all" onSelect={() => setDepartmentFilter("all")}>
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              departmentFilter === "all" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {t("students.allDepartments")}
                        </CommandItem>
                        {departments.map((dept) => (
                          <CommandItem
                            key={dept.id}
                            value={dept.name}
                            onSelect={() => setDepartmentFilter(dept.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                departmentFilter === dept.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {dept.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {departmentFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDepartmentFilter("all")}
                  title="Clear Filter"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              <Button onClick={() => setAddDialogOpen(true)} className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" /> {t("students.addStudent")}
              </Button>
            </div>
          </div>

          {!canEdit && (
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                You have view-only access. Users with "Edit Student Data" permission can edit
                student information.
              </p>
            </div>
          )}

          {currentUser?.role === "teacher" && teacherDepartmentIds.length === 0 && !loading && (
            <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 animate-fade-in">
              <p className="text-sm text-warning font-medium">
                ⚠️ No departments assigned. Please contact an administrator to assign departments to
                your account.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You need to be assigned to at least one department to view students.
              </p>
            </div>
          )}

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
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <StudentTable
              students={filteredStudents}
              onViewAttendance={handleViewAttendance}
              onViewProfile={handleViewProfile}
              canViewAttendance={canViewAttendance}
              viewMode={viewMode}
            />
          )}
        </TabsContent>

        <TabsContent value="admissions">
          <AdmissionPortal />
        </TabsContent>

        <TabsContent value="communication">
          <CommunicationCenter />
        </TabsContent>
      </Tabs>

      {selectedStudent && (
        <EditStudentDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          student={selectedStudent}
          onUpdate={handleUpdate}
        />
      )}

      {selectedStudent && (
        <StudentAttendanceCalendar
          open={attendanceDialogOpen}
          onOpenChange={setAttendanceDialogOpen}
          student={selectedStudent}
        />
      )}

      <AddStudentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => fetchStudents(teacherDepartmentIds)}
      />
    </div>
  );
}
