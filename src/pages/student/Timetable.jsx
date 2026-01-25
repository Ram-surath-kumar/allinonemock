import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, User, BookOpen, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RippleLoader } from "@/components/ui/RippleLoader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function Timetable() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [viewMode, setViewMode] = useState("week");
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  useEffect(() => {
    if (currentUser) {
      loadTimetable();
    }
  }, [currentUser, selectedWeek]);

  const loadTimetable = async () => {
    try {
      setLoading(true);
      // Mock timetable data - replace with actual API call
      const mockSchedules = daysOfWeek.map((day, index) => ({
        day,
        date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        slots: [
          {
            id: `${day}-1`,
            period: "1",
            startTime: "09:00",
            endTime: "10:00",
            subject: "Mathematics",
            subjectCode: "MATH101",
            teacher: "Dr. Smith",
            room: "A-101",
            type: "lecture",
          },
          {
            id: `${day}-2`,
            period: "2",
            startTime: "10:15",
            endTime: "11:15",
            subject: "Physics",
            subjectCode: "PHY101",
            teacher: "Prof. Johnson",
            room: "B-205",
            type: "lecture",
          },
          {
            id: `${day}-3`,
            period: "3",
            startTime: "11:30",
            endTime: "12:30",
            subject: "Chemistry Lab",
            subjectCode: "CHEM101L",
            teacher: "Dr. Williams",
            room: "Lab-3",
            type: "lab",
          },
          ...(index % 2 === 0
            ? [
              {
                id: `${day}-4`,
                period: "4",
                startTime: "14:00",
                endTime: "15:00",
                subject: "Tutorial",
                subjectCode: "TUT101",
                teacher: "TA",
                room: "C-102",
                type: "tutorial",
              },
            ]
            : []),
        ],
      }));

      setSchedules(mockSchedules);
    } catch (error) {
      console.error("Error loading timetable:", error);
      toast.error("Failed to load timetable");
    } finally {
      setLoading(false);
    }
  };

  const getSlotColor = (type) => {
    switch (type) {
      case "lecture":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "lab":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "tutorial":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "seminar":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTodaySchedule = () => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    return (
      schedules.find((s) => s.day === today) || {
        day: today,
        date: new Date().toISOString().split("T")[0],
        slots: [],
      }
    );
  };

  const getNextClass = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const today = getTodaySchedule();

    return today.slots.find((slot) => slot.startTime > currentTime) || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RippleLoader />
      </div>
    );
  }

  const nextClass = getNextClass();
  const todaySchedule = getTodaySchedule();

  return (
    <div className="space-y-6 p-6">
      {/* Next Class Alert */}
      {nextClass && (
        <div className="rounded-lg border bg-primary/5 p-4">
          <Card className="border-0 bg-transparent shadow-none">
            <CardContent className="flex items-center justify-between p-0">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Next Class</p>
                  <p className="text-sm text-muted-foreground">
                    {nextClass.subject} at {nextClass.startTime} in {nextClass.room}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-lg">
                {nextClass.startTime}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Mode Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Class Timetable</CardTitle>
              <CardDescription>View your weekly schedule</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("today")}
              >
                Today
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
              >
                Week
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "today" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{todaySchedule.day}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(todaySchedule.date).toLocaleDateString()}
                </span>
              </div>
              {todaySchedule.slots.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <BookOpen className="mr-2 h-5 w-5" />
                  No classes scheduled for today
                </div>
              ) : (
                todaySchedule.slots.map((slot) => (
                  <div key={slot.id} className={`rounded-lg border p-4 ${getSlotColor(slot.type)}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {slot.type}
                          </Badge>
                          <span className="font-medium">{slot.subject}</span>
                          <span className="text-sm text-muted-foreground">
                            ({slot.subjectCode})
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {slot.room}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {slot.teacher}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            Period {slot.period}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {schedules.map((schedule) => (
                <div key={schedule.day} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{schedule.day}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(schedule.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {schedule.slots.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No classes</p>
                    ) : (
                      schedule.slots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`rounded border p-2 text-xs ${getSlotColor(slot.type)}`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {slot.type}
                              </Badge>
                              <span className="font-medium">{slot.subject}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-muted-foreground">
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {slot.startTime}-{slot.endTime}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {slot.room}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <User className="h-3 w-3" />
                                {slot.teacher}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
