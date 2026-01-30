import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { AIAssistantChat } from "@/components/ai/AIAssistantChat";
import { cn } from "@/lib/utils";

export function AppLayout({ children, title, subtitle, currentPath, onNavigate, isChatConversation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const isChatPage = currentPath && (currentPath === "/chat" || currentPath.includes("/chat"));

  // Auto-collapse sidebar when on chat page
  useEffect(() => {
    if (isChatPage) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [isChatPage]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex h-screen flex-col text-sidebar-foreground transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <Sidebar currentPath={currentPath} onNavigate={onNavigate} collapsed={sidebarCollapsed} />
      </aside>

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[280px] p-0 bg-sidebar text-sidebar-foreground border-r-0">
            <Sidebar
              currentPath={currentPath}
              onNavigate={(path) => {
                onNavigate(path);
                setSidebarOpen(false);
              }}
            />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex flex-1 flex-col overflow-hidden w-full min-w-0">
        <Header
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setSidebarOpen(true)}
          onNavigate={onNavigate}
        />
        <main
          className={cn(
            "flex-1 overflow-x-hidden",
            isChatPage ? "overflow-y-hidden p-0" : "overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8"
          )}
          role="main"
        >
          <div className={cn(
            "max-w-screen-2xl mx-auto min-h-full animate-fade-in flex flex-col",
            isChatPage ? "max-w-none h-full" : ""
          )}>
            {children}
          </div>
        </main>
      </div>

      {/* Floating AI Chat Assistant */}
      <AIAssistantChat
        onNavigate={onNavigate}
        isChatConversation={isChatConversation}
        isChatPage={isChatPage}
      />
    </div>
  );
}
