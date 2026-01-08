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





const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function Timetable() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [viewMode, setViewMode] = useState('week');
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
      const mockSchedules= daysOfWeek.map((day, index) => ({
        day,
        date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        slots{
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
          ...(index  {
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
    return schedules.find(s => s.day === today) || { day, date: new Date().toISOString().split('T')[0], slots;
  };

  const getNextClass = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const today = getTodaySchedule();
    
    return today.slots.find(slot => slot.startTime > currentTime) || null;
  };

  if (loading) {
    return (
      
        
        
      
    );
  }

  const nextClass = getNextClass();
  const todaySchedule = getTodaySchedule();

  return (
    
      {/* Next Class Alert */}
      {nextClass && (
        
          
            
              
                
              
              
                Next Class
                
                  {nextClass.subject} at {nextClass.startTime} in {nextClass.room}
                
              
              
                {nextClass.startTime}
              
            
          
        
      )}

      {/* View Mode Toggle */}
      
        
          
            
              Class Timetable
              View your weekly schedule
            
            
               setViewMode('today')}
              >
                Today
              
               setViewMode('week')}
              >
                Week
              
            
          
        
        
          {viewMode === 'today' ? (
            
              
                
                {todaySchedule.day}
                
                  {new Date(todaySchedule.date).toLocaleDateString()}
                
              
              {todaySchedule.slots.length === 0 ? (
                
                  
                  No classes scheduled for today
                
              ) : (
                todaySchedule.slots.map((slot) => (
                  
                    
                      
                        
                          
                            {slot.type}
                          
                          {slot.subject}
                          ({slot.subjectCode})
                        
                        
                          
                            
                            {slot.startTime} - {slot.endTime}
                          
                          
                            
                            {slot.room}
                          
                          
                            
                            {slot.teacher}
                          
                          
                            
                            Period {slot.period}
                          
                        
                      
                    
                  
                ))
              )}
            
          ) : (
            
              {schedules.map((schedule) => (
                
                  
                    
                    {schedule.day}
                    
                      {new Date(schedule.date).toLocaleDateString()}
                    
                  
                  
                    {schedule.slots.length === 0 ? (
                      No classes
                    ) : (
                      schedule.slots.map((slot) => (
                        
                          
                            
                              
                                
                                  {slot.type}
                                
                                {slot.subject}
                              
                              
                                
                                  
                                  {slot.startTime}-{slot.endTime}
                                
                                
                                  
                                  {slot.room}
                                
                                
                                  
                                  {slot.teacher}
                                
                              
                            
                          
                        
                      ))
                    )}
                  
                
              ))}
            
          )}
        
      
    
  );
}

