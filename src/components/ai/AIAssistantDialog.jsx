import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { callGeminiAPI, AIAction, AIContext } from '@/services/gemini';
import { api } from '@/services/api';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';



export function AIAssistantDialog({ open, onOpenChange }) {
  const { currentUser, hasPermission } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);

  // Load students when dialog opens
  useEffect(() => {
    if (open && students.length === 0) {
      loadStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadStudents = async () => {
    try {
      const response = await api.getUsers({ role: 'student', status: 'active' });
      if (response.error) throw new Error(response.error);
      const data = response.data;

      if (data) {
        // Fetch department names
        const departmentIds = [...new Set(data.filter((u) => u.department_id).map((u) => u.department_id))];
        let deptMap = new Map();
        
        if (departmentIds.length > 0) {
          const deptResponse = await api.getDepartments({ ids);
          if (!deptResponse.error && deptResponse.data) {
            deptResponse.data.forEach((dept) => {
              deptMap.set(dept.id, dept.name);
            });
          }
        }

        const studentsWithDept = data.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          department: row.department_id ? deptMap.get(row.department_id) || null : null,
          department_id: row.department_id,
        }));

        setStudents(studentsWithDept);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const executeAction = async (action) => {
    if (action.action === 'mark_attendance') {
      if (!action.student_id || !action.status) {
        toast.error('Could not identify student or status');
        return;
      }

      if (!hasPermission('manage_attendance')) {
        toast.error('You do not have permission to manage attendance');
        return;
      }

      try {
        const dateStr = action.date || format(new Date(), 'yyyy-MM-dd');
        const response = await api.markAttendance([{
          student_id: action.student_id,
          date,
          status: action.status,
          marked_by: currentUser?.id || null,
        }]);

        if (response.error) throw new Error(response.error);

        toast.success(`Marked ${action.student_name} as ${action.status}`);
        
        // Dispatch event to refresh attendance page
        window.dispatchEvent(new CustomEvent('attendance-updated'));
      } catch (error) {
        console.error('Error marking attendance:', error);
        toast.error(error.message || 'Failed to mark attendance');
      }
    } else if (action.action === 'edit_student') {
      toast.info('Edit student feature coming soon');
    } else if (action.action === 'view_student') {
      toast.info(`Viewing ${action.student_name || 'student'}`);
    } else {
      toast.error('I could not understand that command. Try: "mark [student name]/absent]"');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast.error('Please enter a command');
      return;
    }

    setLoading(true);
    
    try {
      // Load students if not loaded
      if (students.length === 0) {
        await loadStudents();
      }

      const context= {
        students,
        currentDate: format(new Date(), 'yyyy-MM-dd'),
        availableActions: ['mark_attendance', 'edit_student', 'view_student'],
      };

      const action = await callGeminiAPI(prompt, context);

      if (action.confidence 
      
        
          
            
            AI Assistant
          
          
            Ask me to perform actions like marking attendance. Example: "mark Laxman from department BSC Comp Science"
          
        

        
          
             setPrompt(e.target.value)}
              disabled={loading}
              className="w-full"
              autoFocus
            />
          

          
             onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            
            
              {loading ? (
                <>
                  
                  Processing...
                
              ) : (
                <>
                  
                  Execute
                
              )}
            
          
        
      
    
  );
}

