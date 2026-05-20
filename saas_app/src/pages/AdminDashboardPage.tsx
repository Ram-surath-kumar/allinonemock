import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import type { MockTest, Section, AnswerKeyEntry } from '../data/mockData';
import { ShieldCheck, Settings, Upload, Database, ArrowLeft } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user, mocks, addCustomMock } = useExam();
  const navigate = useNavigate();

  // Redirect if not superadmin
  if (!user || user.role !== 'SUPERADMIN') {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ color: 'var(--accent-rose)', marginBottom: '12px' }}>Access Denied</h2>
          <p style={{ marginBottom: '24px' }}>Only authorized administrators are permitted to enter this panel.</p>
          <button onClick={() => navigate('/admin/login')} className="btn btn-primary">Go to Admin Login</button>
        </div>
      </div>
    );
  }

  // Local Form state for creating custom Mock
  const [title, setTitle] = useState<string>('SNAP Elite practice Set 01');
  const [examType, setExamType] = useState<'CAT' | 'XAT' | 'GMAT' | 'NMAT' | 'SNAP' | 'BANK'>('SNAP');
  const [price, setPrice] = useState<number>(19.99);
  const [totalDuration, setTotalDuration] = useState<number>(60);
  const [correctScore, setCorrectScore] = useState<number>(1);
  const [incorrectScore, setIncorrectScore] = useState<number>(-0.25);
  
  // Section configurations
  const [sectionsText, setSectionsText] = useState<string>(
    JSON.stringify([
      { "sectionName": "General English", "allowedTimeMinutes": 20, "questionRange": { "start": 1, "end": 5 } },
      { "sectionName": "Analytical & Logical Reasoning", "allowedTimeMinutes": 20, "questionRange": { "start": 6, "end": 10 } },
      { "sectionName": "Quantitative & Data Sufficiency", "allowedTimeMinutes": 20, "questionRange": { "start": 11, "end": 15 } }
    ], null, 2)
  );

  // Metadata Answer Key
  const [metadataText, setMetadataText] = useState<string>(
    JSON.stringify([
      { "questionNumber": 1, "correctOption": "A", "cognitiveTag": "Verbal Ability - Synonyms" },
      { "questionNumber": 2, "correctOption": "C", "cognitiveTag": "Verbal Ability - Parajumbles" },
      { "questionNumber": 3, "correctOption": "B", "cognitiveTag": "Reading Comprehension - Tone" },
      { "questionNumber": 4, "correctOption": "D", "cognitiveTag": "Verbal Ability - Grammar" },
      { "questionNumber": 5, "correctOption": "A", "cognitiveTag": "Verbal Ability - Idioms" },
      { "questionNumber": 6, "correctOption": "B", "cognitiveTag": "Logical Reasoning - Coding" },
      { "questionNumber": 7, "correctOption": "D", "cognitiveTag": "Logical Reasoning - Blood Relations" },
      { "questionNumber": 8, "correctOption": "C", "cognitiveTag": "Logical Reasoning - Direction Sense" },
      { "questionNumber": 9, "correctOption": "A", "cognitiveTag": "Logical Reasoning - Series Completion" },
      { "questionNumber": 10, "correctOption": "B", "cognitiveTag": "Logical Reasoning - Seating Arrangement" },
      { "questionNumber": 11, "correctOption": "C", "cognitiveTag": "Arithmetic - Percentages" },
      { "questionNumber": 12, "correctOption": "A", "cognitiveTag": "Algebra - Linear Equations" },
      { "questionNumber": 13, "correctOption": "B", "cognitiveTag": "Arithmetic - Profit & Loss" },
      { "questionNumber": 14, "correctOption": "D", "cognitiveTag": "Geometry - Mensuration" },
      { "questionNumber": 15, "correctOption": "C", "cognitiveTag": "Data Interpretation - Tables" }
    ], null, 2)
  );

  // PDF Simulator states
  const [pdfFileSelected, setPdfFileSelected] = useState<boolean>(false);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  
  const [deploySuccess, setDeploySuccess] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  const handlePdfUploadClick = () => {
    // Simulate drop or select
    setPdfFileName(`snap_mock_series_2026_${examType.toLowerCase()}.pdf`);
    setPdfFileSelected(true);
  };

  const handleAutoPopulate = () => {
    // Populate templates based on type
    if (examType === 'BANK') {
      setTitle('SBI PO Foundation Mock 02');
      setTotalDuration(60);
      setCorrectScore(1);
      setIncorrectScore(-0.25);
      setPrice(9.99);
      setSectionsText(JSON.stringify([
        { "sectionName": "English Language", "allowedTimeMinutes": 20, "questionRange": { "start": 1, "end": 5 } },
        { "sectionName": "Quantitative Aptitude", "allowedTimeMinutes": 20, "questionRange": { "start": 6, "end": 10 } },
        { "sectionName": "Reasoning Ability", "allowedTimeMinutes": 20, "questionRange": { "start": 11, "end": 15 } }
      ], null, 2));
    } else {
      setTitle(`${examType} Elite practice Set 01`);
      setTotalDuration(60);
      setCorrectScore(1);
      setIncorrectScore(-0.25);
    }
  };

  const handleDeployExam = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setDeploySuccess(false);

    if (!pdfFileSelected) {
      setValidationError('PDF Ingestion Error: Please select/drag a structural question PDF first.');
      return;
    }

    try {
      const parsedSections: Section[] = JSON.parse(sectionsText);
      const parsedKey: AnswerKeyEntry[] = JSON.parse(metadataText);

      // Validate schemas
      if (!Array.isArray(parsedSections) || parsedSections.length === 0) {
        throw new Error('Sections metadata must be a non-empty array.');
      }
      if (!Array.isArray(parsedKey) || parsedKey.length === 0) {
        throw new Error('Answer Key metadata must be a non-empty array.');
      }

      // Build target object
      const customId = `${examType.toLowerCase()}-custom-${Date.now()}`;
      const newMock: MockTest = {
        id: customId,
        title,
        examType,
        price: parseFloat(price.toString()),
        isFreePYQP: price === 0,
        pdfSourceUrl: 'https://schoolsphere-assets.s3.amazonaws.com/custom_mocks/' + pdfFileName,
        configuration: {
          totalDurationMinutes: parseInt(totalDuration.toString(), 10),
          markingScheme: {
            correct: parseFloat(correctScore.toString()),
            incorrect: parseFloat(incorrectScore.toString())
          },
          sections: parsedSections
        },
        answerKey: parsedKey
      };

      addCustomMock(newMock);
      setDeploySuccess(true);
      
      // Reset form variables partially
      setTimeout(() => {
        setDeploySuccess(false);
      }, 3000);

    } catch (err: any) {
      setValidationError(`Metadata Schema Parse Exception: ${err.message}`);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px 80px 24px' }}>
      
      {/* Header Desk */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <button 
            onClick={() => navigate('/dashboard/my-mocks')}
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.85rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 style={{ fontSize: '2.2rem', display: 'flex', alignItems: 'center', gap: '12px' }} className="gradient-text">
            <ShieldCheck style={{ color: 'var(--accent-amber)' }} size={36} /> Admin Command Console
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Ingest new exam structures, adjust locks, and deploy live mocks directly to users.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
        
        {/* Left Column: Form & Configurator */}
        <div>
          <form onSubmit={handleDeployExam} className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <Settings size={20} style={{ color: 'var(--primary)' }} /> 1. Dynamic Rules Configurator
            </h3>

            {deploySuccess && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', borderLeft: '4px solid var(--accent-green)', padding: '16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                <strong>Success!</strong> Mock test deployed successfully and updated in global store.
              </div>
            )}

            {validationError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', borderLeft: '4px solid var(--accent-rose)', padding: '16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                <strong>Deployment Failure:</strong> {validationError}
              </div>
            )}

            {/* Basic Variables row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Mock Series Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Target Exam Type</label>
                <select 
                  className="form-input" 
                  value={examType} 
                  onChange={(e) => setExamType(e.target.value as any)}
                  style={{ background: 'var(--bg-surface-elevated)' }}
                >
                  {['CAT', 'XAT', 'GMAT', 'NMAT', 'SNAP', 'BANK'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Metadata Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Price ($)</label>
                <input type="number" step="0.01" className="form-input" value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Duration (min)</label>
                <input type="number" className="form-input" value={totalDuration} onChange={(e) => setTotalDuration(parseInt(e.target.value))} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Correct Weight</label>
                <input type="number" step="0.25" className="form-input" value={correctScore} onChange={(e) => setCorrectScore(parseFloat(e.target.value))} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Penalty Weight</label>
                <input type="number" step="0.05" className="form-input" value={incorrectScore} onChange={(e) => setIncorrectScore(parseFloat(e.target.value))} required />
              </div>
            </div>

            <button 
              type="button" 
              onClick={handleAutoPopulate}
              className="btn btn-secondary" 
              style={{ alignSelf: 'flex-start', padding: '6px 14px', fontSize: '0.75rem', display: 'flex', gap: '4px' }}
            >
              <Database size={12} /> Auto-Populate Exam Variables
            </button>

            {/* Sections Configuration JSON */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Sections locked Parameters (JSON metadata schema)</label>
              <textarea 
                className="form-input" 
                style={{ fontFamily: 'monospace', fontSize: '0.8rem', minHeight: '120px', resize: 'vertical' }}
                value={sectionsText}
                onChange={(e) => setSectionsText(e.target.value)}
                required
              />
            </div>

            {/* Answer Key metadata */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Question Option Mapping (JSON spreadsheet data)</label>
              <textarea 
                className="form-input" 
                style={{ fontFamily: 'monospace', fontSize: '0.8rem', minHeight: '180px', resize: 'vertical' }}
                value={metadataText}
                onChange={(e) => setMetadataText(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Deploy Live Interactive Exam Package
            </button>
          </form>
        </div>

        {/* Right Column: PDF Ingestion Engine */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Ingestion Area */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
              <Upload size={20} style={{ color: 'var(--accent-cyan)' }} /> 2. PDF Ingestion Core
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Drop or drag the raw structural PDF question paper here. AntiGravity instantly registers the schema bounds.
            </p>

            <div 
              onClick={handlePdfUploadClick}
              style={{ 
                border: '2px dashed rgba(6, 182, 212, 0.3)', 
                background: 'rgba(6, 182, 212, 0.02)', 
                padding: '40px 24px', 
                borderRadius: 'var(--radius-lg)', 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)'}
            >
              <Upload size={40} style={{ color: 'var(--accent-cyan)', marginBottom: '12px' }} />
              {pdfFileSelected ? (
                <div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{pdfFileName}</strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--accent-green)', marginTop: '4px' }}>PDF ingested & aligned with metadata mapping.</p>
                </div>
              ) : (
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Upload Exam PDF File</strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Supports direct vector layouts or scanned documents</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Mocks Overview */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
              <Database size={18} style={{ color: 'var(--accent-green)' }} /> Active Mock Catalog ({mocks.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto' }}>
              {mocks.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{m.title}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ID: {m.id} • {m.configuration.sections.length} Secs</span>
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{m.examType}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
