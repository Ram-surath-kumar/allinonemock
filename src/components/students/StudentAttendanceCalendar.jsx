import { useState, useEffect } from "react";
import { User } from "@/types/erp";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/services/api";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { toast } from "sonner";

export function StudentAttendanceCalendar({ open, onOpenChange, student }) {
  const { currentUser, hasPermission } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState(new Map());
  const [loading, setLoading] = useState(false);

  const canViewAttendance =
    hasPermission("view_students") ||
    currentUser?.role === "admin" ||
    currentUser?.role === "vice_head" ||
    currentUser?.role === "teacher";

  useEffect(() => {
    if (open && student && canViewAttendance) {
      loadAttendance();
    }
  }, [open, student, selectedMonth, canViewAttendance]);

  const loadAttendance = async () => {
    if (!student) return;

    try {
      setLoading(true);
      const start = startOfMonth(selectedMonth);
      const end = endOfMonth(selectedMonth);

      const startStr = format(start, "yyyy-MM-dd");
      const endStr = format(end, "yyyy-MM-dd");

      const response = await api.getAttendance({
        student_id: student.id,
        start_date: startStr,
        end_date: endStr,
      });

      if (response.error) throw new Error(response.error);
      const data = response.data;

      const recordsMap = new Map();
      data?.forEach((record) => {
        recordsMap.set(record.date, {
          date: record.date,
          status: record.status,
        });
      });
      setAttendanceRecords(recordsMap);
    } catch (error) {
      console.error("Error loading attendance:", error);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return attendanceRecords.get(dateStr) || null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "bg-green-500 hover:bg-green-600";
      case "absent":
        return "bg-red-500 hover:bg-red-600";
      case "late":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "excused":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "";
    }
  };

  const getStatusLabel = (status) => {
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

  // Calculate statistics
  const monthDays = eachDayOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth),
  });

  const stats = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: 0,
  };

  monthDays.forEach((day) => {
    const attendance = getAttendanceForDate(day);
    if (attendance) {
      stats[attendance.status]++;
      stats.total++;
    }
  });

  const attendanceRate =
    monthDays.length > 0
      ? (((stats.present + stats.excused) / monthDays.length) * 100).toFixed(1)
      : "0";

  if (!student || !canViewAttendance) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Attendance - {student.name}</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {student.loopid || student.id} • {student.department || "No Department"}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                  <p className="text-sm text-muted-foreground">Present</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                  <p className="text-sm text-muted-foreground">Late</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
                  <p className="text-sm text-muted-foreground">Excused</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{attendanceRate}%</p>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              month={selectedMonth}
              onMonthChange={setSelectedMonth}
              className="rounded-md border"
              modifiers={{
                present: monthDays.filter((day) => {
                  const att = getAttendanceForDate(day);
                  return att?.status === "present";
                }),
                absent: monthDays.filter((day) => {
                  const att = getAttendanceForDate(day);
                  return att?.status === "absent";
                }),
                late: monthDays.filter((day) => {
                  const att = getAttendanceForDate(day);
                  return att?.status === "late";
                }),
                excused: monthDays.filter((day) => {
                  const att = getAttendanceForDate(day);
                  return att?.status === "excused";
                }),
              }}
              modifiersClassNames={{
                present: "bg-green-500 text-white hover:bg-green-600",
                absent: "bg-red-500 text-white hover:bg-red-600",
                late: "bg-yellow-500 text-white hover:bg-yellow-600",
                excused: "bg-blue-500 text-white hover:bg-blue-600",
              }}
            />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-sm">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm">Excused</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
