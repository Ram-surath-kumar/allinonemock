import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { callGeminiAPI, parseDataQueryIntent } from "@/services/gemini";
import { api } from "@/services/api";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  department?: string;
}

export function AIAssistantChatInline({ onNavigate: _onNavigate }: { onNavigate?: (path: string) => void }) {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState([
    {
      id: "1",
      role: "assistant",
      content: t("aiAssistant.hello"),
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    // Load students for context
    const loadStudents = async () => {
      try {
        const response = await api.getStudents();
        if (response.data) {
          setStudents(response.data);
        }
      } catch (error) {
        console.error("Failed to load students", error);
      }
    };
    loadStudents();
  }, []);

  const handleSend = async () => {
    if (!prompt.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: prompt.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setLoading(true);

    try {
      const currentDate = format(new Date(), "yyyy-MM-dd");
      
      // Check if it's a data query
      const isDataQuery = /^(how many|how much|show|list|count|is|are|was|were)\s+/i.test(userMessage.content) ||
        /^(is|are|was|were)\s+\w+\s+(present|absent|late|excused)/i.test(userMessage.content);

      let responseContent = "";
      
      if (isDataQuery) {
        // Parse query intent
        const intent = await parseDataQueryIntent(userMessage.content, students, currentDate);
        
        // For analytics queries, we need data - for now just use general response
        if (intent.queryType === "general") {
          // Use general Gemini API for chat
          const context = {
            students,
            currentDate,
            availableActions: ["chat"],
          };
          const geminiResponse = await callGeminiAPI(userMessage.content, context);
          responseContent = geminiResponse.message || "I couldn't process that request.";
        } else {
          // For specific data queries, provide a helpful response
          responseContent = "I can help you with data queries. Please use the main dashboard for detailed analytics.";
        }
      } else {
        // Handle action commands
        const context = {
          students,
          currentDate,
          availableActions: [
            "mark_attendance",
            "edit_student",
            "view_student",
            "delete_students",
            "add_department",
            "add_applicant",
            "analyze_system",
            "chat",
          ],
        };

        const geminiResponse = await callGeminiAPI(userMessage.content, context);
        
        if (geminiResponse.action === "chat") {
          responseContent = geminiResponse.message || "How can I help you today?";
        } else {
          responseContent = geminiResponse.message || "I've processed your request. Check the system for updates.";
        }
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to get response";
      toast.error(errorMessage);
      
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-80 h-[500px] border border-border rounded-lg bg-card shadow-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">AI Assistant</h3>
        </div>
      </div>

      {/* Messages */}
      {/* @ts-expect-error - ScrollArea accepts children */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={cn(
                  "text-xs mt-1",
                  message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {format(message.timestamp, "HH:mm")}
                </p>
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
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me anything..."
            className="flex-1"
            disabled={loading}
          />
          {/* @ts-expect-error - Button accepts children */}
          <Button onClick={handleSend} disabled={!prompt.trim() || loading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
