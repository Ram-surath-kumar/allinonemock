import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import { Loader2, CalendarCheck, CheckCircle2, AlertCircle } from "lucide-react";

export function CourseAttendance({ studentId }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) loadAttendance();
  }, [studentId]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const response = await api.getCourseAttendance(studentId);
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (!stats || stats.length === 0)
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Attendance Overview
          </CardTitle>
          <CardDescription>No attendance records found for current courses.</CardDescription>
        </CardHeader>
      </Card>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((course) => (
        <Card key={course.course_offering_id} className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-bold">{course.course_code}</CardTitle>
                <CardDescription
                  className="text-xs truncate max-w-[180px]"
                  title={course.course_name}
                >
                  {course.course_name}
                </CardDescription>
              </div>
              <div className="text-right">
                <span
                  className={`text-2xl font-bold ${course.percentage < 75 ? "text-destructive" : "text-green-600"}`}
                >
                  {course.percentage}%
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress
              value={course.percentage}
              className="h-2 mb-2"
              indicatorClassName={course.percentage < 75 ? "bg-destructive" : "bg-green-600"}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Total Classes: {course.total}</span>
              <span>
                Present: <span className="font-medium text-foreground">{course.present}</span>
              </span>
            </div>
            {course.percentage < 75 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-destructive p-2 bg-destructive/10 rounded">
                <AlertCircle className="h-3 w-3" />
                <span>Low Attendance Warning</span>
              </div>
            )}
            {course.percentage >= 75 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-green-600 p-2 bg-green-50 rounded">
                <CheckCircle2 className="h-3 w-3" />
                <span>Good Standing</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
