import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { GraduationCap, LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLogin }) => {
  const { user, logout } = useExam();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    if (location.pathname.startsWith('/exam/') && !location.pathname.endsWith('/analytics')) {
      if (confirm('Warning: Leaving the active exam console will NOT pause the timer. Are you sure you want to go to the homepage?')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const handleDashboardClick = () => {
    if (location.pathname.startsWith('/exam/') && !location.pathname.endsWith('/analytics')) {
      if (confirm('Warning: Leaving the active exam console will NOT pause the timer. Are you sure you want to go to the dashboard?')) {
        navigate('/dashboard/my-mocks');
      }
    } else {
      navigate('/dashboard/my-mocks');
    }
  };

  const handleAdminClick = () => {
    if (location.pathname.startsWith('/exam/') && !location.pathname.endsWith('/analytics')) {
      if (confirm('Warning: Leaving the active exam console will NOT pause the timer. Are you sure you want to exit?')) {
        navigate('/admin/dashboard');
      }
    } else {
      navigate('/admin/dashboard');
    }
  };

  return (
    <nav className="navbar glass-panel">
      <div className="container navbar-container">
        <div className="logo-container" onClick={handleLogoClick}>
          <GraduationCap className="logo-icon" size={32} />
          <span className="gradient-text-accent">SchoolSphere<span style={{color: 'var(--text-primary)', fontWeight: 500}}>AI</span></span>
        </div>

        <div className="nav-links">
          <span 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            Home
          </span>
          <span 
            className={`nav-link ${location.pathname === '/dashboard/my-mocks' ? 'active' : ''}`}
            onClick={handleDashboardClick}
          >
            My Mocks
          </span>
          
          {user?.role === 'SUPERADMIN' && (
            <span 
              className={`nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
              onClick={handleAdminClick}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-amber)' }}
            >
              <ShieldAlert size={16} /> Admin Console
            </span>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserIcon size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.email}</span>
                <span className={`badge ${user.role === 'SUPERADMIN' ? 'badge-amber' : 'badge-primary'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                  {user.role}
                </span>
              </div>
              <button 
                onClick={() => { logout(); navigate('/'); }}
                className="btn btn-secondary" 
                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          ) : (
            <button onClick={onOpenLogin} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
