import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Loader2, Send, X, Minimize2, Maximize2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { callGeminiAPI, callGeminiAnalytics, parseDataQueryIntent } from '@/services/gemini';
import { api } from '@/services/api';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';





export function AIAssistantChat({ onNavigate }) {
  const { currentUser, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you with actions like marking attendance, or answer questions about your data. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: null,
    title: '',
    description: '',
  });

  useEffect(() => {
    console.log('AIAssistantChat component mounted/updated', { isOpen, document: typeof document !== 'undefined' });
  }, []);

  useEffect(() => {
    if (isOpen && students.length === 0) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const loadData = async () => {
    try {
      // Load students
      const studentsResponse = await api.getUsers({ role: 'student', status: 'active' });
      if (studentsResponse.error) throw new Error(studentsResponse.error);
      const studentsData = studentsResponse.data;

      if (studentsData) {
        const departmentIds = [...new Set(studentsData.filter((u) => u.department_id).map((u) => u.department_id))];
        let deptMap = new Map();

        if (departmentIds.length > 0) {
          const deptResponse = await api.getDepartments({ ids: departmentIds });
          if (!deptResponse.error && deptResponse.data) {
            deptResponse.data.forEach((dept) => {
              deptMap.set(dept.id, dept.name);
            });
            setDepartments(deptResponse.data);
          }
        }

        const studentsWithDept = studentsData.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          department: row.department_id ? deptMap.get(row.department_id) || null : null,
          department_id: row.department_id,
        }));

        setStudents(studentsWithDept);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addMessage = (role, content) => {
    const newMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Check if action is risky and requires confirmation
  const isRiskyAction = (action) => {
    const riskyActions = ['delete_students', 'delete_all_students', 'remove_all_students'];
    return riskyActions.includes(action.action) || (action.delete_all === true);
  };

  const executeAction = async (action, skipConfirmation = false) => {
    // Check if action requires confirmation
    if (!skipConfirmation && isRiskyAction(action)) {
      const studentCount = students.length;
      setConfirmDialog({
        open: true,
        action: action,
        title: '⚠️ Risky Action - Delete All Students',
        description: `This action will permanently delete ALL ${studentCount} student${studentCount !== 1 ? 's' : ''} from the system. This cannot be undone. Are you sure you want to proceed?`,
      });
      return;
    }

    if (action.action === 'mark_attendance') {
      if (!action.student_id || !action.status) {
        addMessage('assistant', 'I couldn\'t identify the student or status. Please try again with more details.');
        return;
      }

      if (!hasPermission('manage_attendance')) {
        addMessage('assistant', 'You don\'t have permission to manage attendance.');
        return;
      }

      try {
        addMessage('assistant', `🔄 Processing... Marking ${action.student_name} as ${action.status}...`);

        const dateStr = action.date || format(new Date(), 'yyyy-MM-dd');
        const response = await api.markAttendance([{
          student_id: action.student_id,
          date: dateStr,
          status: action.status,
          marked_by: currentUser?.id || null,
        }]);

        if (response.error) throw new Error(response.error);

        addMessage('assistant', `✅ Successfully marked ${action.student_name} as ${action.status}.`);

        // Navigate to attendance page
        if (onNavigate) {
          onNavigate('/attendance');
        } else {
          navigate('/attendance');
        }

        // Close chat after action
        setTimeout(() => {
          setIsOpen(false);
        }, 1000);

        window.dispatchEvent(new CustomEvent('attendance-updated'));
      } catch (error) {
        console.error('Error marking attendance:', error);
        addMessage('assistant', `❌ Error: ${error.message || 'Failed to mark attendance'}`);
      }
    } else if (action.action === 'edit_student') {
      addMessage('assistant', '🔄 Processing... Opening students page for editing...');
      if (onNavigate) {
        onNavigate('/students');
      } else {
        navigate('/students');
      }
      setTimeout(() => {
        setIsOpen(false);
      }, 500);
    } else if (action.action === 'view_student') {
      addMessage('assistant', `🔄 Processing... Opening students page to view ${action.student_name || 'student'}...`);
      if (onNavigate) {
        onNavigate('/students');
      } else {
        navigate('/students');
      }
      setTimeout(() => {
        setIsOpen(false);
      }, 500);
    } else if (action.action === 'add_department') {
      if (!action.department_name) {
        addMessage('assistant', 'I couldn\'t identify the department name. Please specify it clearly, e.g., "add new department with name Computer Science"');
        return;
      }

      if (!hasPermission('manage_staff')) {
        addMessage('assistant', 'You don\'t have permission to create departments.');
        return;
      }

      try {
        addMessage('assistant', `🔄 Processing... Creating department "${action.department_name}"...`);

        const response = await api.createDepartment({
          name: action.department_name,
          created_by: currentUser?.id || '',
        });

        if (response.error) throw new Error(response.error);

        addMessage('assistant', `✅ Successfully created department "${action.department_name}".`);

        // Navigate to tools page
        if (onNavigate) {
          onNavigate('/tools');
        } else {
          navigate('/tools');
        }

        // Close chat after action
        setTimeout(() => {
          setIsOpen(false);
        }, 1000);
      } catch (error) {
        console.error('Error creating department:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create department';

        // Check if it's a service role key error
        if (errorMessage.includes('SUPABASE_SERVICE_ROLE_KEY') || errorMessage.includes('row-level security')) {
          addMessage('assistant', `❌ Error: Server configuration issue. The Service Role Key is required for creating departments. Please check SETUP_SERVICE_ROLE_KEY.md for setup instructions.`);
        } else {
          addMessage('assistant', `❌ Error: ${errorMessage}`);
        }
      }
    } else if (action.action === 'delete_students') {
      if (!action.delete_all) {
        addMessage('assistant', 'I couldn\'t understand the delete command. Please specify "delete all students" to delete all students.');
        return;
      }

      if (!hasPermission('manage_staff')) {
        addMessage('assistant', 'You don\'t have permission to delete students.');
        return;
      }

      try {
        // Show processing status
        const totalStudents = students.length;
        addMessage('assistant', `🔄 Processing... Starting deletion of ${totalStudents} student${totalStudents !== 1 ? 's' : ''}...`);

        // Delete all students
        const studentIds = students.map(s => s.id);
        let deletedCount = 0;
        let errorCount = 0;

        for (let i = 0; i < studentIds.length; i++) {
          const studentId = studentIds[i];
          const currentIndex = i + 1;

          // Show progress every 5 students or for the last one
          if (currentIndex % 5 === 0 || currentIndex === studentIds.length) {
            addMessage('assistant', `🔄 Processing... Deleting student ${currentIndex} of ${totalStudents}...`);
          }

          try {
            const response = await api.deleteUser(studentId);
            if (response.error) {
              errorCount++;
              console.error(`Error deleting student ${studentId}:`, response.error);
            } else {
              deletedCount++;
            }
          } catch (error) {
            errorCount++;
            console.error(`Error deleting student ${studentId}:`, error);
          }
        }

        // Show completion status
        if (errorCount > 0 && deletedCount === 0) {
          // Get more details about the first error
          let errorDetails = '';
          if (errorCount > 0) {
            errorDetails = ' This may be due to foreign key constraints or missing permissions.';
          }
          throw new Error(`Failed to delete students. ${errorCount} error(s) occurred.${errorDetails}`);
        }

        const message = deletedCount > 0
          ? `✅ Successfully deleted ${deletedCount} student${deletedCount !== 1 ? 's' : ''}.${errorCount > 0 ? ` ${errorCount} student(s) could not be deleted due to database constraints.` : ''}`
          : `❌ Failed to delete students. ${errorCount} error(s) occurred.`;

        addMessage('assistant', message);

        // Reload students list
        await loadData();

        // Navigate to students page
        if (onNavigate) {
          onNavigate('/students');
        } else {
          navigate('/students');
        }

        // Close chat after action
        setTimeout(() => {
          setIsOpen(false);
        }, 2000);
      } catch (error) {
        console.error('Error deleting students:', error);
        let errorMessage = error.message || 'Failed to delete students';

        // Provide more helpful error messages
        if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
          errorMessage = 'Some students could not be deleted because they have related records (hall tickets, attendance, fees, etc.). The backend should handle this automatically. Please try again or contact support.';
        }

        addMessage('assistant', `❌ Error: ${errorMessage}`);
      }
    } else if (action.action === 'add_applicant') {
      addMessage('assistant', '📝 Opening Admission Portal...');
      if (onNavigate) {
        onNavigate('/students');
      } else {
        navigate('/students');
      }
      setTimeout(() => {
        setIsOpen(false);
      }, 1000);
    } else if (action.action === 'analyze_system') {
      try {
        addMessage('assistant', '📊 Gathering real-time data from dashboard...');

        const response = await api.getDashboardData(currentUser?.id, currentUser?.role);

        if (response.error) throw new Error(response.error);

        const dashboardData = response.data;

        // Analyze using the analytics service but with REAL data
        const analysis = await callGeminiAnalytics("Analyze the entire ERP system based on this data", dashboardData);

        addMessage('assistant', analysis);
      } catch (error) {
        console.error('Error analyzing system:', error);
        addMessage('assistant', '❌ Failed to analyze system data. Please try again.');
      }
    } else if (action.action === 'chat') {
      addMessage('assistant', action.message || 'Hello! How can I help you?');
    } else {
      addMessage('assistant', 'I couldn\'t understand that command. Try: "mark [student name] as [present/absent]", "add new department with name [name]", "delete all students", "add applicant", "analyze system", or just say "hi"!');
    }
  };

  const handleConfirmAction = async () => {
    setConfirmDialog({ ...confirmDialog, open: false });
    if (confirmDialog.action) {
      await executeAction(confirmDialog.action, true);
    }
  };

  const handleDataQuery = async (query) => {
    try {
      addMessage('assistant', '🔄 Processing... Analyzing your question...');

      const currentDate = format(new Date(), 'yyyy-MM-dd');

      // Parse the query intent
      const intent = await parseDataQueryIntent(query, students, currentDate);

      if (intent.confidence < 0.5) {
        addMessage('assistant', 'I\'m not sure I understood your question. Could you rephrase it?');
        return;
      }

      let response = '';

      switch (intent.queryType) {
        case 'attendance_check': {
          if (!intent.student_name) {
            addMessage('assistant', 'I couldn\'t identify which student you\'re asking about. Please specify the student name.');
            return;
          }

          // Find student
          const matchingStudents = students.filter(
            s => s.name.toLowerCase().includes(intent.student_name.toLowerCase())
          );

          if (matchingStudents.length === 0) {
            addMessage('assistant', `I couldn't find a student named "${intent.student_name}". Please check the spelling.`);
            return;
          }

          if (matchingStudents.length > 1) {
            addMessage('assistant', `I found multiple students with that name: ${matchingStudents.map(s => s.name).join(', ')}. Please be more specific.`);
            return;
          }

          const student = matchingStudents[0];

          // Get attendance for the date
          const attendanceResponse = await api.getAttendance({
            date: intent.date,
            student_id: student.id,
          });

          if (attendanceResponse.error) {
            addMessage('assistant', `Error fetching attendance: ${attendanceResponse.error}`);
            return;
          }

          const attendanceData = attendanceResponse.data;

          if (!attendanceData || attendanceData.length === 0) {
            response = `${student.name} has no attendance record for ${intent.date === currentDate ? 'today' : intent.date}.`;
          } else {
            const record = attendanceData[0];
            const status = record.status;
            const statusEmoji = status === 'present' ? '✅' : status === 'absent' ? '❌' : status === 'late' ? '⏰' : '📝';
            response = `${statusEmoji} ${student.name} is ${status} ${intent.date === currentDate ? 'today' : `on ${intent.date}`}.`;
          }
          break;
        }

        case 'student_count': {
          let filteredStudents = students;

          if (intent.department) {
            // Find matching department
            const matchingDepts = departments.filter(
              d => d.name.toLowerCase().includes(intent.department.toLowerCase())
            );

            if (matchingDepts.length > 0) {
              const deptId = matchingDepts[0].id;
              filteredStudents = students.filter(s => s.department_id === deptId);
            } else {
              // Try fuzzy match
              filteredStudents = students.filter(
                s => s.department?.toLowerCase().includes(intent.department.toLowerCase())
              );
            }
          }

          const count = filteredStudents.length;
          if (intent.department) {
            response = `There are ${count} student${count !== 1 ? 's' : ''} in ${intent.department}.`;
          } else {
            response = `There are ${count} active student${count !== 1 ? 's' : ''} in total.`;
          }
          break;
        }

        case 'student_info': {
          if (!intent.student_name) {
            addMessage('assistant', 'I couldn\'t identify which student you\'re asking about. Please specify the student name.');
            return;
          }

          const matchingStudents = students.filter(
            s => s.name.toLowerCase().includes(intent.student_name.toLowerCase())
          );

          if (matchingStudents.length === 0) {
            addMessage('assistant', `I couldn't find a student named "${intent.student_name}".`);
            return;
          }

          if (matchingStudents.length > 1) {
            response = `I found multiple students: ${matchingStudents.map(s => `${s.name} (${s.department || 'No department'})`).join(', ')}.`;
          } else {
            const student = matchingStudents[0];
            response = `Student: ${student.name}\nEmail: ${student.email}\nDepartment: ${student.department || 'Not assigned'}`;
          }
          break;
        }

        default: {
          // Use analytics function for general queries
          const generateHistorical = (current, count = 6) => {
            const data = [];
            for (let i = count - 1; i >= 0; i--) {
              data.push(Math.max(0, current + (Math.random() - 0.5) * (current * 0.1)));
            }
            return data;
          };

          const data = {
            attendance: {
              current: 94.2,
              historical: generateHistorical(94.2, 6),
            },
            finance: {
              current: 284500,
              historical: generateHistorical(284500, 6),
            },
            students: {
              current: students.length,
              historical: generateHistorical(students.length, 6),
            },
          };

          response = await callGeminiAnalytics(query, data);
        }
      }

      addMessage('assistant', response);
    } catch (error) {
      console.error('Error processing data query:', error);
      addMessage('assistant', `Sorry, I encountered an error: ${error.message || 'Failed to process your query'}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) {
      return;
    }

    const userPrompt = prompt.trim();
    setPrompt('');
    addMessage('user', userPrompt);
    setLoading(true);

    try {
      // Load data if not loaded
      if (students.length === 0) {
        await loadData();
      }

      // Check if it's a data query (questions like "what", "how many", "is", "show me", etc.)
      const isAnalyzeCommand = /^(analyze system|analyze erp|analyze the entire erp)/i.test(userPrompt);

      const isDataQuery = !isAnalyzeCommand && (
        /^(what|how|is|are|was|were|show|tell|give|list|display|explain|describe|compare|summary|report|count|check|find)/i.test(userPrompt) ||
        /^(how many|how much|what is|what are|tell me|show me|give me|is there|are there)/i.test(userPrompt) ||
        userPrompt.includes('?') ||
        /^(is|are|was|were)\s+\w+\s+(present|absent|late|excused)/i.test(userPrompt)
      );

      if (isDataQuery) {
        // Handle data query
        await handleDataQuery(userPrompt);
      } else {
        // Handle action
        addMessage('assistant', '🔄 Processing... Understanding your command...');

        const context = {
          students,
          currentDate: format(new Date(), 'yyyy-MM-dd'),
          availableActions: ['mark_attendance', 'edit_student', 'view_student', 'delete_students', 'add_department', 'add_applicant', 'analyze_system'],
        };

        const action = await callGeminiAPI(userPrompt, context);

        if (action.confidence >= 0.7) {
          await executeAction(action);
        } else {
          addMessage('assistant', 'I couldn\'t understand that command. Try: "mark [student name] as [present/absent]", "add new department with name [name]", or ask me a question about your data.');
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage('assistant', `Sorry, I encountered an error: ${error.message || 'Failed to process your message'}`);
    } finally {
      setLoading(false);
    }
  };

  // Ensure we have document available (client-side only)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null; // SSR safety check
  }

  // Ensure document.body exists
  if (!document.body) {
    return null;
  }

  // Render using portal to document.body to ensure it's always on top
  return createPortal(
    <>
      {/* Floating Button - Positioned at bottom-right corner */}
      {!isOpen && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
          className={cn(
            "fixed h-14 w-14 rounded-full",
            "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
            "shadow-lg hover:shadow-xl transition-all duration-300",
            "hover:scale-110 active:scale-95",
            "flex items-center justify-center",
            "group focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          )}
          style={{
            zIndex: 99999,
            pointerEvents: 'auto',
            cursor: 'pointer',
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px'
          }}
          aria-label="Open AI Assistant"
        >
          <Sparkles className="h-6 w-6 animate-pulse group-hover:animate-spin transition-transform" />
          <span className="absolute inset-0 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity animate-ping" />
        </button>
      )}

      {/* Chat Widget - Positioned at bottom-right corner */}
      {isOpen && (
        <div className={cn(
          "fixed bottom-6 right-6 w-96 rounded-2xl border border-border bg-background shadow-lg",
          "flex flex-col overflow-hidden transition-all duration-300",
          isMinimized ? "h-14" : "h-[600px]"
        )}
          style={{
            zIndex: 99999,
            pointerEvents: 'auto',
            position: 'fixed',
            bottom: '24px',
            right: '24px'
          }}
          role="dialog" aria-label="AI Assistant Chat" aria-modal="true">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {!isMinimized && (
                <div>
                  <h3 className="text-sm font-semibold">AI Assistant</h3>
                  <p className="text-xs text-muted-foreground">Ask me anything</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        message.role === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}>
                        {message.content}
                        <div className="text-xs opacity-70 mt-1">
                          {format(message.timestamp, 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <form onSubmit={handleSubmit} className="border-t border-border p-4">
                <div className="flex gap-2">
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={loading}
                    className="flex-1 rounded-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <Button type="submit" disabled={loading} size="icon">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {confirmDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Delete All Students
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>,
    document.body
  );
}
