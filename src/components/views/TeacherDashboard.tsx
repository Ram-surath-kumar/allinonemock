import { Users, BookOpen, Calendar, Clock } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const todayClasses = [
  { id: 1, subject: 'Mathematics', class: 'Grade 10-A', time: '09:00 AM', room: 'Room 201' },
  { id: 2, subject: 'Mathematics', class: 'Grade 11-B', time: '11:00 AM', room: 'Room 105' },
  { id: 3, subject: 'Advanced Calculus', class: 'Grade 12-A', time: '02:00 PM', room: 'Room 301' },
];

const pendingTasks = [
  { id: 1, task: 'Submit Grade 10-A midterm grades', due: 'Today', priority: 'high' },
  { id: 2, task: 'Prepare quiz for Grade 11-B', due: 'Tomorrow', priority: 'medium' },
  { id: 3, task: 'Parent meeting - Alex Thompson', due: 'Mar 18', priority: 'low' },
];

export function TeacherDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="My Students"
          value="127"
          change="Across 3 classes"
          icon={Users}
        />
        <StatsCard
          title="Classes Today"
          value="3"
          change="Next class in 45 min"
          icon={BookOpen}
        />
        <StatsCard
          title="Assignments Due"
          value="5"
          change="2 need grading"
          icon={Calendar}
        />
        <StatsCard
          title="Attendance Today"
          value="96%"
          change="4 students absent"
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayClasses.map((classItem, index) => (
              <div 
                key={classItem.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div>
                  <p className="font-medium text-foreground">{classItem.subject}</p>
                  <p className="text-sm text-muted-foreground">{classItem.class} • {classItem.room}</p>
                </div>
                <Badge variant="outline">{classItem.time}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingTasks.map((task, index) => (
              <div 
                key={task.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{task.task}</p>
                  <p className="text-sm text-muted-foreground">Due: {task.due}</p>
                </div>
                <Badge 
                  variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                >
                  {task.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
