import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ExamProvider, useExam } from './context/ExamContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExamConsolePage } from './pages/ExamConsolePage';
import { AIAnalyticsPage } from './pages/AIAnalyticsPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { X, GraduationCap, Mail } from 'lucide-react';

const AppContent: React.FC = () => {
  const location = useLocation();
  const { login } = useExam();
  
  // Login Modal state
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>('aspirant@schoolsphere.ai');
  const [loginCallback, setLoginCallback] = useState<(() => void) | undefined>(undefined);
  
  // Hide Navbar/Footer on strict Exam Console viewports
  const isExamConsole = location.pathname.startsWith('/exam/') && !location.pathname.endsWith('/analytics');

  const openLoginModal = (onSuccess?: () => void) => {
    setLoginCallback(() => onSuccess);
    setIsLoginOpen(true);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(emailInput, 'STUDENT');
    setIsLoginOpen(false);
    if (loginCallback) {
      loginCallback();
    }
  };

  const handleGoogleSignInSim = () => {
    login('aspirant.google@gmail.com', 'STUDENT');
    setIsLoginOpen(false);
    if (loginCallback) {
      loginCallback();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isExamConsole && <Navbar onOpenLogin={() => openLoginModal()} />}
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<LandingPage onOpenLogin={openLoginModal} />} />
          <Route path="/dashboard/my-mocks" element={<DashboardPage />} />
          <Route path="/exam/:id" element={<ExamConsolePage />} />
          <Route path="/exam/:id/analytics" element={<AIAnalyticsPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        </Routes>
      </main>

      {!isExamConsole && <Footer />}

      {/* Shared OAuth Login Modal */}
      {isLoginOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel-elevated" style={{ maxWidth: '400px' }}>
            <button className="modal-close" onClick={() => setIsLoginOpen(false)}>
              <X size={20} />
            </button>
            
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <GraduationCap style={{ color: 'var(--primary)', marginBottom: '8px' }} size={40} />
              <h3 style={{ fontSize: '1.4rem' }}>Unlock Access</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sign in to synchronize test state & telemetry</p>
            </div>

            <button 
              onClick={handleGoogleSignInSim}
              className="btn btn-secondary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              <span>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            </div>

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="Enter your email" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                  required
                />
                <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Get OTP & Access dashboard
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <ExamProvider>
        <AppContent />
      </ExamProvider>
    </Router>
  );
};
export default App;
