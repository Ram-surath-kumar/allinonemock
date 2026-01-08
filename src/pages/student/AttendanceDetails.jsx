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





export function AttendanceDetails() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [stats, setStats] = useState({
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    excusedDays,
    attendancePercentage);
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
        const mockRecords= [
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
        const percentage = total > 0 ? Math.round((present / total) * 100) ;

        setStats({
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          excusedDays,
          attendancePercentage);
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present'="h-4 w-4" />;
      case 'absent'="h-4 w-4" />;
      case 'late'="h-4 w-4" />;
      case 'excused'="h-4 w-4" />;
      default;
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
        present: record.status === 'present' ? 1 ,
        absent: record.status === 'absent' ? 1 ,
        late: record.status === 'late' ? 1 ,
        excused: record.status === 'excused' ? 1 );
    }
    return acc;
  }, []);

  if (loading) {
    return (
      
        
        
      
    );
  }

  return (
    
      {/* Stats Cards */}
      
        
          
            
              
                Attendance
                {stats.attendancePercentage}%
              
              
            
          
        

        
          
            
              
                Present
                {stats.presentDays}
              
              
            
          
        

        
          
            
              
                Absent
                {stats.absentDays}
              
              
            
          
        

        
          
            
              
                Late
                {stats.lateDays}
              
              
            
          
        
      

      {/* Attendance Chart and Records */}
      
        {/* Chart */}
        
          
            Attendance Trend
            Daily attendance overview
          
          
            
              
                
                
                
                
                
                
              
            
          
        

        {/* Status Breakdown */}
        
          
            Status Breakdown
            Attendance distribution
          
          
            
              
                
                
                
                
                
                  {[
                    { name: 'Present', value: stats.presentDays, color: 'hsl(var(--success))' },
                    { name: 'Absent', value: stats.absentDays, color: 'hsl(var(--destructive))' },
                    { name: 'Late', value: stats.lateDays, color: 'hsl(var(--warning))' },
                    { name: 'Excused', value: stats.excusedDays, color: 'hsl(217, 91%, 60%)' },
                  ].map((entry, index) => (
                    
                  ))}
                
              
            
          
        
      

      {/* Attendance Records Table */}
      
        
          Attendance Records
          Detailed attendance history
        
        
          
            {attendanceRecords.length === 0 ? (
              
                
                No attendance records found
              
            ) : (
              attendanceRecords.map((record) => (
                
                  
                    
                      {getStatusIcon(record.status)}
                    
                    
                      {record.subject}
                      
                        
                        {new Date(record.date).toLocaleDateString()}
                        •
                        
                        Period {record.period}
                      
                    
                  
                  
                    
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    
                    {record.remarks && (
                      
                        {record.remarks}
                      
                    )}
                  
                
              ))
            )}
          
        
      
    
  );
}

