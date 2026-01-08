import { useState, useEffect } from 'react';
import { BookOpen, AlertTriangle, XCircle, FileX, Calendar, TrendingDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';







export function GradesMarks() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [grades, setGrades] = useState([]);
  const [failedCourses, setFailedCourses] = useState([]);
  const [absentDetails, setAbsentDetails] = useState([]);
  const [malpracticeDetails, setMalpracticeDetails] = useState([]);

  useEffect(() => {
    if (currentUser) {
      loadGradesData();
    }
  }, [currentUser]);

  const loadGradesData = async () => {
    try {
      setLoading(true);
      // Fetch grades data
      if (currentUser?.id) {
        // Simulate API call - replace with actual API endpoint
        const mockGrades= [
          { id: '1', courseCode: 'CS101', courseName: 'Introduction to Programming', credits, grade: 'A', marks, maxMarks, semester: 'Fall 2024', year: '2024', status: 'passed' },
          { id: '2', courseCode: 'CS102', courseName: 'Data Structures', credits, grade: 'B', marks, maxMarks, semester: 'Fall 2024', year: '2024', status: 'passed' },
          { id: '3', courseCode: 'MATH201', courseName: 'Calculus', credits, grade: 'F', marks, maxMarks, semester: 'Fall 2024', year: '2024', status: 'failed' },
          { id: '4', courseCode: 'PHY101', courseName: 'Physics', credits, grade: 'C', marks, maxMarks, semester: 'Spring 2024', year: '2024', status: 'passed' },
        ];

        const mockAbsent= [
          { id: '1', courseCode: 'CS103', courseName: 'Algorithms', examDate: '2024-12-15', examType: 'Midterm', reason: 'Medical emergency' },
        ];

        const mockMalpractice= [
          { id: '1', courseCode: 'MATH201', courseName: 'Calculus', examDate: '2024-11-20', description: 'Found with unauthorized material', action: 'Warning issued', status: 'Resolved' },
        ];

        setGrades(mockGrades);
        setFailedCourses(mockGrades.filter(g => g.status === 'failed'));
        setAbsentDetails(mockAbsent);
        setMalpracticeDetails(mockMalpractice);
      }
    } catch (error) {
      console.error('Error loading grades data:', error);
      toast.error('Failed to load grades data');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A':
      case 'A+':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'B':
      case 'B+':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'C':
      case 'C+':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'F':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const calculateGPA = () => {
    if (grades.length === 0) return 0;
    const gradePoints= {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'F': 0.0,
    };
    
    const totalPoints = grades.reduce((sum, grade) => {
      return sum + (gradePoints[grade.grade] || 0) * grade.credits;
    }, 0);
    
    const totalCredits = grades.reduce((sum, grade) => sum + grade.credits, 0);
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  if (loading) {
    return (
      
        
        
      
    );
  }

  return (
    
      {/* Summary Cards */}
      
        
          
            
              
                Overall GPA
                {calculateGPA()}
              
              
            
          
        

        
          
            
              
                Total Courses
                {grades.length}
              
              
            
          
        

        
          
            
              
                Failed Courses
                {failedCourses.length}
              
              
            
          
        

        
          
            
              
                Pass Rate
                
                  {grades.length > 0 ? Math.round(((grades.length - failedCourses.length) / grades.length) * 100) : 0}%
                
              
              
            
          
        
      

      {/* Tabs */}
      
        
          Grades & Marks
          View your academic performance and related details
        
        
          
            
              All Grades
              Failed Courses
              Absent Details
              Malpractice
            

            
              
                
                  
                    
                      Course Code
                      Course Name
                      Credits
                      Marks
                      Grade
                      Semester
                      Status
                    
                  
                  
                    {grades.length === 0 ? (
                      
                        
                          No grades available
                        
                      
                    ) : (
                      grades.map((grade) => (
                        
                          {grade.courseCode}
                          {grade.courseName}
                          {grade.credits}
                          {grade.marks} / {grade.maxMarks}
                          
                            
                              {grade.grade}
                            
                          
                          {grade.semester}
                          
                            
                              {grade.status === 'passed' ? 'Passed' : 'Failed'}
                            
                          
                        
                      ))
                    )}
                  
                
              
            

            
              
                
                  
                    
                      Course Code
                      Course Name
                      Credits
                      Marks
                      Grade
                      Semester
                    
                  
                  
                    {failedCourses.length === 0 ? (
                      
                        
                          
                            
                            No failed courses
                          
                        
                      
                    ) : (
                      failedCourses.map((grade) => (
                        
                          {grade.courseCode}
                          {grade.courseName}
                          {grade.credits}
                          
                            {grade.marks} / {grade.maxMarks}
                          
                          
                            
                              {grade.grade}
                            
                          
                          {grade.semester}
                        
                      ))
                    )}
                  
                
              
            

            
              
                
                  
                    
                      Course Code
                      Course Name
                      Exam Type
                      Exam Date
                      Reason
                    
                  
                  
                    {absentDetails.length === 0 ? (
                      
                        
                          
                            
                            No absent records
                          
                        
                      
                    ) : (
                      absentDetails.map((absent) => (
                        
                          {absent.courseCode}
                          {absent.courseName}
                          {absent.examType}
                          {new Date(absent.examDate).toLocaleDateString()}
                          {absent.reason || 'Not specified'}
                        
                      ))
                    )}
                  
                
              
            

            
              
                
                  
                    
                      Course Code
                      Course Name
                      Exam Date
                      Description
                      Action Taken
                      Status
                    
                  
                  
                    {malpracticeDetails.length === 0 ? (
                      
                        
                          
                            
                            No malpractice records
                          
                        
                      
                    ) : (
                      malpracticeDetails.map((malpractice) => (
                        
                          {malpractice.courseCode}
                          {malpractice.courseName}
                          {new Date(malpractice.examDate).toLocaleDateString()}
                          {malpractice.description}
                          {malpractice.action}
                          
                            
                              {malpractice.status}
                            
                          
                        
                      ))
                    )}
                  
                
              
            
          
        
      
    
  );
}

