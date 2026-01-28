import { useState, useEffect } from "react";
import { Users, GraduationCap, IndianRupee, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AnalyticsSection } from "@/components/dashboard/AnalyticsSection";
import { useI18n } from "@/lib/i18n";
import { GrowthChartModal } from "@/components/dashboard/GrowthChartModal";
import { StaffBreakdownModal } from "@/components/dashboard/StaffBreakdownModal";
import {
  getDashboardStats,
  getGrowthData,
  getConsolidatedGrowthData,
} from "@/services/dashboard";
import type { DashboardStats } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/services/api";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, ListFilter, Circle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface AdminDashboardProps {
  onAddUser: () => void;
}

export function AdminDashboard({ onAddUser, onNavigate }: AdminDashboardProps & { onNavigate?: (path: string) => void }) {
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const { dashboardData, loading: dashboardLoading, refreshDashboard } = useDashboard();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [changeTexts, setChangeTexts] = useState<{
    students?: string;
    staff?: string;
    attendance?: string;
    fees?: string;
  }>({});
  const [sparklineData, setSparklineData] = useState<{
    students?: number[];
    staff?: number[];
    attendance?: number[];
  }>({});
  const [growthModalOpen, setGrowthModalOpen] = useState(false);
  const [growthMetric, setGrowthMetric] = useState<"students" | "staff" | "attendance" | "fees">(
    "students"
  );
  const [staffModalOpen, setStaffModalOpen] = useState(false);

  // Task state
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    assigned_to_name: "",
    due_date: "",
    status: "pending",
  });
  const [users, setUsers] = useState([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [createdTasks, setCreatedTasks] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (isTaskDialogOpen) {
      loadCreatedTasks();
    }
  }, [isTaskDialogOpen, currentUser]);

  const loadUsers = async () => {
    try {
      const response = await api.getUsers();
      if (response.data) setUsers(response.data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const loadCreatedTasks = async () => {
    try {
      const response = await api.getTasks({ assigned_by: currentUser?.id });
      if (response.data) {
        setCreatedTasks(response.data);
      }
    } catch (err) {
      console.error("Failed to load created tasks", err);
    }
  };

  const handleOpenTaskDialog = () => {
    setTaskFormData({
      title: "",
      description: "",
      assigned_to: "",
      assigned_to_name: "",
      due_date: new Date().toISOString().split("T")[0],
      status: "pending",
    });
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = async () => {
    try {
      if (!taskFormData.title || !taskFormData.assigned_to_name) {
        toast.error("Please fill required fields");
        return;
      }

      await api.createTask({
        ...taskFormData,
        assigned_by: currentUser?.id,
        assigned_by_name: currentUser?.name || "Admin",
      });

      toast.success("Task assigned successfully");
      setIsTaskDialogOpen(false);
    } catch (error) {
      console.error("Error creating task", error);
      toast.error("Failed to assign task");
    }
  };

  // Extract stats from consolidated dashboard data
  useEffect(() => {
    if (dashboardData) {
      try {
        // Extract stats from consolidated response
        const dashboardStats = dashboardData.stats as unknown as Record<string, unknown>;
        const students = (dashboardData.students as unknown[]) || [];

        const totalStudents =
          typeof dashboardStats.totalStudents === "number"
          ? dashboardStats.totalStudents
            : Array.isArray(students)
              ? students.length
              : 0;

        const totalStaff =
          typeof dashboardStats.totalStaff === "number" ? dashboardStats.totalStaff : 0;

        const attendanceRate =
          typeof dashboardStats.attendanceRate === "number" ? dashboardStats.attendanceRate : 0;

        const feeCollectionPercentage =
          typeof dashboardStats.feeCollectionPercentage === "number"
          ? dashboardStats.feeCollectionPercentage
          : 0;

        const feeCollection =
          typeof dashboardStats.feeCollection === "number" ? dashboardStats.feeCollection : 0;

        console.log("AdminDashboard - Extracted Stats:", {
          totalStudents,
          totalStaff,
          attendanceRate,
          feeCollection,
          feeCollectionPercentage,
        });

        // Governance Data
        const placements = dashboardStats.placements || null;
        const compliance = dashboardStats.compliance || null;
        const pendingApprovals = dashboardStats.pendingApprovals || 0;
        const systemVersion = dashboardStats.systemVersion || "v1.0.0";

        setStats({
          totalStudents,
          totalStaff,
          attendanceRate,
          feeCollection,
          feeCollectionPercentage,
        });
        setLoading(false);
      } catch (error) {
        console.error("Error processing dashboard data:", error);
        setLoading(false);
      }
    } else if (!dashboardLoading) {
      setLoading(false);
    }
  }, [dashboardData, dashboardLoading]);

  useEffect(() => {
    if (stats) {
      fetchChangeTexts();
      fetchSparklineData();
    }
  }, [stats]);

  const fetchChangeTexts = async () => {
    try {
      const [studentsGrowth, staffGrowth, attendanceGrowth] = await Promise.all([
        getGrowthData("students", "month").catch(() => null),
        getGrowthData("staff", "month").catch(() => null),
        getGrowthData("attendance", "month").catch(() => null),
      ]);

      setChangeTexts({
        students: studentsGrowth
          ? t("dashboard.fromLastMonth", { percent: studentsGrowth.changePercent.toFixed(1) })
          : undefined,
        staff: staffGrowth
          ? t("dashboard.fromLastMonth", { percent: staffGrowth.changePercent.toFixed(1) })
          : undefined,
        attendance: attendanceGrowth
          ? t("dashboard.fromLastMonth", { percent: attendanceGrowth.changePercent.toFixed(1) })
          : undefined,
        fees: stats?.feeCollectionPercentage
          ? t("dashboard.percentCollected", { percent: stats.feeCollectionPercentage.toFixed(0) })
          : undefined,
      });
    } catch (error) {
      console.error("Error fetching change texts:", error);
    }
  };

  const fetchSparklineData = async () => {
    try {
      const [studentsData, staffData, attendanceData] = await Promise.all([
        getGrowthData("students", "week").catch(() => null),
        getGrowthData("staff", "week").catch(() => null),
        getGrowthData("attendance", "week").catch(() => null),
      ]);

      setSparklineData({
        students: studentsData?.data.map((d) => d.value) || [],
        staff: staffData?.data.map((d) => d.value) || [],
        attendance: attendanceData?.data.map((d) => d.value) || [],
      });
    } catch (error) {
      console.error("Error fetching sparkline data:", error);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercent = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const handleCardClick = (metric: "students" | "staff" | "attendance" | "fees") => {
    if (metric === "staff") {
      setStaffModalOpen(true);
    } else {
      setGrowthMetric(metric);
      setGrowthModalOpen(true);
    }
  };

  return (
    <div className="space-y-3 animate-fade-in" role="main" aria-label="Admin Dashboard">
      {/* Hero Analytics Strip - Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t("dashboard.totalStudents")}
          value={loading ? "..." : formatNumber(stats?.totalStudents || 0)}
          change={changeTexts.students}
          changeType={
            changeTexts.students?.includes("+")
              ? "positive"
              : changeTexts.students?.includes("-")
                ? "negative"
                : "neutral"
          }
          icon={GraduationCap}
          iconColor={undefined}
          gradient="from-blue-500/20 via-purple-500/20 to-pink-500/20"
          sparklineData={sparklineData.students}
          onClick={() => handleCardClick("students")}
        />
        <StatsCard
          title={t("dashboard.staffMembers")}
          value={loading ? "..." : formatNumber(stats?.totalStaff || 0)}
          change={changeTexts.staff}
          changeType={
            changeTexts.staff?.includes("+")
              ? "positive"
              : changeTexts.staff?.includes("-")
                ? "negative"
                : "neutral"
          }
          icon={Users}
          iconColor={undefined}
          gradient="from-green-500/20 via-emerald-500/20 to-teal-500/20"
          sparklineData={sparklineData.staff}
          onClick={() => handleCardClick("staff")}
        />
        <StatsCard
          title={t("dashboard.feeCollection")}
          value={loading ? "..." : formatCurrency(stats?.feeCollection || 0)}
          change={changeTexts.fees}
          changeType="neutral"
          icon={IndianRupee}
          iconColor={undefined}
          gradient="from-yellow-500/20 via-orange-500/20 to-red-500/20"
          sparklineData={[]}
          showChart={false}
          onClick={() => handleCardClick("fees")}
        />
        <StatsCard
          title={t("dashboard.attendanceRate")}
          value={loading ? "..." : formatPercent(stats?.attendanceRate || 0)}
          change={changeTexts.attendance}
          changeType={
            changeTexts.attendance?.includes("+")
              ? "positive"
              : changeTexts.attendance?.includes("-")
                ? "negative"
                : "neutral"
          }
          icon={TrendingUp}
          iconColor={undefined}
          gradient="from-purple-500/20 via-pink-500/20 to-rose-500/20"
          sparklineData={sparklineData.attendance}
          onClick={() => handleCardClick("attendance")}
        />
      </div>

      {/* Quick Actions & AI Actions - Compact */}
      <QuickActions onAddUser={onAddUser} onAssignTask={handleOpenTaskDialog} onNavigate={onNavigate} />

      {/* Analytics Section */}
      <AnalyticsSection data={dashboardData?.charts} />

      {/* Recent Activity - Timeline */}
      <RecentActivity />

      {/* Growth Chart Modals */}
      <GrowthChartModal
        open={growthModalOpen}
        onOpenChange={setGrowthModalOpen}
        title={
          growthMetric === "students"
            ? t("dashboard.totalStudents")
            : growthMetric === "attendance"
              ? t("dashboard.attendanceRate")
              : growthMetric === "fees"
                ? t("dashboard.feeCollection")
                : t("dashboard.studentGrowth")
        }
        metric={growthMetric}
        currentValue={
          stats
            ? growthMetric === "students"
              ? stats.totalStudents
              : growthMetric === "attendance"
                ? stats.attendanceRate
                : growthMetric === "fees"
                  ? stats.feeCollection
                  : 0
            : 0
        }
        formatValue={
          growthMetric === "fees"
            ? formatCurrency
            : growthMetric === "attendance"
              ? formatPercent
              : formatNumber
        }
      />

      {/* Staff Breakdown Modal */}
      <StaffBreakdownModal open={staffModalOpen} onOpenChange={setStaffModalOpen} />

      {/* Task Assignment Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        {/* @ts-expect-error - DialogContent accepts children but TypeScript doesn't recognize it from JSX component */}
        <DialogContent className="max-w-md sm:max-w-2xl">
          <Tabs defaultValue="new" className="w-full">
            {/* @ts-expect-error - TabsList accepts children but TypeScript doesn't recognize it from JSX component */}
            <TabsList className="grid w-full grid-cols-2 mb-6">
              {/* @ts-expect-error - TabsTrigger accepts children but TypeScript doesn't recognize it from JSX component */}
              <TabsTrigger value="new">Assign New</TabsTrigger>
              {/* @ts-expect-error - TabsTrigger accepts children but TypeScript doesn't recognize it from JSX component */}
              <TabsTrigger value="history">Tasks Created</TabsTrigger>
            </TabsList>

            {/* @ts-expect-error - TabsContent accepts children but TypeScript doesn't recognize it from JSX component */}
            <TabsContent value="new" className="space-y-6">
              <DialogHeader className="px-0">
                {/* @ts-expect-error - DialogTitle accepts children but TypeScript doesn't recognize it from JSX component */}
                <DialogTitle>Assign Task to Member</DialogTitle>
                {/* @ts-expect-error - DialogDescription accepts children but TypeScript doesn't recognize it from JSX component */}
                <DialogDescription>
                  Create a new task for a student or staff member.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-2">
                  {/* @ts-expect-error - Label accepts children but TypeScript doesn't recognize it from JSX component */}
                  <Label htmlFor="task_title">Task Title</Label>
                  <Input
                    id="task_title"
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                    placeholder="e.g. Complete Report"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {/* @ts-expect-error - Label accepts children but TypeScript doesn't recognize it from JSX component */}
                  <Label>Assign To</Label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      {/* @ts-expect-error - Button accepts children but TypeScript doesn't recognize it from JSX component */}
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between"
                      >
                        {taskFormData.assigned_to_name
                          ? taskFormData.assigned_to_name
                          : "Select member..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    {/* @ts-expect-error - PopoverContent accepts children but TypeScript doesn't recognize it from JSX component */}
                    <PopoverContent className="w-[400px] p-0">
                      {/* @ts-expect-error - Command accepts children but TypeScript doesn't recognize it from JSX component */}
                      <Command>
                        {/* @ts-expect-error - CommandInput accepts placeholder prop but TypeScript doesn't recognize it from JSX component */}
                        <CommandInput placeholder="Search member..." />
                        {/* @ts-expect-error - CommandList accepts children but TypeScript doesn't recognize it from JSX component */}
                        <CommandList>
                          {/* @ts-expect-error - CommandEmpty accepts children but TypeScript doesn't recognize it from JSX component */}
                          <CommandEmpty>No member found.</CommandEmpty>
                          {/* @ts-expect-error - CommandGroup accepts children but TypeScript doesn't recognize it from JSX component */}
                          <CommandGroup>
                            {users.map((user) => (
                              /* @ts-expect-error - CommandItem accepts children but TypeScript doesn't recognize it from JSX component */
                              <CommandItem
                                key={user.id}
                                value={user.name}
                                onSelect={() => {
                                  setTaskFormData({
                                    ...taskFormData,
                                    assigned_to: user.id,
                                    assigned_to_name: user.name,
                                  });
                                  setOpenCombobox(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    taskFormData.assigned_to === user.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {user.name}{" "}
                                <span className="text-muted-foreground ml-2 text-xs">
                                  ({user.role})
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  {/* @ts-expect-error - Label accepts children but TypeScript doesn't recognize it from JSX component */}
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={taskFormData.due_date}
                    onChange={(e) => setTaskFormData({ ...taskFormData, due_date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  {/* @ts-expect-error - Label accepts children but TypeScript doesn't recognize it from JSX component */}
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    // @ts-expect-error - Textarea accepts props but TypeScript doesn't recognize them from JSX component
                    id="description"
                    value={taskFormData.description}
                    onChange={(e) =>
                      setTaskFormData({ ...taskFormData, description: e.target.value })
                    }
                    placeholder="Task details..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter className="px-0">
                {/* @ts-expect-error - Button accepts children but TypeScript doesn't recognize it from JSX component */}
                <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                  Cancel
                </Button>
                {/* @ts-expect-error - Button accepts children but TypeScript doesn't recognize it from JSX component */}
                <Button onClick={handleSaveTask}>Assign Task</Button>
              </DialogFooter>
            </TabsContent>

            {/* @ts-expect-error - TabsContent accepts children but TypeScript doesn't recognize it from JSX component */}
            <TabsContent value="history" className="max-h-[60vh] overflow-y-auto space-y-3">
              <div className="space-y-1 mb-4">
                <h4 className="font-medium leading-none">Tasks Created by You</h4>
                <p className="text-sm text-muted-foreground">
                  Monitor status of tasks you've assigned.
                </p>
              </div>
              {createdTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No tasks created yet.</div>
              ) : (
                createdTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-card text-card-foreground shadow-sm"
                  >
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        To: {task.assigned_to_name} • Due: {task.due_date}
                      </p>
                    </div>
                    <Badge variant={task.status === "completed" ? "default" : "secondary"} className="">
                      {task.status}
                    </Badge>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
