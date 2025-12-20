import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NoticeBanner } from '@/components/notices/NoticeBanner';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function AppLayout({ children, title, subtitle, currentPath, onNavigate }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPath={currentPath} onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-6">
          <NoticeBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
