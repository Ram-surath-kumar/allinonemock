import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { Award, Zap, AlertTriangle, Battery, ShieldCheck, ArrowLeft, RefreshCw, BarChart } from 'lucide-react';

export const AIAnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { attemptsHistory, mocks } = useExam();

  // Find the latest completed attempt for this mock
  const attempt = attemptsHistory.find(a => a.mockTestId === id && a.submittedAt !== null);
  const mock = mocks.find(m => m.id === id);

  if (!attempt || !mock || !attempt.aiAnalysisOutput) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
          <AlertTriangle size={48} style={{ color: 'var(--accent-amber)', marginBottom: '16px' }} />
          <h2 style={{ marginBottom: '12px' }}>Analytics Data Unavailable</h2>
          <p style={{ marginBottom: '24px' }}>Please complete the mock test first to generate AI telemetry logs.</p>
          <button onClick={() => navigate('/dashboard/my-mocks')} className="btn btn-primary">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  const ai = attempt.aiAnalysisOutput;

  // Calculate high level summaries
  const totalQuestions = attempt.rawResponses.length;
  let correctTotal = 0;
  let wrongTotal = 0;
  let unattemptedTotal = 0;

  ai.sectionBreakdowns.forEach(s => {
    correctTotal += s.correctCount;
    wrongTotal += s.wrongCount;
    unattemptedTotal += s.unattemptedCount;
  });

  const overallAccuracy = totalQuestions > 0 ? Math.round((correctTotal / totalQuestions) * 100) : 0;

  // Generate synthetic coordinates for the SVG Fatigue Curve Graph
  // Base it on the fatigue score to represent the curve bending downwards
  const fatigue = ai.fatigueScore;
  const initialValue = 90;
  const midValue = Math.max(40, 95 - fatigue * 0.4);
  const finalValue = Math.max(20, 95 - fatigue * 0.9);
  const points = `10,${100 - initialValue} 150,${100 - (initialValue - 10)} 300,${100 - midValue} 450,${100 - (midValue - 15)} 600,${100 - finalValue}`;

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px 80px 24px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <button 
            onClick={() => navigate('/dashboard/my-mocks')}
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.85rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 style={{ fontSize: '2.2rem' }} className="gradient-text">GenAI Performance Diagnostic</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Reviewing {mock.title} telemetry maps.</p>
        </div>

        <button 
          onClick={() => {
            if (confirm('Do you want to re-run this mock exam to record new telemetry?')) {
              navigate(`/exam/${mock.id}`);
            }
          }}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', padding: '10px 18px' }}
        >
          <RefreshCw size={14} /> Re-Attempt Test
        </button>
      </div>

      {/* Main Grid: Core AI Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Row 1: Predictive Percentile & Stamina Gauge */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
          gap: '30px' 
        }}>
          
          {/* Card 1: Predictive Score Matrixing */}
          <div className="glass-panel" style={{ padding: '30px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Award style={{ color: 'var(--primary)' }} size={24} />
              <h3 style={{ fontSize: '1.2rem' }}>Predictive Score Percentile</h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
              <span className="gradient-text-accent" style={{ fontSize: '4rem', fontWeight: 800 }}>{ai.predictedPercentile}</span>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>percentile</span>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Your telemetry profile predicts a stable entrance score with a variance of <span style={{ color: 'var(--accent-cyan)' }}>±1.2%</span>.
            </p>

            {/* Custom SVG Percentile variance bar slider */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>Min: {ai.percentileMin}%</span>
                <span>Max: {ai.percentileMax}%</span>
              </div>
              <div style={{ position: 'relative', height: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: '5px', overflow: 'hidden' }}>
                {/* Active variance bar */}
                <div style={{ 
                  position: 'absolute', 
                  left: `${Math.max(0, ai.percentileMin - 20)}%`, 
                  right: `${100 - Math.min(100, ai.percentileMax)}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent-cyan) 100%)',
                  borderRadius: '5px'
                }}></div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>NATIONAL COMPETITIVE PROBABILITY MAP</span>
              </div>
            </div>
          </div>

          {/* Card 2: Fatigue Modeling */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Battery style={{ color: 'var(--secondary)' }} size={24} />
              <h3 style={{ fontSize: '1.2rem' }}>Cross-Section Fatigue Curve</h3>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{ai.fatigueScore}%</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>Focus Attrition</span>
              </div>
              <span className={`badge ${ai.fatigueScore > 50 ? 'badge-secondary' : 'badge-green'}`}>
                {ai.fatigueScore > 50 ? 'Stamina Warning' : 'Stamina Stable'}
              </span>
            </div>

            {/* Custom SVG line chart for fatigue curve */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '12px' }}>
              <svg viewBox="0 0 600 100" style={{ width: '100%', height: '60px' }}>
                <defs>
                  <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                {/* Background Grid */}
                <line x1="0" y1="25" x2="600" y2="25" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="50" x2="600" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="75" x2="600" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                {/* Area Gradient */}
                <path d={`M10,100 L${points.replace(/,/g, ' ')} L600,100 Z`} fill="url(#curveGrad)" />
                {/* Trend line */}
                <polyline fill="none" stroke="var(--secondary)" strokeWidth="3" points={points} />
                {/* Dots */}
                <circle cx="10" cy={100 - initialValue} r="4" fill="white" />
                <circle cx="300" cy={100 - midValue} r="4" fill="white" />
                <circle cx="600" cy={100 - finalValue} r="4" fill="white" />
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>Minute 1</span>
                <span>Minute 60</span>
                <span>Minute 120</span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {ai.fatigueScore > 50 
                ? "Your accuracy drops by 40% in the final 15 minutes of verbal sections due to cognitive stamina exhaustion. Try taking 30-second breathing intervals between sections."
                : "Your stamina profile remains optimal. Cognitive fatigue is well managed throughout the test timeline."}
            </p>
          </div>

        </div>

        {/* Row 2: Velocity Vectoring & Concept Blindspots */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
          gap: '30px' 
        }}>
          
          {/* Card 3: Time-vs-Difficulty Velocity Vectoring */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Zap style={{ color: 'var(--accent-cyan)' }} size={24} />
              <h3 style={{ fontSize: '1.2rem' }}>Velocity & Pacing Vectoring</h3>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(244, 63, 94, 0.06)', padding: '12px', borderRadius: 'var(--radius-md)', flex: 1, textAlign: 'center', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Speed Traps</span>
                <h4 style={{ fontSize: '1.6rem', color: 'var(--accent-rose)', marginTop: '4px', fontWeight: 800 }}>{ai.speedTrapCount}</h4>
              </div>
              <div style={{ background: 'rgba(6, 182, 212, 0.06)', padding: '12px', borderRadius: 'var(--radius-md)', flex: 1, textAlign: 'center', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Avg Pacing</span>
                <h4 style={{ fontSize: '1.6rem', color: 'var(--accent-cyan)', marginTop: '4px', fontWeight: 800 }}>
                  {Math.round(attempt.rawResponses.reduce((acc, c) => acc + c.timeSpentSeconds, 0) / attempt.rawResponses.length)}s
                </h4>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.06)', padding: '12px', borderRadius: 'var(--radius-md)', flex: 1, textAlign: 'center', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Accuracy</span>
                <h4 style={{ fontSize: '1.6rem', color: 'var(--accent-green)', marginTop: '4px', fontWeight: 800 }}>{overallAccuracy}%</h4>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', borderLeft: '3px solid var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.03)' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '6px', fontWeight: 600 }}>Remediation Recommendation</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {ai.velocityRecommendation}
              </p>
            </div>
          </div>

          {/* Card 4: Contextual Cognitive Mapping */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <AlertTriangle style={{ color: 'var(--accent-amber)' }} size={24} />
              <h3 style={{ fontSize: '1.2rem' }}>Contextual Cognitive Blindspots</h3>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.15)', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary point of failure</span>
              <h4 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700, marginTop: '4px' }}>
                {ai.coreBlindspot}
              </h4>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              The semantic cross-referencing analyzer confirms you fail most frequently when addressing: <strong style={{ color: 'white' }}>{ai.coreBlindspot}</strong>.
            </p>

            {/* Simulated Concept checklist mapping */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--accent-green)' }} />
                <span>Foundational rules: <strong style={{color:'var(--accent-green)'}}>Strong</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--accent-green)' }} />
                <span>Base operations under pressure: <strong style={{color:'var(--accent-green)'}}>Stable</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={16} style={{ color: 'var(--accent-amber)' }} />
                <span>Advanced inversion operations: <strong style={{color:'var(--accent-amber)'}}>Deficient</strong></span>
              </div>
            </div>
          </div>

        </div>

        {/* Section Breakdowns Table */}
        <section className="glass-panel" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <BarChart style={{ color: 'var(--primary)' }} size={24} />
            <h3 style={{ fontSize: '1.25rem' }}>Section-by-Section Telemetry Details</h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px' }}>Section Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Correct</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Wrong</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Unattempted</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Avg Speed</th>
                </tr>
              </thead>
              <tbody>
                {ai.sectionBreakdowns.map((section) => (
                  <tr key={section.sectionName} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{section.sectionName}</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: 'var(--accent-green)', fontWeight: 700 }}>{section.correctCount}</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: 'var(--accent-rose)', fontWeight: 700 }}>{section.wrongCount}</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>{section.unattemptedCount}</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: 'var(--accent-cyan)', fontWeight: 700 }}>{section.averageTimePerQuestion}s / Q</td>
                  </tr>
                ))}
                
                {/* Aggregate Row */}
                <tr style={{ background: 'rgba(255,255,255,0.01)', fontWeight: 700 }}>
                  <td style={{ padding: '16px' }}>Overall Summary</td>
                  <td style={{ padding: '16px', textAlign: 'center', color: 'var(--accent-green)' }}>{correctTotal}</td>
                  <td style={{ padding: '16px', textAlign: 'center', color: 'var(--accent-rose)' }}>{wrongTotal}</td>
                  <td style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>{unattemptedTotal}</td>
                  <td style={{ padding: '16px', textAlign: 'center', color: 'var(--accent-cyan)' }}>
                    {Math.round(ai.sectionBreakdowns.reduce((acc, s) => acc + s.averageTimePerQuestion, 0) / ai.sectionBreakdowns.length)}s / Q
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
};
