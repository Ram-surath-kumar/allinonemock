import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, BookOpen, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimeSlot {
  id: string;
  period: string;
  startTime: string;
  endTime: string;
  subject: string;
  subjectCode: string;
  teacher: string;
  room: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'seminar';
}

interface DaySchedule {
  day: string;
  date: string;
  slots: TimeSlot[];
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function Timetable() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'today'>('week');
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
      const mockSchedules: DaySchedule[] = daysOfWeek.map((day, index) => ({
        day,
        date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        slots: [
          {
            id: `${day}-1`,
            period: '1',
            startTime: '09:00',
            endTime: '10:00',
            subject: 'Mathematics',
            subjectCode: 'MATH101',
            teacher: 'Dr. Smith',
            room: 'A-101',
            type: 'lecture',
          },
          {
            id: `${day}-2`,
            period: '2',
            startTime: '10:15',
            endTime: '11:15',
            subject: 'Physics',
            subjectCode: 'PHY101',
            teacher: 'Prof. Johnson',
            room: 'B-205',
            type: 'lecture',
          },
          {
            id: `${day}-3`,
            period: '3',
            startTime: '11:30',
            endTime: '12:30',
            subject: 'Chemistry Lab',
            subjectCode: 'CHEM101L',
            teacher: 'Dr. Williams',
            room: 'Lab-3',
            type: 'lab',
          },
          ...(index < 5 ? [{
            id: `${day}-4`,
            period: '4',
            startTime: '14:00',
            endTime: '15:00',
            subject: index % 2 === 0 ? 'Computer Science' : 'English',
            subjectCode: index % 2 === 0 ? 'CS101' : 'ENG101',
            teacher: index % 2 === 0 ? 'Dr. Brown' : 'Ms. Davis',
            room: index % 2 === 0 ? 'C-301' : 'D-102',
            type: 'lecture' as const,
          }] : []),
        ],
      }));

      setSchedules(mockSchedules);
    } catch (error) {
      console.error('Error loading timetable:', error);
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'lab':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'tutorial':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'seminar':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTodaySchedule = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return schedules.find(s => s.day === today) || { day: today, date: new Date().toISOString().split('T')[0], slots: [] };
  };

  const getNextClass = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const today = getTodaySchedule();
    
    return today.slots.find(slot => slot.startTime > currentTime) || null;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const nextClass = getNextClass();
  const todaySchedule = getTodaySchedule();

  return (
    <div className="space-y-3">
      {/* Next Class Alert */}
      {nextClass && (
        <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-xl border-primary/20">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Next Class</p>
                <p className="text-sm text-muted-foreground">
                  {nextClass.subject} at {nextClass.startTime} in {nextClass.room}
                </p>
              </div>
              <Badge className="bg-primary text-primary-foreground">
                {nextClass.startTime}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Mode Toggle */}
      <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
        <CardHeader className="p-3.5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Class Timetable</CardTitle>
              <CardDescription>View your weekly schedule</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('today')}
              >
                Today
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3.5 pt-0">
          {viewMode === 'today' ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">{todaySchedule.day}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(todaySchedule.date).toLocaleDateString()}
                </p>
              </div>
              {todaySchedule.slots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No classes scheduled for today</p>
                </div>
              ) : (
                todaySchedule.slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getTypeColor(slot.type)}>
                            {slot.type}
                          </Badge>
                          <p className="text-sm font-semibold">{slot.subject}</p>
                          <p className="text-xs text-muted-foreground">({slot.subjectCode})</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            <span>{slot.startTime} - {slot.endTime}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" />
                            <span>{slot.room}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3" />
                            <span>{slot.teacher}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-3 w-3" />
                            <span>Period {slot.period}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div key={schedule.day} className="border border-border/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">{schedule.day}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(schedule.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {schedule.slots.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">No classes</p>
                    ) : (
                      schedule.slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="p-2.5 rounded-lg border border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getTypeColor(slot.type)} variant="outline">
                                  {slot.type}
                                </Badge>
                                <p className="text-sm font-medium truncate">{slot.subject}</p>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {slot.startTime}-{slot.endTime}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {slot.room}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {slot.teacher}
                                </span>
                              </div>
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

