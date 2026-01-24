import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  History,
  AlertTriangle,
  Info,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  LayoutGrid,
  List,
  Mail,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Percent,
  Save,
  X,
  Activity,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CourseManagement() {
  const { currentUser } = useAuth();
  const [offerings, setOfferings] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [prerequisites, setPrerequisites] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI Local States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("all");

  // Dialog States
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);

  const [isRegDialogOpen, setIsRegDialogOpen] = useState(false);
  const [editingReg, setEditingReg] = useState(null);
  const [regForm, setRegForm] = useState({
    student_id: "",
    course_offering_id: "",
    status: "Registered",
    registration_mode: "Regular",
    attendance_percentage: 100,
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [offRes, regRes, periodRes, courseRes, preRes, stuRes, logRes] = await Promise.all([
        fetch(`${API_URL}/course-registration/offerings`),
        fetch(`${API_URL}/course-registration/student/all`),
        fetch(`${API_URL}/course-registration/periods`),
        fetch(`${API_URL}/course-registration/courses`),
        fetch(`${API_URL}/course-registration/prerequisites`),
        fetch(`${API_URL}/course-registration/students`),
        fetch(`${API_URL}/course-registration/logs`),
      ]);

      const offData = await offRes.json();
      const regData = await regRes.json();
      const periodData = await periodRes.json();
      const courseData = await courseRes.json();
      const preData = await preRes.json();
      const stuData = await stuRes.json();
      const logData = await logRes.json();

      if (offData.status === "success") setOfferings(offData.data);
      if (regData.status === "success") setRegistrations(regData.data);
      if (periodData.status === "success") {
        setPeriods(periodData.data);
        const current = periodData.data.find((p) => p.is_current);
        if (current && selectedSemester === "all") setSelectedSemester(current.id);
      }
      if (courseData.status === "success") setCourses(courseData.data);
      if (preData.status === "success") setPrerequisites(preData.data);
      if (stuData.status === "success") setStudents(stuData.data);
      if (logData.status === "success") setLogs(logData.data);
    } catch (error) {
      toast.error("Failed to sync institutional data");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---

  const handleOpenRegDialog = (reg = null) => {
    if (reg) {
      setEditingReg(reg);
      setRegForm({
        student_id: reg.student_id,
        course_offering_id: reg.course_offering_id,
        status: reg.status,
        registration_mode: reg.registration_mode,
        attendance_percentage: reg.attendance_percentage || 100,
      });
    } else {
      setEditingReg(null);
      setRegForm({
        student_id: "",
        course_offering_id: "",
        status: "Registered",
        registration_mode: "Regular",
        attendance_percentage: 100,
      });
    }
    setIsRegDialogOpen(true);
  };

  const handleSaveRegistration = async () => {
    try {
      const method = editingReg ? "PATCH" : "POST";
      const endpoint = editingReg
        ? `${API_URL}/course-registration/registration/${editingReg.id}`
        : `${API_URL}/course-registration/register`;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...regForm, performed_by: currentUser?.id }),
      });

      const data = await res.json();
      if (data.status === "success") {
        toast.success(editingReg ? "Registration Updated" : "Registration Successful");
        setIsRegDialogOpen(false);
        fetchAdminData();
      } else {
        toast.error(data.error || "Operation failed");
      }
    } catch (error) {
      toast.error("Network error during sync");
    }
  };

  const handleForceDrop = async (reg) => {
    if (!confirm("Are you sure you want to FORCE DROP this course? This action will be logged."))
      return;
    try {
      const res = await fetch(`${API_URL}/course-registration/registration/${reg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Dropped", performed_by: currentUser?.id }),
      });
      if (res.ok) {
        toast.success("Course Force Dropped");
        fetchAdminData();
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleApproveWaiver = async (reg) => {
    const reason = prompt("Enter institutional waiver reason:");
    if (!reason) return;
    try {
      await fetch(`${API_URL}/course-registration/registration/${reg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exemption_reason: reason,
          approved_by_id: currentUser?.id,
          performed_by: currentUser?.id,
        }),
      });
      toast.success("Waiver Approved");
      fetchAdminData();
    } catch (error) {
      toast.error("Waiver failed");
    }
  };

  const handleUpdateTimeline = async () => {
    try {
      const res = await fetch(`${API_URL}/course-registration/periods/${editingPeriod.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPeriod),
      });
      if (res.ok) {
        toast.success("Timeline Constraints Updated");
        setIsPeriodDialogOpen(false);
        fetchAdminData();
      }
    } catch (error) {
      toast.error("Update failed");
    }
  };

  // Derived Data
  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.offering?.course?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester =
      selectedSemester === "all" || reg.offering?.semester_id === selectedSemester;
    return matchesSearch && matchesSemester;
  });

  const auditEnrollments = filteredRegistrations.filter((r) => r.registration_mode === "Audit");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Course Registration</h1>
          <p className="text-muted-foreground text-sm">
            Institutional Enrollment & Academic Governance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Global Ledger</SelectItem>
              {periods.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.academic_year} — {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="regular" className="w-full">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
          <TabsList className="bg-muted/50 p-1 h-auto flex flex-wrap justify-start gap-1 w-full xl:w-auto">
            <TabsTrigger value="regular" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Registered
            </TabsTrigger>
            <TabsTrigger value="prerequisites" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Prerequisites
            </TabsTrigger>
            <TabsTrigger value="periods" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Periods
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="h-4 w-4" /> Audit
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> Timeline
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => handleOpenRegDialog()} className="gap-2">
              <Plus className="h-4 w-4" /> New Entry
            </Button>
          </div>
        </div>

        <TabsContent value="regular">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Detail</TableHead>
                  <TableHead className="text-center">Type/Credits</TableHead>
                  <TableHead>Faculty Lead</TableHead>
                  <TableHead>Slot & Room</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations
                  .filter((r) => r.registration_mode !== "Audit")
                  .map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{reg.offering?.course?.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px]">
                              {reg.offering?.course?.course_code}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              ID: {reg.student_id?.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                            {reg.offering?.course?.course_type || "Theory"}
                          </span>
                          <span className="text-sm font-medium">
                            {reg.offering?.course?.credits} Units
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {reg.offering?.faculty_name || "Unassigned"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Ref: {reg.offering?.faculty_id?.slice(0, 6) || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-primary" /> {reg.offering?.slot_code}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <MapPin className="h-3.5 w-3.5" /> RM:{" "}
                            {reg.offering?.room_number || "TBD"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge
                            variant={reg.status === "Dropped" ? "destructive" : "default"}
                            className="rounded-full"
                          >
                            {reg.status}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(reg.registration_date).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenRegDialog(reg)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleForceDrop(reg)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="prerequisites">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target Course</TableHead>
                  <TableHead>Required Prerequisites</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Waiver Reason</TableHead>
                  <TableHead className="text-right">Approver Ref</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((reg) => {
                  const matchedPres = prerequisites.filter((p) => p.course_id === reg.course_id);
                  return (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium uppercase">
                            {reg.offering?.course?.name}
                          </span>
                          <span className="text-[10px] text-primary">
                            STUDENT: {reg.student_id?.slice(0, 8)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {matchedPres.length > 0 ? (
                            matchedPres.map((p) => (
                              <Badge key={p.id} variant="outline" className="text-[10px]">
                                {p.prerequisite?.course_code}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              Exempt
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 text-sm font-semibold",
                            reg.prerequisite_met ? "text-green-600" : "text-destructive"
                          )}
                        >
                          {reg.prerequisite_met ? (
                            <ShieldCheck className="h-4 w-4" />
                          ) : (
                            <ShieldAlert className="h-4 w-4" />
                          )}
                          {reg.prerequisite_met ? "Met" : "Pending"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground italic truncate max-w-[200px]">
                            {reg.exemption_reason || "None"}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600"
                            onClick={() => handleApproveWaiver(reg)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-muted-foreground uppercase">
                            Approved By
                          </span>
                          <span className="text-sm font-medium italic">
                            {reg.approver?.name || "System"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="periods">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {periods.map((period) => {
              const now = new Date();
              const start = new Date(period.add_drop_start_date);
              const end = new Date(period.add_drop_end_date);
              const isActive = now >= start && now <= end;
              const semRegs = registrations.filter((r) => r.offering?.semester_id === period.id);

              return (
                <Card
                  key={period.id}
                  className={cn(
                    "p-6 space-y-6 transition-all",
                    isActive && "border-green-500/50 bg-green-500/5 shadow-sm"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{period.name}</h3>
                      <span className="text-xs text-muted-foreground uppercase font-semibold">
                        {period.academic_year}
                      </span>
                    </div>
                    <Badge
                      variant={isActive ? "default" : "outline"}
                      className={cn(isActive && "bg-green-600 hover:bg-green-700")}
                    >
                      {isActive ? "Active" : "Locked"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 p-3 rounded-xl border border-border">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                        Added
                      </span>
                      <span className="text-xl font-bold">
                        {semRegs.filter((r) => r.status === "Registered").length}
                      </span>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-xl border border-border">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                        Dropped
                      </span>
                      <span className="text-xl font-bold">
                        {semRegs.filter((r) => r.status === "Dropped").length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-4 text-sm">
                    <div className="flex justify-between font-medium">
                      <span className="text-muted-foreground">Start</span>
                      <span>{start.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-muted-foreground">End</span>
                      <span>{end.toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEditingPeriod(period);
                      setIsPeriodDialogOpen(true);
                    }}
                  >
                    Configure Period
                  </Button>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Audit Course</TableHead>
                  <TableHead>Faculty Lead</TableHead>
                  <TableHead className="text-center">Attendance %</TableHead>
                  <TableHead className="text-center">Grade Status</TableHead>
                  <TableHead className="text-right">Student Identity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditEnrollments.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium uppercase">
                      {audit.offering?.course?.name}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-muted-foreground">
                      {audit.offering?.faculty_name}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold">{audit.attendance_percentage}%</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            const val = prompt("Update attendance metrics (0-100):");
                            if (val)
                              handleSaveRegistration(audit.id, {
                                attendance_percentage: parseFloat(val),
                              });
                          }}
                        >
                          <Percent className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase">
                        Audit Only
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold">
                          ST-REF: {audit.student_id?.slice(0, 8)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Institutional Archive
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="p-8 min-h-[500px]">
            <div className="relative space-y-6 lg:pl-8">
              <div className="absolute left-0 lg:left-8 top-2 bottom-2 w-px bg-border" />
              {logs.map((log) => (
                <div key={log.id} className="relative flex items-start">
                  <div
                    className={cn(
                      "absolute -left-[5px] lg:left-[27px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-background z-10",
                      log.action === "Registered"
                        ? "bg-green-500"
                        : log.action === "Dropped"
                          ? "bg-destructive"
                          : "bg-primary"
                    )}
                  />
                  <div className="flex-1 pl-6 lg:pl-10">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">
                        {log.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-xl border border-border max-w-2xl">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        <span className="text-foreground font-semibold">{log.student?.name}</span>{" "}
                        {log.action.toLowerCase()}{" "}
                        <span className="text-primary font-semibold">
                          {log.details?.course_name}
                        </span>
                        . By{" "}
                        <span className="text-foreground italic">
                          {log.performer?.name || "System"}
                        </span>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- REGISTRATION DIALOG --- */}
      <Dialog open={isRegDialogOpen} onOpenChange={setIsRegDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingReg ? "Edit Registration" : "New Registration"}</DialogTitle>
            <DialogDescription>Add or modify academic enrollment records.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label>Target Student</Label>
              <Select
                value={regForm.student_id}
                onValueChange={(val) => setRegForm({ ...regForm, student_id: val })}
                disabled={!!editingReg}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Identify Student..." />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.loopid || s.id.slice(0, 6)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Academic Offering</Label>
              <Select
                value={regForm.course_offering_id}
                onValueChange={(val) => setRegForm({ ...regForm, course_offering_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign Offering Unit..." />
                </SelectTrigger>
                <SelectContent>
                  {offerings.map((off) => (
                    <SelectItem key={off.id} value={off.id}>
                      {off.course?.name} — {off.faculty_name} ({off.slot_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Protocol</Label>
                <Select
                  value={regForm.registration_mode}
                  onValueChange={(val) => setRegForm({ ...regForm, registration_mode: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Audit">Audit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Select
                  value={regForm.status}
                  onValueChange={(val) => setRegForm({ ...regForm, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Registered">Registered</SelectItem>
                    <SelectItem value="Dropped">Dropped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsRegDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveRegistration} className="gap-2">
              <Save className="h-4 w-4" /> Finalize Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TIMELINE CONFIG DIALOG */}
      <Dialog open={isPeriodDialogOpen} onOpenChange={setIsPeriodDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Period Configuration</DialogTitle>
            <DialogDescription>Set start and end dates for add/drop cycle.</DialogDescription>
          </DialogHeader>
          {editingPeriod && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  defaultValue={editingPeriod.add_drop_start_date?.split("T")[0]}
                  onChange={(e) =>
                    setEditingPeriod({ ...editingPeriod, add_drop_start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  defaultValue={editingPeriod.add_drop_end_date?.split("T")[0]}
                  onChange={(e) =>
                    setEditingPeriod({ ...editingPeriod, add_drop_end_date: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPeriodDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTimeline}>Update Lifecycle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
