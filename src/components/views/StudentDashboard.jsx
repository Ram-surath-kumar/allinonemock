import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Award, CheckCircle, Circle } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

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
  const { currentUser } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const eventsResponse = await api.getEvents({ department_id: currentUser?.department });
        if (eventsResponse.data) {
          setEvents(eventsResponse.data);
        }

      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const handleToggleStatus = async (task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      // Optimistic update
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

      await api.updateTask(task.id, { status: newStatus });
    } catch (error) {
      console.error("Failed to update status", error);
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

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
          value={schedules.length.toString()}
          change={`${schedules.length} scheduled`}
          icon={BookOpen}
        />
        <StatsCard
          title="Pending Assignments"
          value={tasks.filter(t => t.status === 'pending').length.toString()}
          change="Due soon"
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Today's Schedule */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {schedules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No classes scheduled.</p>
            ) : (
              schedules.map((classItem, index) => (
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
                    {classItem.teacher_name || 'Teacher'} • {classItem.room}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* My Grades */}
        <Card className="col-span-1">
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

        {/* My Assignments */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              My Assignments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No pending assignments.</p>
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
                    {task.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium text-sm ${task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {task.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Due: {task.due_date} • By: {task.assigned_by_name || 'Teacher'}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming events.</p>
            ) : (
              events.map((event, index) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-border p-3 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{event.title}</p>
                    <Badge variant="secondary" className="text-xs">{event.date}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.time} @ {event.location}
                  </p>
                  {/* <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p> */}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
