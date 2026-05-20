import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { Award, BookOpen, Clock, Activity, CheckCircle, ArrowRight, ShieldAlert } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, mocks, attemptsHistory, activeAttempt, startExam } = useExam();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
          <ShieldAlert size={48} style={{ color: 'var(--accent-amber)', marginBottom: '16px' }} />
          <h2 style={{ marginBottom: '12px' }}>Authentication Required</h2>
          <p style={{ marginBottom: '24px' }}>Please sign in to view your dashboard and access mocks.</p>
          <button onClick={() => window.location.href = '/'} className="btn btn-primary">Go to Homepage</button>
        </div>
      </div>
    );
  }

  // Filter owned mocks
  const ownedMocks = mocks.filter(mock => user.purchasedMockPacks.includes(mock.id) || mock.price === 0);

  // Group mocks by completion status
  // 1. In progress
  // Either we have a globally active attempt matching this mock, or we have history entries that are not submitted
  const inProgressAttempts = attemptsHistory.filter(a => !a.submittedAt);
  
  // 2. Completed
  const completedAttempts = attemptsHistory.filter(a => a.submittedAt !== null);

  // 3. Available (owned but not completed and not currently in progress)
  const availableMocks = ownedMocks.filter(mock => {
    const hasCompleted = completedAttempts.some(c => c.mockTestId === mock.id);
    const hasInProgress = activeAttempt?.mockTestId === mock.id || inProgressAttempts.some(i => i.mockTestId === mock.id);
    return !hasCompleted && !hasInProgress;
  });

  // Calculate high-level stats from completed attempts
  const totalCompleted = completedAttempts.length;
  const avgPercentile = totalCompleted > 0
    ? (completedAttempts.reduce((acc, curr) => acc + (curr.aiAnalysisOutput?.predictedPercentile || 0), 0) / totalCompleted).toFixed(1)
    : 'N/A';
  
  const avgFatigue = totalCompleted > 0
    ? Math.round(completedAttempts.reduce((acc, curr) => acc + (curr.aiAnalysisOutput?.fatigueScore || 0), 0) / totalCompleted)
    : 0;

  const latestCompleted = completedAttempts[0];
  const latestBlindspot = latestCompleted?.aiAnalysisOutput?.coreBlindspot || 'None detected yet';

  const handleStartResume = (mockId: string) => {
    if (activeAttempt && activeAttempt.mockTestId === mockId) {
      navigate(`/exam/${mockId}`);
    } else {
      startExam(mockId);
      navigate(`/exam/${mockId}`);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px 80px 24px' }}>
      
      {/* Overview Analytics Header */}
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Student Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track your progress, run exams, and inspect detailed GenAI telemetry logs.</p>
      </header>

      {/* Analytics Widgets grid */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '24px', 
        marginBottom: '48px' 
      }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'var(--primary-glow)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <Award size={28} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Avg. Predicted Percentile</span>
            <h2 style={{ fontSize: '2rem', marginTop: '4px', color: 'var(--text-primary)' }}>{avgPercentile}%</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(236, 72, 153, 0.15)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <Activity size={28} style={{ color: 'var(--secondary)' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Focus Stamina Index</span>
            <h2 style={{ fontSize: '2rem', marginTop: '4px', color: 'var(--text-primary)' }}>
              {totalCompleted > 0 ? `${100 - avgFatigue}%` : 'N/A'}
            </h2>
          </div>
        </div>

        <div className="glass-panel" style={{ gridColumn: 'span 2', display: 'flex', padding: '24px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: 'var(--radius-md)', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <BookOpen size={28} style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Primary Concept Blindspot Alert</span>
            <h3 style={{ fontSize: '1.2rem', marginTop: '4px', color: 'var(--text-primary)', fontWeight: 700 }}>
              {latestBlindspot}
            </h3>
            {totalCompleted > 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Identified in your latest {latestCompleted.mockTestId.toUpperCase()} mock test. Check AI analytics roadmap for remediation.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Main Sections for Mocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        
        {/* Active / In-progress console resume */}
        {((activeAttempt && ownedMocks.some(m => m.id === activeAttempt.mockTestId)) || inProgressAttempts.length > 0) && (
          <section>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} style={{ color: 'var(--accent-amber)' }} /> In-Progress Examinations
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeAttempt && (
                <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <div>
                    <span className="badge badge-amber" style={{ marginBottom: '6px' }}>ACTIVE NOW</span>
                    <h3 style={{ fontSize: '1.2rem' }}>
                      {mocks.find(m => m.id === activeAttempt.mockTestId)?.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Started: {new Date(activeAttempt.startedAt).toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => handleStartResume(activeAttempt.mockTestId)}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, var(--accent-amber) 0%, #d97706 100%)', borderColor: 'rgba(245, 158, 11, 0.2)' }}
                  >
                    Resume Exam <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Available Mocks list */}
        <section>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} style={{ color: 'var(--primary)' }} /> Available Tests in Library
          </h2>
          {availableMocks.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '24px' 
            }}>
              {availableMocks.map(mock => (
                <div key={mock.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="badge badge-primary">{mock.examType}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{mock.configuration.totalDurationMinutes} mins</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', flex: 1 }}>{mock.title}</h3>
                  <button 
                    onClick={() => handleStartResume(mock.id)}
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    Begin Mock Test
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No available mocks in your library. Visit the <span style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/')}>Mock Store</span> to unlock premium test packs!
            </div>
          )}
        </section>

        {/* Completed Mocks Analytics */}
        <section>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} style={{ color: 'var(--accent-green)' }} /> Completed Analytics Reports
          </h2>
          {completedAttempts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {completedAttempts.map(attempt => {
                const mock = mocks.find(m => m.id === attempt.mockTestId);
                return (
                  <div key={attempt.id} className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem' }}>{mock?.title}</h3>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>Completed: {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : 'N/A'}</span>
                        <span>•</span>
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                          Percentile: {attempt.aiAnalysisOutput?.predictedPercentile}%
                        </span>
                        <span>•</span>
                        <span style={{ color: 'var(--accent-rose)' }}>
                          Fatigue Index: {attempt.aiAnalysisOutput?.fatigueScore}%
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => navigate(`/exam/${attempt.mockTestId}/analytics`)}
                      className="btn btn-secondary"
                      style={{ border: '1px solid var(--primary)', color: 'white', background: 'var(--primary-glow)' }}
                    >
                      View AI Report & Roadmap
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              You have not completed any mock exams yet. Submit an active exam to unlock the deep diagnostic AI metrics.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
