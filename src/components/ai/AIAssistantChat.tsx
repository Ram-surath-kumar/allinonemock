import { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { callGeminiAPI, callGeminiAnalytics, parseDataQueryIntent, AIAction, AIContext, DataQueryIntent } from '@/services/gemini';
import { api } from '@/services/api';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantChatProps {
  onNavigate?: (path: string) => void;
}

export function AIAssistantChat({ onNavigate }: AIAssistantChatProps) {
  const { currentUser, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you with actions like marking attendance, or answer questions about your data. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        const departmentIds = [...new Set(studentsData.filter((u: any) => u.department_id).map((u: any) => u.department_id))];
        let deptMap = new Map<string, string>();
        
        if (departmentIds.length > 0) {
          const deptResponse = await api.getDepartments({ ids: departmentIds });
          if (!deptResponse.error && deptResponse.data) {
            deptResponse.data.forEach((dept: any) => {
              deptMap.set(dept.id, dept.name);
            });
            setDepartments(deptResponse.data);
          }
        }

        const studentsWithDept = studentsData.map((row: any) => ({
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

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const executeAction = async (action: AIAction) => {
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
      } catch (error: any) {
        console.error('Error marking attendance:', error);
        addMessage('assistant', `❌ Error: ${error.message || 'Failed to mark attendance'}`);
      }
    } else if (action.action === 'edit_student') {
      if (onNavigate) {
        onNavigate('/students');
      } else {
        navigate('/students');
      }
      setTimeout(() => {
        setIsOpen(false);
      }, 500);
      addMessage('assistant', 'Opening students page for editing...');
    } else if (action.action === 'view_student') {
      if (onNavigate) {
        onNavigate('/students');
      } else {
        navigate('/students');
      }
      setTimeout(() => {
        setIsOpen(false);
      }, 500);
      addMessage('assistant', `Opening students page to view ${action.student_name || 'student'}...`);
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
    } else {
      addMessage('assistant', 'I couldn\'t understand that command. Try: "mark [student name] as [present/absent]", "add new department with name [name]", or ask me a question about your data.');
    }
  };

  const handleDataQuery = async (query: string) => {
    try {
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
            s => s.name.toLowerCase().includes(intent.student_name!.toLowerCase())
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
              d => d.name.toLowerCase().includes(intent.department!.toLowerCase())
            );

            if (matchingDepts.length > 0) {
              const deptId = matchingDepts[0].id;
              filteredStudents = students.filter(s => s.department_id === deptId);
            } else {
              // Try fuzzy match
              filteredStudents = students.filter(
                s => s.department?.toLowerCase().includes(intent.department!.toLowerCase())
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
            s => s.name.toLowerCase().includes(intent.student_name!.toLowerCase())
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
          const generateHistorical = (current: number, count: number = 6) => {
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
    } catch (error: any) {
      console.error('Error processing data query:', error);
      addMessage('assistant', `Sorry, I encountered an error: ${error.message || 'Failed to process your query'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const isDataQuery = /^(what|how|is|are|was|were|show|tell|give|list|display|analyze|explain|describe|compare|summary|report|count|check|find)/i.test(userPrompt) ||
                         /^(how many|how much|what is|what are|tell me|show me|give me|is there|are there)/i.test(userPrompt) ||
                         userPrompt.includes('?') ||
                         /^(is|are|was|were)\s+\w+\s+(present|absent|late|excused)/i.test(userPrompt);

      if (isDataQuery) {
        // Handle as data query - query database
        await handleDataQuery(userPrompt);
      } else {
        // Handle as action
        const context: AIContext = {
          students: students,
          currentDate: format(new Date(), 'yyyy-MM-dd'),
          availableActions: ['mark_attendance', 'edit_student', 'view_student'],
        };

        const action = await callGeminiAPI(userPrompt, context);

        if (action.confidence < 0.5) {
          addMessage('assistant', `I'm not confident I understood that (${(action.confidence * 100).toFixed(0)}% confidence). ${action.message || 'Could you rephrase your request?'}`);
        } else {
          await executeAction(action);
        }
      }
    } catch (error: any) {
      console.error('Error processing AI command:', error);
      addMessage('assistant', `Sorry, I encountered an error: ${error.message || 'Failed to process your request'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full",
            "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
            "shadow-depth-2 hover:shadow-glow transition-all duration-300",
            "hover-lift active:scale-95",
            "flex items-center justify-center",
            "group focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          )}
          aria-label="Open AI Assistant"
        >
          <Sparkles className="h-6 w-6 animate-pulse group-hover:animate-spin transition-transform" />
          <span className="absolute inset-0 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity animate-ping" />
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 rounded-2xl shadow-depth-3",
          "bg-card border border-border/30 glass-modern",
          "transition-all duration-300",
          isMinimized ? "w-80 h-16" : "w-96 h-[600px]",
          "flex flex-col overflow-hidden"
        )} role="dialog" aria-label="AI Assistant Chat" aria-modal="true">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              {!isMinimized && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground">AI Assistant</h3>
                  <p className="text-xs text-muted-foreground">Ask me anything</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
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
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                          message.role === 'user'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {format(message.timestamp, 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl px-4 py-2.5">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-border/30">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything..."
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
                  <Button
                    type="submit"
                    size="icon"
                    disabled={loading || !prompt.trim()}
                    className="rounded-full shrink-0 hover-lift focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                    aria-label="Send message"
                  >
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
    </>
  );
}
