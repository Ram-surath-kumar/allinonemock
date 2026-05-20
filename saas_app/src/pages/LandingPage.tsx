import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import type { MockTest } from '../data/mockData';
import { Search, Flame, Download, Award, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: (onSuccess?: () => void) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  const { user, mocks, purchaseMock, startExam, attemptsHistory, activeAttempt } = useExam();
  const navigate = useNavigate();
  const [selectedExamType, setSelectedExamType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Checkout Modal State
  const [checkoutMock, setCheckoutMock] = useState<MockTest | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  // FOMO popup state
  const [fomoNotice, setFomoNotice] = useState<{ name: string; city: string; exam: string; time: string } | null>(null);
  const [showFomo, setShowFomo] = useState<boolean>(false);

  // FOMO notifications database
  const fomoPool = [
    { name: 'Aditya', city: 'Mumbai', exam: 'CAT Elite Mock 05', time: '3 minutes ago' },
    { name: 'Meera', city: 'Bangalore', exam: 'XAT Premium Mock Pack', time: '8 minutes ago' },
    { name: 'Rahul', city: 'New Delhi', exam: 'GMAT Focus Adaptive Mock', time: '14 minutes ago' },
    { name: 'Vikram', city: 'Chennai', exam: 'CAT 2025 Previous Year Paper', time: '1 minute ago' },
    { name: 'Sneha', city: 'Hyderabad', exam: 'XAT Premium Mock Pack', time: '22 minutes ago' },
    { name: 'Ananya', city: 'Pune', exam: 'GMAT Focus Adaptive Mock', time: '5 minutes ago' }
  ];

  useEffect(() => {
    // Show a new FOMO popup every 12 seconds
    const interval = setInterval(() => {
      const randomItem = fomoPool[Math.floor(Math.random() * fomoPool.length)];
      setFomoNotice(randomItem);
      setShowFomo(true);
      
      // Hide after 5 seconds
      setTimeout(() => {
        setShowFomo(false);
      }, 5000);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredMocks = mocks.filter(mock => {
    const matchesType = selectedExamType === 'ALL' || mock.examType === selectedExamType;
    const matchesSearch = mock.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          mock.examType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleActionClick = (mock: MockTest) => {
    if (!user) {
      onOpenLogin(() => handleActionClick(mock));
      return;
    }

    const isPurchased = user.purchasedMockPacks.includes(mock.id) || mock.price === 0;

    if (isPurchased) {
      // Check if there is an active attempt for this mock
      if (activeAttempt && activeAttempt.mockTestId === mock.id) {
        navigate(`/exam/${mock.id}`);
      } else {
        // Start a fresh mock test
        startExam(mock.id);
        navigate(`/exam/${mock.id}`);
      }
    } else {
      // Open Checkout Gateway
      setCheckoutMock(mock);
      setPaymentSuccess(false);
    }
  };

  const executeCheckout = () => {
    if (!checkoutMock) return;
    setIsProcessingPayment(true);
    
    // Simulate Razorpay/Stripe Processing delay
    setTimeout(() => {
      purchaseMock(checkoutMock.id);
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      
      // Close checkout after brief success message
      setTimeout(() => {
        setCheckoutMock(null);
      }, 1500);
    }, 2000);
  };

  const handleFreeDownload = () => {
    // Capture lead and give them the free CAT mock
    if (!user) {
      onOpenLogin(() => {
        // Successfully logged in
        purchaseMock('cat-elite-01');
        alert('CAT 2025 Paper has been unlocked and added to your dashboard! Redirecting you now...');
        navigate('/dashboard/my-mocks');
      });
    } else {
      purchaseMock('cat-elite-01');
      alert('CAT 2025 Paper has been unlocked and added to your dashboard! Redirecting you now...');
      navigate('/dashboard/my-mocks');
    }
  };

  return (
    <div style={{ paddingBottom: '80px' }} className="animate-fade-in">
      {/* Hero Container */}
      <section style={{ 
        position: 'relative', 
        padding: '80px 0 60px 0', 
        background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.12), transparent 50%)',
        overflow: 'hidden'
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <div className="badge badge-secondary" style={{ marginBottom: '20px', gap: '6px' }}>
              <Flame size={14} /> AI Cognitive Performance Suite
            </div>
            
            <h1 className="gradient-text" style={{ fontSize: '3.6rem', lineHeight: '1.15', marginBottom: '24px', fontWeight: 800 }}>
              Stop Guessing.<br/>
              Crack Your Exam with <span className="gradient-text-accent">PDF Mocks & Deep AI Analysis</span>
            </h1>
            
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px', maxWidth: '640px', marginInline: 'auto' }}>
              Drop structural PDFs, mock test files, or past year papers. Practice in realistic section-locked consoles, and analyze your speed traps and fatigue drop-offs instantly.
            </p>

            {/* Interactive Funnel Action */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '16px',
              maxWidth: '540px',
              margin: '0 auto 48px auto'
            }}>
              <div style={{ 
                display: 'flex', 
                width: '100%', 
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '8px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, paddingLeft: '12px' }}>
                  <Search size={20} style={{ color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search by Exam (CAT, XAT, GMAT...)" 
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={{ width: '100%', fontSize: '1rem' }}
                  />
                </div>
                <button 
                  onClick={handleFreeDownload}
                  className="btn btn-accent" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', whiteSpace: 'nowrap' }}
                >
                  <Download size={16} /> Get Free PYQP
                </button>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} /> Google One-Tap Authenticated instant download
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Bar */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.01)', padding: '24px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award style={{ color: 'var(--accent-cyan)' }} size={24} />
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Adaptive Scoring</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles style={{ color: 'var(--primary)' }} size={24} />
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>GenAI Cognitive Feedback</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flame style={{ color: 'var(--secondary)' }} size={24} />
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Millisecond Telemetry</span>
          </div>
        </div>
      </section>

      {/* Mock Exams Cards Grid */}
      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Curated Mock Test Series</h2>
              <p>Practice in environments matching authentic national testing consoles.</p>
            </div>
            
            {/* Filter Pill Badges */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {['ALL', 'CAT', 'XAT', 'GMAT'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedExamType(type)}
                  className="btn"
                  style={{
                    padding: '6px 16px',
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-full)',
                    background: selectedExamType === type ? 'var(--primary)' : 'rgba(255, 255, 255, 0.03)',
                    color: selectedExamType === type ? 'white' : 'var(--text-secondary)',
                    border: selectedExamType === type ? '1px solid var(--primary)' : '1px solid var(--border)'
                  }}
                >
                  {type === 'ALL' ? 'Show All' : type}
                </button>
              ))}
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '30px' 
          }}>
            {filteredMocks.map((mock) => {
              const hasAccess = user?.purchasedMockPacks.includes(mock.id) || mock.price === 0;
              const hasAttempt = attemptsHistory.some(a => a.mockTestId === mock.id && a.submittedAt);
              
              return (
                <div key={mock.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <span className={`badge ${
                      mock.examType === 'CAT' ? 'badge-primary' : 
                      mock.examType === 'XAT' ? 'badge-secondary' : 
                      'badge-cyan'
                    }`}>
                      {mock.examType}
                    </span>
                    
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: mock.price === 0 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                      {mock.price === 0 ? 'FREE' : `$${mock.price}`}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', minHeight: '50px' }}>{mock.title}</h3>
                  
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Duration:</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{mock.configuration.totalDurationMinutes} mins</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Sections:</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{mock.configuration.sections.length} Locked Sections</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Marking Rules:</span>
                      <span style={{ fontWeight: 600, color: 'var(--accent-rose)' }}>
                        +{mock.configuration.markingScheme.correct} / {mock.configuration.markingScheme.incorrect}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => handleActionClick(mock)}
                      className={`btn ${hasAccess ? 'btn-primary' : 'btn-accent'}`} 
                      style={{ flex: 1, fontSize: '0.9rem', padding: '10px' }}
                    >
                      {hasAccess ? (
                        activeAttempt && activeAttempt.mockTestId === mock.id ? 'Resume Exam' : 'Start Exam'
                      ) : 'Unlock Now'}
                    </button>
                    {hasAttempt && (
                      <button 
                        onClick={() => {
                          const latest = attemptsHistory.find(a => a.mockTestId === mock.id && a.submittedAt);
                          if (latest) navigate(`/exam/${mock.id}/analytics`);
                        }}
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.9rem', padding: '10px' }}
                      >
                        Reports
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredMocks.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                No exams matching "{searchQuery}" were found.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOMO Popup (Bottom-Left) */}
      {showFomo && fomoNotice && (
        <div className="fomo-popup glass-panel-elevated" style={{ borderLeft: '3px solid var(--primary)' }}>
          <div style={{ background: 'var(--primary-glow)', padding: '8px', borderRadius: '50%' }}>
            <Award size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fomoNotice.time}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {fomoNotice.name} from {fomoNotice.city}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              unlocked <span style={{ color: 'var(--accent-cyan)' }}>{fomoNotice.exam}</span>
            </p>
          </div>
        </div>
      )}

      {/* Simulated Premium Checkout Modal */}
      {checkoutMock && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel-elevated">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }} className="gradient-text-accent">
              SchoolSphere Checkout Gate
            </h3>
            
            {paymentSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }} className="animate-fade-in">
                <CheckCircle size={56} style={{ color: 'var(--accent-green)', marginBottom: '16px', filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.3))' }} />
                <h4 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Payment Approved!</h4>
                <p>Mock pack has been successfully added to your account library.</p>
              </div>
            ) : (
              <div>
                <p style={{ marginBottom: '20px' }}>
                  You are unlocking secure lifetime access to <strong style={{ color: 'var(--text-primary)' }}>{checkoutMock.title}</strong>.
                </p>

                <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Mock Test Pack:</span>
                    <span style={{ fontWeight: 600 }}>{checkoutMock.title}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '10px', fontWeight: 700 }}>
                    <span>Total Amount:</span>
                    <span style={{ color: 'var(--accent-cyan)' }}>${checkoutMock.price}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px', alignItems: 'center' }}>
                  <AlertCircle size={16} style={{ color: 'var(--primary)' }} />
                  <span>Simulated Razorpay & Stripe pipeline test. Do not enter real cards.</span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setCheckoutMock(null)}
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                    disabled={isProcessingPayment}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeCheckout}
                    className="btn btn-primary" 
                    style={{ flex: 2 }}
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? 'Securing Transaction...' : 'Pay Simulated Price'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
