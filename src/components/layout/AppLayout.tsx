import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NoticeBanner } from '@/components/notices/NoticeBanner';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function AppLayout({ children, title, subtitle, currentPath, onNavigate }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex h-screen w-64 flex-col bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95 text-sidebar-foreground shadow-xl border-r border-sidebar-border/50">
        <Sidebar currentPath={currentPath} onNavigate={onNavigate} />
      </aside>

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground">
            <Sidebar currentPath={currentPath} onNavigate={(path) => {
              onNavigate(path);
              setSidebarOpen(false);
            }} />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex flex-1 flex-col overflow-hidden w-full md:w-auto">
        <Header title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <NoticeBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
