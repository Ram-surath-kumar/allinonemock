import { BookOpen, Calendar, Clock, Award } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const upcomingClasses = [
  { id: 1, subject: 'Mathematics', teacher: 'Ms. Parker', time: '09:00 AM', room: 'Room 201' },
  { id: 2, subject: 'Physics', teacher: 'Mr. Wilson', time: '10:30 AM', room: 'Lab 102' },
  { id: 3, subject: 'English', teacher: 'Ms. Davis', time: '01:00 PM', room: 'Room 305' },
];

const grades = [
  { subject: 'Mathematics', grade: 'A', score: 92 },
  { subject: 'Physics', grade: 'B+', score: 87 },
  { subject: 'English', grade: 'A-', score: 90 },
  { subject: 'Chemistry', grade: 'B', score: 83 },
];

const announcements = [
  { id: 1, title: 'Annual Sports Day', date: 'Mar 15', type: 'event' },
  { id: 2, title: 'Midterm exams schedule released', date: 'Mar 10', type: 'academic' },
  { id: 3, title: 'Science fair registration open', date: 'Mar 8', type: 'event' },
];

export function StudentDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Current GPA"
          value="3.75"
          change="Top 15% of class"
          changeType="positive"
          icon={Award}
        />
        <StatsCard
          title="Attendance"
          value="96%"
          change="Excellent"
          changeType="positive"
          icon={Calendar}
        />
        <StatsCard
          title="Classes Today"
          value="5"
          change="2 completed"
          icon={BookOpen}
        />
        <StatsCard
          title="Pending Assignments"
          value="3"
          change="Due this week"
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's Schedule */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingClasses.map((classItem, index) => (
              <div 
                key={classItem.id}
                className="rounded-lg border border-border p-3 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{classItem.subject}</p>
                  <Badge variant="outline" className="text-xs">{classItem.time}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {classItem.teacher} • {classItem.room}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* My Grades */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              My Grades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {grades.map((item, index) => (
              <div 
                key={item.subject}
                className="space-y-2 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{item.subject}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.score}%</span>
                    <Badge variant="secondary">{item.grade}</Badge>
                  </div>
                </div>
                <Progress value={item.score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.map((item, index) => (
              <div 
                key={item.id}
                className="rounded-lg border border-border p-3 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground text-sm">{item.title}</p>
                  <Badge 
                    variant={item.type === 'event' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {item.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
