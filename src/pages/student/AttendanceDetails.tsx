import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, XCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  subject: string;
  period: string;
  remarks?: string;
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
}

export function AttendanceDetails() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    excusedDays: 0,
    attendancePercentage: 0,
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (currentUser) {
      loadAttendanceData();
    }
  }, [currentUser, selectedMonth]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      // Fetch attendance data for the student
      if (currentUser?.id) {
        // Mock data - replace with actual API call
        const mockRecords: AttendanceRecord[] = [
          { id: '1', date: '2024-12-01', status: 'present', subject: 'Mathematics', period: '1', remarks: 'On time' },
          { id: '2', date: '2024-12-01', status: 'present', subject: 'Physics', period: '2' },
          { id: '3', date: '2024-12-01', status: 'late', subject: 'Chemistry', period: '3', remarks: '10 minutes late' },
          { id: '4', date: '2024-12-02', status: 'absent', subject: 'Mathematics', period: '1', remarks: 'Sick leave' },
          { id: '5', date: '2024-12-02', status: 'present', subject: 'Physics', period: '2' },
          { id: '6', date: '2024-12-03', status: 'present', subject: 'Mathematics', period: '1' },
          { id: '7', date: '2024-12-03', status: 'present', subject: 'Physics', period: '2' },
          { id: '8', date: '2024-12-03', status: 'excused', subject: 'Chemistry', period: '3', remarks: 'Medical appointment' },
        ];

        setAttendanceRecords(mockRecords);

        // Calculate stats
        const total = mockRecords.length;
        const present = mockRecords.filter(r => r.status === 'present').length;
        const absent = mockRecords.filter(r => r.status === 'absent').length;
        const late = mockRecords.filter(r => r.status === 'late').length;
        const excused = mockRecords.filter(r => r.status === 'excused').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        setStats({
          totalDays: total,
          presentDays: present,
          absentDays: absent,
          lateDays: late,
          excusedDays: excused,
          attendancePercentage: percentage,
        });
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-success/10 text-success border-success/20';
      case 'absent':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'late':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'excused':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'absent':
        return <XCircle className="h-4 w-4" />;
      case 'late':
        return <Clock className="h-4 w-4" />;
      case 'excused':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Prepare chart data
  const chartData = attendanceRecords.reduce((acc, record) => {
    const date = new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing[record.status] = (existing[record.status] || 0) + 1;
    } else {
      acc.push({
        date,
        present: record.status === 'present' ? 1 : 0,
        absent: record.status === 'absent' ? 1 : 0,
        late: record.status === 'late' ? 1 : 0,
        excused: record.status === 'excused' ? 1 : 0,
      });
    }
    return acc;
  }, [] as any[]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Attendance</p>
                <p className="text-2xl font-bold">{stats.attendancePercentage}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-success">{stats.presentDays}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-destructive">{stats.absentDays}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Late</p>
                <p className="text-2xl font-bold text-warning">{stats.lateDays}</p>
              </div>
              <Clock className="h-8 w-8 text-warning opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Chart and Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Chart */}
        <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
          <CardHeader className="p-3.5 pb-3">
            <CardTitle className="text-base">Attendance Trend</CardTitle>
            <CardDescription>Daily attendance overview</CardDescription>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="present" stroke="hsl(var(--success))" strokeWidth={2} />
                <Line type="monotone" dataKey="absent" stroke="hsl(var(--destructive))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
          <CardHeader className="p-3.5 pb-3">
            <CardTitle className="text-base">Status Breakdown</CardTitle>
            <CardDescription>Attendance distribution</CardDescription>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Present', value: stats.presentDays, color: 'hsl(var(--success))' },
                { name: 'Absent', value: stats.absentDays, color: 'hsl(var(--destructive))' },
                { name: 'Late', value: stats.lateDays, color: 'hsl(var(--warning))' },
                { name: 'Excused', value: stats.excusedDays, color: 'hsl(217, 91%, 60%)' },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {[
                    { name: 'Present', value: stats.presentDays, color: 'hsl(var(--success))' },
                    { name: 'Absent', value: stats.absentDays, color: 'hsl(var(--destructive))' },
                    { name: 'Late', value: stats.lateDays, color: 'hsl(var(--warning))' },
                    { name: 'Excused', value: stats.excusedDays, color: 'hsl(217, 91%, 60%)' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records Table */}
      <Card className="rounded-2xl shadow-depth-2 border-border/30 bg-card/80 backdrop-blur-xl">
        <CardHeader className="p-3.5 pb-3">
          <CardTitle className="text-base">Attendance Records</CardTitle>
          <CardDescription>Detailed attendance history</CardDescription>
        </CardHeader>
        <CardContent className="p-3.5 pt-0">
          <div className="space-y-2">
            {attendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No attendance records found</p>
              </div>
            ) : (
              attendanceRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{record.subject}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(record.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>Period {record.period}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(record.status)}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Badge>
                    {record.remarks && (
                      <p className="text-xs text-muted-foreground max-w-[150px] truncate" title={record.remarks}>
                        {record.remarks}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

