import { useState, useEffect } from "react";
import { BookOpen, Calendar as CalendarIcon, Clock, Award, CheckCircle, Circle, TrendingUp, Info } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { StudentFeePayment } from "./StudentFeePayment";

// Fallback mock grades if API returns empty
const MOCK_GRADES = [
  { subject: "Mathematics", grade: "A", score: 92 },
  { subject: "Physics", grade: "B+", score: 87 },
  { subject: "English", grade: "A-", score: 90 },
  { subject: "Chemistry", grade: "B", score: 83 },
  { subject: "Computer Science", grade: "A+", score: 98 },
];

export function StudentDashboard() {
  const { currentUser } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // new state
  const [grades, setGrades] = useState([]);
  const [gpa, setGpa] = useState("0.0");
  const [attendancePercent, setAttendancePercent] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({
    present: [],
    absent: [],
    leave: []
  });

  // Helper to check status for calendar
  const hasStatus = (date, statusType) => {
    const list = attendanceData[statusType] || [];
    return list.some(d => d.toDateString() === date.toDateString());
  };

  // Mock "Mixed" attendance data (Partial day)
  // Hardcoding 15th/20th as mixed, but ONLY for past/today (not future)
  const isMixed = (date) => {
    const today = new Date();
    // Reset time for accurate comparison
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (d > today) return false;

    // Example: 15th and 20th of current month are mixed
    const day = d.getDate();
    return day === 15 || day === 20;
  };

  const getDailyDetails = (date) => {
    // Return mock hourly data for "Mixed" days
    if (isMixed(date)) {
      return [
        { hour: "09:00 AM", subject: "Mathematics", status: "Present" },
        { hour: "10:00 AM", subject: "Physics", status: "Present" },
        { hour: "11:00 AM", subject: "Chemistry", status: "Absent" }, // The red part
        { hour: "01:00 PM", subject: "English", status: "Present" },
        { hour: "02:00 PM", subject: "Computer Science", status: "Absent" }
      ];
    }
    // For regular "Present" days
    if (hasStatus(date, 'present')) {
      return [
        { hour: "09:00 AM", subject: "Mathematics", status: "Present" },
        { hour: "10:00 AM", subject: "Physics", status: "Present" },
        { hour: "11:00 AM", subject: "Chemistry", status: "Present" },
      ];
    }
    // For regular "Absent" days
    if (hasStatus(date, 'absent')) {
      return [
        { hour: "09:00 AM", subject: "Mathematics", status: "Absent" },
        { hour: "10:00 AM", subject: "Physics", status: "Absent" },
      ];
    }
    return [];
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load Schedules
        const scheduleResponse = await api.getSchedules({});
        if (scheduleResponse.data) {
          setSchedules(scheduleResponse.data);
        }

        // Load Tasks
        const tasksResponse = await api.getTasks({ assigned_to: currentUser?.id });
        if (tasksResponse.data) {
          setTasks(tasksResponse.data);
        }

        // Load Events
        const eventsResponse = await api.getEvents({
          department_id: currentUser?.department,
          role: (currentUser?.role || 'student').toLowerCase()
        });
        if (eventsResponse.data) {
          setEvents(eventsResponse.data);
        }

        // Load Academic Data (Grades & GPA)
        if (currentUser?.id) {
          // 1. Get Registrations for Grades
          const registrationsResponse = await api.getStudentRegistrations(currentUser.id);
          if (registrationsResponse.data && registrationsResponse.data.length > 0) {
            const mappedGrades = registrationsResponse.data.map(reg => ({
              subject: reg.courses?.name || reg.course_code,
              grade: 'N/A',
              score: 0
            }));
            setGrades(mappedGrades);
          } else {
            // Use Mock data if no registrations found (for demo purposes as requested)
            setGrades(MOCK_GRADES);
            setGpa("3.8"); // Set a mock GPA too if we are using mock grades
          }

          // 2. Get Academic History for GPA
          const academicResponse = await api.getAcademicHistory(currentUser.id);
          if (academicResponse.data && academicResponse.data.length > 0) {
            if (academicResponse.data.length > 0) {
              setGpa(academicResponse.data[0].sgpa || "0.0");
            }
          }

          // 3. Get Attendance
          const attendanceResponse = await api.getAttendance({ student_id: currentUser.id });
          if (attendanceResponse.data) {
            const total = attendanceResponse.data.length;
            const present = attendanceResponse.data.filter(r => r.status === 'present').length;
            const percent = total > 0 ? Math.round((present / total) * 100) : 0; // Default 0 to not show 100% on empty
            setAttendancePercent(total > 0 ? percent : 100); // Default to 100% if no data, or 0%? Request implied "working condition". Let's assume start of sem = 100%

            // Process dates for Calendar
            const presentDays = [];
            const absentDays = [];
            const leaveDays = [];

            attendanceResponse.data.forEach(record => {
              const date = new Date(record.date);
              const status = (record.status || '').toLowerCase();
              if (status === 'present' || status === 'late') presentDays.push(date);
              else if (status === 'absent') absentDays.push(date);
              else if (status === 'leave' || status === 'excused') leaveDays.push(date);
            });

            // Auto-fill "Present" for past weekdays in current month if no record exists
            // This ensures "other days" are marked green as requested
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            // Helper to check if date is already in any list
            const hasAnyStatus = (d) => {
              const s = d.toDateString();
              return [...presentDays, ...absentDays, ...leaveDays].some(existing => existing.toDateString() === s) || isMixed(d);
            };

            // Tamil Nadu Government Holidays (Jan-Feb 2026)
            const FESTIVALS = [
              "2026-01-01", // New Year
              "2026-01-14", // Pongal
              "2026-01-15", // Thiruvalluvar Day
              "2026-01-16", // Uzhavar Thirunal
              "2026-01-26", // Republic Day
            ];

            const formatDateKey = (date) => {
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${y}-${m}-${day}`;
            };

            const startOfYear = new Date(today.getFullYear(), 0, 1);
            const endOfYear = new Date(today.getFullYear(), 11, 31);

            for (let d = new Date(startOfYear); d <= endOfYear; d.setDate(d.getDate() + 1)) {
              if (hasAnyStatus(d)) continue;

              const isSunday = d.getDay() === 0;
              const dateKey = formatDateKey(d);
              const isFestival = FESTIVALS.includes(dateKey);

              if (isSunday || isFestival) {
                // Mark Sundays and TN Holidays as Leave (Yellow)
                leaveDays.push(new Date(d));
              } else if (d <= today) {
                // Mark past weekdays (including Saturdays) as Present (Green)
                presentDays.push(new Date(d));
              }
            }

            setAttendanceData({ present: presentDays, absent: absentDays, leave: leaveDays });
          } else {
            // Mock attendance dates if empty, just so "working condition" is visible? 
            // Better to show empty if empty, but user asked for "working condition".
            // Let's rely on API response being correct or empty.
            // If empty, defaulting percent to 100 (new student).
            setAttendancePercent(100);
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const handleToggleStatus = async (task) => {
    try {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      // Optimistic update
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));

      await api.updateTask(task.id, { status: newStatus });
    } catch (error) {
      console.error("Failed to update status", error);
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Current GPA Card with Dialog for Grades */}
        <Dialog>
          <DialogTrigger asChild>
            <div className="cursor-pointer transition-transform hover:scale-105">
              <StatsCard
                title="Current GPA"
                value={gpa.toString()}
                change="Click to view grades"
                changeType="neutral"
                icon={Award}
              />
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Academic Performance</DialogTitle>
              <DialogDescription>
                Your current grades and academic progress.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {grades.length === 0 ? (
                <p className="text-center text-muted-foreground">No grades available yet.</p>
              ) : (
                grades.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{item.subject}</p>
                      <div className="flex items-center gap-2">
                        {item.score > 0 && <span className="text-sm text-muted-foreground">{item.score}%</span>}
                        <Badge variant="secondary">{item.grade}</Badge>
                      </div>
                    </div>
                    {item.score > 0 && <Progress value={item.score} className="h-2" />}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Attendance Card with Calendar Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <div className="cursor-pointer transition-transform hover:scale-105">
              <StatsCard
                title="Attendance"
                value={`${attendancePercent}%`}
                change={attendancePercent >= 75 ? "Good Standing" : "Needs Improvement"}
                changeType={attendancePercent >= 75 ? "positive" : "negative"}
                icon={CalendarIcon}
              />
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-3xl w-full p-6">
            <DialogHeader>
              <DialogTitle>Attendance Record</DialogTitle>
              <DialogDescription>
                Click on a date to view hourly breakdown.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 flex justify-center border-r pr-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  modifiers={{
                    present: (date) => hasStatus(date, 'present'),
                    absent: (date) => hasStatus(date, 'absent'),
                    leave: (date) => hasStatus(date, 'leave'),
                    mixed: (date) => isMixed(date) && !hasStatus(date, 'present') && !hasStatus(date, 'absent') && !hasStatus(date, 'leave')
                  }}
                  modifiersClassNames={{
                    present: "bg-green-100 text-green-700 font-bold hover:bg-green-200",
                    absent: "bg-red-100 text-red-700 font-bold hover:bg-red-200",
                    leave: "bg-yellow-100 text-yellow-700 font-bold hover:bg-yellow-200",
                    mixed: "mixed-attendance font-bold text-foreground"
                  }}
                  modifiersStyles={{
                    mixed: {
                      background: "linear-gradient(135deg, #dcfce7 50%, #fee2e2 50%)",
                      color: "#1f2937"
                    }
                  }}
                  className="rounded-md border shadow"
                />
              </div>

              {/* Hourly Details View */}
              <div className="flex-1 min-w-[300px]">
                <h3 className="text-lg font-semibold mb-4">
                  {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Select a date"}
                </h3>

                {selectedDate ? (
                  <div className="space-y-3">
                    {getDailyDetails(selectedDate).length > 0 ? (
                      getDailyDetails(selectedDate).map((detail, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{detail.hour}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{detail.subject}</span>
                            <Badge variant={
                              detail.status === 'Present' ? 'outline' :
                                detail.status === 'Absent' ? 'destructive' : 'secondary'
                            } className={detail.status === 'Present' ? 'text-green-600 border-green-200 bg-green-50' : ''}>
                              {detail.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No detailed records for this date.</p>
                        {/* Show simple status if no hourly data */}
                        {hasStatus(selectedDate, 'present') && <Badge className="mt-2 bg-green-100 text-green-700 hover:bg-green-200">Marked Customer Present</Badge>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                    <CalendarIcon className="h-12 w-12 mb-2 opacity-20" />
                    <p>Select a date from the calendar to view hourly details and class status.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-4 text-xs border-t pt-4">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 rounded-full border border-green-200"></div> Present</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 rounded-full border border-red-200"></div> Absent</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gradient-to-br from-green-100 to-red-100 rounded-full border border-gray-200" style={{ background: "linear-gradient(135deg, #dcfce7 50%, #fee2e2 50%)" }}></div> Partial</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-100 rounded-full border border-yellow-200"></div> Leave</div>
            </div>
          </DialogContent>
        </Dialog>

        <StatsCard
          title="Classes Today"
          value={schedules.length.toString()}
          change={`${schedules.length} scheduled`}
          icon={BookOpen}
        />
        <StatsCard
          title="Pending Tasks"
          value={tasks.filter((t) => t.status === "pending").length.toString()}
          change="Due soon"
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Today's Schedule */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {schedules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No classes scheduled.
              </p>
            ) : (
              schedules.map((classItem, index) => (
                <div
                  key={classItem.id}
                  className="rounded-lg border border-border p-3 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{classItem.subject}</p>
                    <Badge variant="outline" className="text-xs">
                      {classItem.time}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {classItem.teacher_name || "Teacher"} • {classItem.room}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* My Assignments - Expanded to take more space since Grades is gone */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              My Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending assignments.
              </p>
            ) : (
              tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-border p-3 animate-slide-up flex items-start gap-3 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className="mt-0.5 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                  >
                    {task.status === "completed" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p
                        className={`font-medium text-sm ${task.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}`}
                      >
                        {task.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {task.due_date} • By: {task.assigned_by_name || "Teacher"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming events.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event, index) => (
                  <div
                    key={event.id}
                    className="rounded-lg border border-border p-3 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{event.title}</p>
                      <Badge variant="secondary" className="text-xs">
                        {event.date}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.time} @ {event.location}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
