import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { UserManagement } from '@/pages/UserManagement';
import { ROLE_LABELS } from '@/types/erp';

function AppContent() {
  const { currentUser } = useAuth();
  const [currentPath, setCurrentPath] = useState('/');
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const handleOpenAddUserDialog = () => {
    setCurrentPath('/users');
    setAddUserDialogOpen(true);
  };

  const getPageTitle = () => {
    switch (currentPath) {
      case '/':
        return 'Dashboard';
      case '/users':
        return 'User Management';
      case '/students':
        return 'Students';
      case '/attendance':
        return 'Attendance';
      case '/academics':
        return 'Academics';
      case '/finance':
        return 'Finance';
      case '/facilities':
        return 'Facilities';
      case '/settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  const getPageSubtitle = () => {
    if (currentPath === '/') {
      return `Welcome back, ${currentUser?.name.split(' ')[0]}`;
    }
    return undefined;
  };

  const renderContent = () => {
    switch (currentPath) {
      case '/':
        return <Dashboard onAddUser={handleOpenAddUserDialog} />;
      case '/users':
        return (
          <UserManagement 
            dialogOpen={addUserDialogOpen} 
            setDialogOpen={setAddUserDialogOpen} 
          />
        );
      case '/students':
      case '/attendance':
      case '/academics':
      case '/finance':
      case '/facilities':
      case '/settings':
        return (
          <div className="flex items-center justify-center h-64 rounded-xl border border-border bg-card">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">{getPageTitle()}</h2>
              <p className="mt-2 text-muted-foreground">
                This section is coming soon. Currently viewing as {currentUser && ROLE_LABELS[currentUser.role]}.
              </p>
            </div>
          </div>
        );
      default:
        return <Dashboard onAddUser={handleOpenAddUserDialog} />;
    }
  };

  return (
    <AppLayout
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
      currentPath={currentPath}
      onNavigate={handleNavigate}
    >
      {renderContent()}
    </AppLayout>
  );
}

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
