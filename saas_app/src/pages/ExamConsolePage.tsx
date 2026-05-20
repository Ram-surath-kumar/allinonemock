import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { Clock, Flag, ArrowLeft, ArrowRight, ShieldAlert, BookOpen } from 'lucide-react';

export const ExamConsolePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    user, 
    mocks, 
    activeAttempt, 
    activeSectionIndex, 
    sectionTimeRemaining, 
    updateResponse, 
    toggleMarkForReview, 
    changeSection,
    incrementTimeSpentOnActiveQuestion,
    submitExam 
  } = useExam();

  const mock = mocks.find(m => m.id === id);
  const activeSection = mock?.configuration.sections[activeSectionIndex];
  
  // Local state for selected question number in the active section
  const [activeQuestionNumber, setActiveQuestionNumber] = useState<number>(1);

  // Sync active question to the start of the active section when section changes
  useEffect(() => {
    if (activeSection) {
      setActiveQuestionNumber(activeSection.questionRange.start);
    }
  }, [activeSectionIndex]);

  // Telemetry time counter: increment time spent on active question every second
  useEffect(() => {
    if (!activeAttempt || !mock) return;

    const interval = setInterval(() => {
      incrementTimeSpentOnActiveQuestion(activeQuestionNumber);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeAttempt, activeQuestionNumber, id]);

  if (!user || !activeAttempt || !mock || !activeSection) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
          <ShieldAlert size={48} style={{ color: 'var(--accent-rose)', marginBottom: '16px' }} />
          <h2 style={{ marginBottom: '12px' }}>No Active Exam Session</h2>
          <p style={{ marginBottom: '24px' }}>Please go to your dashboard to launch or resume an exam.</p>
          <button onClick={() => navigate('/dashboard/my-mocks')} className="btn btn-primary">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  const responses = activeAttempt.rawResponses;
  const activeResponse = responses.find(r => r.questionNumber === activeQuestionNumber);

  // Format Time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (option: string) => {
    updateResponse(activeQuestionNumber, option);
  };

  const handleNext = () => {
    if (activeQuestionNumber < activeSection.questionRange.end) {
      setActiveQuestionNumber(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeQuestionNumber > activeSection.questionRange.start) {
      setActiveQuestionNumber(prev => prev - 1);
    }
  };

  const handleMarkReview = () => {
    toggleMarkForReview(activeQuestionNumber);
  };

  const handleClear = () => {
    updateResponse(activeQuestionNumber, '');
  };

  const handleSubmitSection = () => {
    const isLastSection = activeSectionIndex === mock.configuration.sections.length - 1;
    if (isLastSection) {
      if (confirm('Are you sure you want to submit your final answers and end the test? This will trigger the AI Performance Report.')) {
        submitExam();
        navigate(`/exam/${mock.id}/analytics`);
      }
    } else {
      if (confirm('Are you sure you want to lock and submit this section? You CANNOT go back to this section later.')) {
        changeSection(activeSectionIndex + 1);
      }
    }
  };

  // Helper to render simulated PDF text & passage for questions
  const getSimulatedQuestionText = (num: number) => {
    // We can generate context-specific content based on the mock data key's cognitive tags
    const ansKey = mock.answerKey.find(k => k.questionNumber === num);
    const tag = ansKey?.cognitiveTag || '';
    
    if (tag.includes('Reading Comprehension')) {
      return {
        passage: "Passage Context (Simulated PDF Page excerpt):\n\n\"The paradigm shift in digital pedagogy of the mid-2020s resulted in a modular cognitive model of knowledge acquisition. In particular, standardized testing frameworks had to navigate the tension between static, linear, question-by-question evaluations and dynamic, adaptive, flow-based telemetry. Research indicates that focus degradation (fatigue mapping) accelerates exponentially past the 90-minute milestone of continuous high-stakes testing. Further, cognitive speed traps occur when aspirants fixate on early complex items, creating structural back-pressures that compress timing vectors for late-stage critical reasoning...\"",
        question: `Question ${num}: Based on the passage, the author's primary attitude towards static, linear testing frameworks can be characterized as:`,
        options: [
          'A) Uncritically supportive of their historical reliability in national filters.',
          'B) Critically skeptical, highlighting their failure to evaluate telemetry flow and fatigue metrics.',
          'C) Mildly indifferent, favoring hybrid structures with traditional paper booklets.',
          'D) Strongly hostile, suggesting immediate deregulation of all admission curves.'
        ]
      };
    } else if (tag.includes('Decision Making')) {
      return {
        passage: "Case Study Fragment (Simulated PDF Page excerpt):\n\n\"TechCorp is an enterprise educational systems developer experiencing high client attrition after migrating accounts to the new Vibe-Code AntiGravity framework. Client admins report that while the user-facing interfaces look remarkably premium, the administration settings panel feels hidden, and metadata spreadsheet imports routinely trigger schema drift exceptions. The CEO demands a rollout rollback, but the Lead Engineer insists that a 48-hour patching iteration will resolve the telemetry ingestion pipeline bugs. The Product Director must choose the next strategic sprint...\"",
        question: `Question ${num}: Which of the following is the most logically balanced option for the Product Director to propose to stakeholders?`,
        options: [
          'A) Roll back completely to the old database schema to appease client admins immediately.',
          'B) Approve the Lead Engineer\'s 48-hour patching iteration while setting up active live support lines for top clients.',
          'C) Fire the Lead Engineer for creating system instability and initiate a vendor audit.',
          'D) Ignore client admin complaints and launch an aggressive marketing campaign focusing on visual changes.'
        ]
      };
    } else if (tag.includes('Algebra') || tag.includes('Quant') || tag.includes('Arithmetic') || tag.includes('Geometry')) {
      return {
        passage: "Quantitative Reference Schema (Simulated PDF Page excerpt):\n\nLet f(x) be a quadratic function such that f(2) = 4 and f(-1) = 1. Assume log_b(f(x)) is defined for all x > 1. Let the base coefficients satisfy inverse proportions under the sequence limits...\n",
        question: `Question ${num} (Algebra/Quant Vector): Find the sum of all integer values of b that satisfy the base coefficient inequalities given the inverse parameter limits:`,
        options: [
          'A) 14',
          'B) 27',
          'C) 9',
          'D) 5'
        ]
      };
    } else {
      return {
        passage: "Structural Analysis Frame (Simulated PDF Page excerpt):\n\n[DIAGRAM: Matrix Grid mapping logical pathways along columns A-D across levels 1-5]\nData Analysis vectors show a 40% performance density variance under continuous verbal examination time slices.",
        question: `Question ${num}: Select the correct logical deduction or missing numerical sequence value matching the matrix parameters:`,
        options: [
          'A) Pattern Value: 124',
          'B) Pattern Value: 89',
          'C) Pattern Value: 210',
          'D) Pattern Value: 312'
        ]
      };
    }
  };

  const qDetails = getSimulatedQuestionText(activeQuestionNumber);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'var(--bg-dark)', 
      zIndex: 500, 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      {/* Console Top Header */}
      <header style={{ 
        height: '60px', 
        background: 'var(--bg-surface)', 
        borderBottom: '1px solid var(--border)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0 24px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BookOpen style={{ color: 'var(--primary)' }} size={24} />
          <h2 style={{ fontSize: '1.15rem' }}>{mock.title}</h2>
          <span className="badge badge-primary">{mock.examType} Console</span>
        </div>

        {/* Section List (Locked Indicator) */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {mock.configuration.sections.map((sec, idx) => (
            <span 
              key={sec.sectionName}
              className={`badge ${
                idx === activeSectionIndex 
                  ? 'badge-secondary' 
                  : idx < activeSectionIndex 
                    ? 'badge-green' 
                    : 'badge-primary'
              }`}
              style={{ opacity: idx < activeSectionIndex ? 0.6 : 1, fontSize: '0.7rem' }}
            >
              {sec.sectionName.split(' ')[0]} {idx < activeSectionIndex ? '✓' : ''}
            </span>
          ))}
        </div>

        {/* Timer Node */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          background: 'rgba(236, 72, 153, 0.15)', 
          padding: '6px 14px', 
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          color: 'var(--secondary)',
          fontWeight: 700,
          fontFamily: 'monospace',
          fontSize: '1.1rem'
        }}>
          <Clock size={16} />
          <span>{formatTime(sectionTimeRemaining)}</span>
        </div>
      </header>

      {/* Main Console Grid */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Side: Question PDF Simulator */}
        <div style={{ 
          flex: 3, 
          borderRight: '1px solid var(--border)', 
          padding: '24px', 
          overflowY: 'auto',
          background: '#0c0e16'
        }}>
          <div className="glass-panel" style={{ 
            padding: '30px', 
            minHeight: '100%', 
            border: '1px dashed rgba(255, 255, 255, 0.1)', 
            background: 'rgba(10, 12, 20, 0.95)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px', color: 'var(--text-secondary)' }}>
              <span>SECURED EXAMINATION PDF CONTEXT</span>
              <span>SECTION Q.{activeQuestionNumber}</span>
            </div>

            {qDetails.passage && (
              <pre style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                padding: '16px', 
                borderRadius: 'var(--radius-sm)', 
                marginBottom: '24px', 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'var(--font-body)', 
                fontSize: '0.9rem',
                lineHeight: '1.6',
                borderLeft: '2px solid var(--primary)',
                color: 'var(--text-secondary)'
              }}>
                {qDetails.passage}
              </pre>
            )}

            <h3 style={{ fontSize: '1.15rem', marginBottom: '24px', fontWeight: 600, lineHeight: '1.5' }}>
              {qDetails.question}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {qDetails.options.map(opt => {
                const optLetter = opt.charAt(0);
                const isSelected = activeResponse?.selectedOption === optLetter;
                return (
                  <div 
                    key={opt}
                    onClick={() => handleOptionSelect(optLetter)}
                    style={{ 
                      padding: '14px 18px', 
                      borderRadius: 'var(--radius-md)', 
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                    onMouseOver={(e) => { if(!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                    onMouseOut={(e) => { if(!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <div style={{ 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--text-muted)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                      background: isSelected ? 'var(--primary-glow)' : 'transparent'
                    }}>
                      {isSelected && '✓'}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{opt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Navigation Grid & Option sheet */}
        <div style={{ 
          flex: 1, 
          background: 'var(--bg-surface)', 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflowY: 'auto'
        }}>
          {/* Legend and Question Grid */}
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question Matrix</h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '10px', 
              marginBottom: '24px' 
            }}>
              {Array.from(
                { length: activeSection.questionRange.end - activeSection.questionRange.start + 1 }, 
                (_, i) => activeSection.questionRange.start + i
              ).map(num => {
                const resp = responses.find(r => r.questionNumber === num);
                const isSelected = resp?.selectedOption !== '';
                const isMarked = resp?.isMarkedForReview;
                const isActive = num === activeQuestionNumber;

                let bg = 'rgba(255, 255, 255, 0.03)';
                let border = '1px solid var(--border)';
                let color = 'var(--text-secondary)';

                if (isActive) {
                  bg = 'var(--primary-glow)';
                  border = '2px solid var(--primary)';
                  color = 'var(--text-primary)';
                } else if (isMarked) {
                  bg = 'rgba(245, 158, 11, 0.15)';
                  border = '1px solid var(--accent-amber)';
                  color = 'var(--accent-amber)';
                } else if (isSelected) {
                  bg = 'rgba(16, 185, 129, 0.15)';
                  border = '1px solid var(--accent-green)';
                  color = 'var(--accent-green)';
                }

                return (
                  <button
                    key={num}
                    onClick={() => setActiveQuestionNumber(num)}
                    style={{
                      height: '42px',
                      borderRadius: 'var(--radius-sm)',
                      background: bg,
                      border: border,
                      color: color,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            {/* Bubble Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--accent-green)' }}></div>
                <span>Answered</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid var(--accent-amber)' }}></div>
                <span>Marked for Review</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}></div>
                <span>Unattempted</span>
              </div>
            </div>
          </div>

          {/* Action Row Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleMarkReview}
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', background: activeResponse?.isMarkedForReview ? 'rgba(245,158,11,0.15)' : 'none', borderColor: activeResponse?.isMarkedForReview ? 'var(--accent-amber)' : 'var(--border)' }}
              >
                <Flag size={14} style={{ color: activeResponse?.isMarkedForReview ? 'var(--accent-amber)' : 'inherit' }} /> {activeResponse?.isMarkedForReview ? 'Flagged' : 'Flag Review'}
              </button>
              <button 
                onClick={handleClear}
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
              >
                Clear Answer
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handlePrev}
                className="btn btn-secondary" 
                style={{ padding: '10px', flex: 1 }}
                disabled={activeQuestionNumber === activeSection.questionRange.start}
              >
                <ArrowLeft size={16} /> Prev
              </button>
              
              {activeQuestionNumber < activeSection.questionRange.end ? (
                <button 
                  onClick={handleNext}
                  className="btn btn-primary" 
                  style={{ padding: '10px', flex: 2 }}
                >
                  Save & Next <ArrowRight size={16} />
                </button>
              ) : (
                <button 
                  onClick={handleSubmitSection}
                  className="btn" 
                  style={{ 
                    padding: '10px', 
                    flex: 2, 
                    background: 'linear-gradient(135deg, var(--accent-green) 0%, #059669 100%)', 
                    color: 'white' 
                  }}
                >
                  {activeSectionIndex === mock.configuration.sections.length - 1 ? 'Submit Mock' : 'Submit Section'}
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
