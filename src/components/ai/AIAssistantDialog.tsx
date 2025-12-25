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
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface AIAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIAssistantDialog({ open, onOpenChange }: AIAssistantDialogProps) {
  const { currentUser, hasPermission } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);

  // Load students when dialog opens
  useEffect(() => {
    if (open && students.length === 0) {
      loadStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, department_id, role')
        .eq('role', 'student')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        // Fetch department names
        const departmentIds = [...new Set(data.filter((u: any) => u.department_id).map((u: any) => u.department_id))];
        let deptMap = new Map<string, string>();
        
        if (departmentIds.length > 0) {
          const { data: deptData, error: deptError } = await supabase
            .from('departments')
            .select('id, name')
            .in('id', departmentIds);
          
          if (!deptError && deptData) {
            deptData.forEach((dept: any) => {
              deptMap.set(dept.id, dept.name);
            });
          }
        }

        const studentsWithDept = data.map((row: any) => ({
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

  const executeAction = async (action: AIAction) => {
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
        const { error } = await supabase
          .from('attendance')
          .upsert(
            {
              student_id: action.student_id,
              date: dateStr,
              status: action.status,
              marked_by: currentUser?.id || null,
            },
            {
              onConflict: 'student_id,date',
            }
          );

        if (error) throw error;

        toast.success(`Marked ${action.student_name} as ${action.status}`);
        
        // Dispatch event to refresh attendance page
        window.dispatchEvent(new CustomEvent('attendance-updated'));
      } catch (error: any) {
        console.error('Error marking attendance:', error);
        toast.error(error.message || 'Failed to mark attendance');
      }
    } else if (action.action === 'edit_student') {
      toast.info('Edit student feature coming soon');
    } else if (action.action === 'view_student') {
      toast.info(`Viewing ${action.student_name || 'student'}`);
    } else {
      toast.error('I could not understand that command. Try: "mark [student name] as [present/absent]"');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      const context: AIContext = {
        students: students,
        currentDate: format(new Date(), 'yyyy-MM-dd'),
        availableActions: ['mark_attendance', 'edit_student', 'view_student'],
      };

      const action = await callGeminiAPI(prompt, context);

      if (action.confidence < 0.5) {
        toast.warning(`Low confidence (${(action.confidence * 100).toFixed(0)}%). ${action.message || 'Please rephrase your command.'}`);
        return;
      }

      await executeAction(action);
      setPrompt(''); // Clear prompt after successful execution
    } catch (error: any) {
      console.error('Error processing AI command:', error);
      toast.error(error.message || 'Failed to process command');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Assistant
          </DialogTitle>
          <DialogDescription>
            Ask me to perform actions like marking attendance. Example: "mark Laxman from department BSC Comp Science as absent"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="e.g., mark Laxman as absent, mark John from BSC Comp Science as present..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              className="w-full"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !prompt.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Execute
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

