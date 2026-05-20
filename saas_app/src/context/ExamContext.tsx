import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_TESTS } from '../data/mockData';
import type { MockTest, AttemptRecord, ResponseTelemetry } from '../data/mockData';
import { supabase } from '../utils/supabaseClient';

interface User {
  id: string;
  email: string;
  role: 'STUDENT' | 'SUPERADMIN';
  purchasedMockPacks: string[];
}

interface ExamContextType {
  user: User | null;
  mocks: MockTest[];
  activeAttempt: AttemptRecord | null;
  attemptsHistory: AttemptRecord[];
  activeSectionIndex: number;
  sectionTimeRemaining: number;
  login: (email: string, role: 'STUDENT' | 'SUPERADMIN') => void;
  logout: () => void;
  purchaseMock: (mockId: string) => void;
  startExam: (mockId: string) => void;
  updateResponse: (questionNumber: number, selectedOption: string) => void;
  toggleMarkForReview: (questionNumber: number) => void;
  changeSection: (sectionIndex: number) => void;
  incrementTimeSpentOnActiveQuestion: (questionNumber: number) => void;
  submitExam: () => void;
  addCustomMock: (newMock: MockTest) => void;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('schoolsphere_user');
    if (saved) return JSON.parse(saved);
    // Seed default student user
    return {
      id: 'usr-default',
      email: 'aspirant@schoolsphere.ai',
      role: 'STUDENT',
      purchasedMockPacks: ['cat-elite-01'] // Free by default
    };
  });

  const [mocks, setMocks] = useState<MockTest[]>(() => {
    const saved = localStorage.getItem('schoolsphere_custom_mocks');
    if (saved) {
      const parsed = JSON.parse(saved);
      return [...MOCK_TESTS, ...parsed];
    }
    return MOCK_TESTS;
  });

  const [attemptsHistory, setAttemptsHistory] = useState<AttemptRecord[]>(() => {
    const saved = localStorage.getItem('schoolsphere_attempts');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeAttempt, setActiveAttempt] = useState<AttemptRecord | null>(() => {
    const saved = localStorage.getItem('schoolsphere_active_attempt');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(() => {
    const saved = localStorage.getItem('schoolsphere_active_section_index');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [sectionTimeRemaining, setSectionTimeRemaining] = useState<number>(() => {
    const saved = localStorage.getItem('schoolsphere_section_time_remaining');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Sync state to local storage
  useEffect(() => {
    if (user) {
      localStorage.setItem('schoolsphere_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('schoolsphere_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('schoolsphere_attempts', JSON.stringify(attemptsHistory));
  }, [attemptsHistory]);

  useEffect(() => {
    if (activeAttempt) {
      localStorage.setItem('schoolsphere_active_attempt', JSON.stringify(activeAttempt));
      localStorage.setItem('schoolsphere_active_section_index', activeSectionIndex.toString());
      localStorage.setItem('schoolsphere_section_time_remaining', sectionTimeRemaining.toString());
    } else {
      localStorage.removeItem('schoolsphere_active_attempt');
      localStorage.removeItem('schoolsphere_active_section_index');
      localStorage.removeItem('schoolsphere_section_time_remaining');
    }
  }, [activeAttempt, activeSectionIndex, sectionTimeRemaining]);

  // Load mock tests from Supabase
  useEffect(() => {
    const fetchMocks = async () => {
      try {
        const { data, error } = await supabase
          .from('mock_tests')
          .select('*');
        
        if (error) {
          console.error('Supabase fetch mocks error:', error.message);
        } else if (data && data.length > 0) {
          const formattedMocks = data.map((row: any) => ({
            id: row.id,
            title: row.title,
            examType: row.exam_type,
            price: parseFloat(row.price),
            isFreePYQP: row.is_free_pyqp,
            pdfSourceUrl: row.pdf_source_url,
            configuration: row.configuration,
            answerKey: row.answer_key
          }));
          setMocks(formattedMocks);
        }
      } catch (err) {
        console.error('Failed to load mocks from Supabase, using local defaults:', err);
      }
    };
    fetchMocks();
  }, []);

  // Load attempts history from Supabase when user logs in
  useEffect(() => {
    if (!user) {
      setAttemptsHistory([]);
      return;
    }
    const fetchAttempts = async () => {
      try {
        const { data, error } = await supabase
          .from('attempt_records')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Supabase fetch attempts error:', error.message);
        } else if (data) {
          const formattedAttempts = data.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            mockTestId: row.mock_test_id,
            startedAt: row.started_at,
            submittedAt: row.submitted_at,
            rawResponses: row.raw_responses,
            aiAnalysisOutput: row.ai_analysis_output
          }));
          setAttemptsHistory(formattedAttempts);
        }
      } catch (err) {
        console.error('Failed to load attempts from Supabase:', err);
      }
    };
    fetchAttempts();
  }, [user]);

  // Auto-save active attempt to Supabase every 15 seconds
  useEffect(() => {
    if (!activeAttempt) return;

    const timer = setInterval(() => {
      supabase.from('attempt_records').upsert({
        id: activeAttempt.id,
        user_id: activeAttempt.userId,
        mock_test_id: activeAttempt.mockTestId,
        started_at: activeAttempt.startedAt,
        submitted_at: activeAttempt.submittedAt,
        raw_responses: activeAttempt.rawResponses,
        ai_analysis_output: activeAttempt.aiAnalysisOutput
      }).then(({ error }) => {
        if (error) console.error('Supabase auto-save error:', error.message);
      });
    }, 15000);

    return () => clearInterval(timer);
  }, [activeAttempt]);

  // Auth controls
  const login = (email: string, role: 'STUDENT' | 'SUPERADMIN') => {
    const newUser: User = {
      id: `usr-${Math.random().toString(36).substr(2, 9)}`,
      email,
      role,
      purchasedMockPacks: role === 'SUPERADMIN' 
        ? mocks.map(m => m.id) 
        : ['cat-elite-01']
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
    setActiveAttempt(null);
    localStorage.removeItem('schoolsphere_user');
    localStorage.removeItem('schoolsphere_active_attempt');
  };

  // Buy mock
  const purchaseMock = (mockId: string) => {
    if (!user) return;
    if (user.purchasedMockPacks.includes(mockId)) return;
    const updated = {
      ...user,
      purchasedMockPacks: [...user.purchasedMockPacks, mockId]
    };
    setUser(updated);
  };

  // Start exam
  const startExam = (mockId: string) => {
    if (!user) return;
    const targetMock = mocks.find(m => m.id === mockId);
    if (!targetMock) return;

    // Check if sections exist
    const sections = targetMock.configuration.sections;
    if (sections.length === 0) return;

    // Build initial responses telemetry structure
    const totalQuestions = sections[sections.length - 1].questionRange.end;
    const rawResponses: ResponseTelemetry[] = Array.from({ length: totalQuestions }, (_, i) => ({
      questionNumber: i + 1,
      selectedOption: '',
      timeSpentSeconds: 0,
      timestamp: new Date().toISOString(),
      isMarkedForReview: false
    }));

    const newAttempt: AttemptRecord = {
      id: `att-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      mockTestId: mockId,
      startedAt: new Date().toISOString(),
      submittedAt: null,
      rawResponses
    };

    setActiveAttempt(newAttempt);
    setActiveSectionIndex(0);
    setSectionTimeRemaining(sections[0].allowedTimeMinutes * 60);

    // Sync to Supabase
    supabase.from('attempt_records').insert([{
      id: newAttempt.id,
      user_id: newAttempt.userId,
      mock_test_id: newAttempt.mockTestId,
      started_at: newAttempt.startedAt,
      submitted_at: null,
      raw_responses: newAttempt.rawResponses,
      ai_analysis_output: null
    }]).then(({ error }) => {
      if (error) console.error('Failed to save started attempt to Supabase:', error.message);
    });
  };

  // Update selected answer
  const updateResponse = (questionNumber: number, selectedOption: string) => {
    if (!activeAttempt) return;

    const updatedResponses = activeAttempt.rawResponses.map(resp => {
      if (resp.questionNumber === questionNumber) {
        return {
          ...resp,
          selectedOption,
          timestamp: new Date().toISOString()
        };
      }
      return resp;
    });

    setActiveAttempt({
      ...activeAttempt,
      rawResponses: updatedResponses
    });
  };

  // Toggle mark for review
  const toggleMarkForReview = (questionNumber: number) => {
    if (!activeAttempt) return;

    const updatedResponses = activeAttempt.rawResponses.map(resp => {
      if (resp.questionNumber === questionNumber) {
        return {
          ...resp,
          isMarkedForReview: !resp.isMarkedForReview
        };
      }
      return resp;
    });

    setActiveAttempt({
      ...activeAttempt,
      rawResponses: updatedResponses
    });
  };

  // Move section manually if allowed
  const changeSection = (sectionIndex: number) => {
    if (!activeAttempt) return;
    const targetMock = mocks.find(m => m.id === activeAttempt.mockTestId);
    if (!targetMock) return;

    if (sectionIndex >= 0 && sectionIndex < targetMock.configuration.sections.length) {
      setActiveSectionIndex(sectionIndex);
      setSectionTimeRemaining(targetMock.configuration.sections[sectionIndex].allowedTimeMinutes * 60);
    }
  };

  // Telemetry: Increments time-spent on a specific question
  const incrementTimeSpentOnActiveQuestion = (questionNumber: number) => {
    if (!activeAttempt) return;

    const updatedResponses = activeAttempt.rawResponses.map(resp => {
      if (resp.questionNumber === questionNumber) {
        return {
          ...resp,
          timeSpentSeconds: resp.timeSpentSeconds + 1
        };
      }
      return resp;
    });

    setActiveAttempt({
      ...activeAttempt,
      rawResponses: updatedResponses
    });
  };

  // Active Timer Effect
  useEffect(() => {
    if (!activeAttempt) return;

    const timer = setInterval(() => {
      setSectionTimeRemaining(prev => {
        if (prev <= 1) {
          // Time is up for current section
          const targetMock = mocks.find(m => m.id === activeAttempt.mockTestId);
          if (!targetMock) {
            clearInterval(timer);
            return 0;
          }
          const nextIndex = activeSectionIndex + 1;
          if (nextIndex < targetMock.configuration.sections.length) {
            // Move to next section automatically (Section Lock behavior)
            setActiveSectionIndex(nextIndex);
            return targetMock.configuration.sections[nextIndex].allowedTimeMinutes * 60;
          } else {
            // End of test
            clearInterval(timer);
            setTimeout(() => submitExam(), 10);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeAttempt, activeSectionIndex]);

  // Deep AI Diagnostic Analytics Calculator
  const submitExam = () => {
    if (!activeAttempt) return;

    const targetMock = mocks.find(m => m.id === activeAttempt.mockTestId);
    if (!targetMock) return;

    const key = targetMock.answerKey;
    const responses = activeAttempt.rawResponses;

    // 1. Core Section Breakdown Calculations
    const sectionsBreakdown = targetMock.configuration.sections.map(section => {
      let correct = 0;
      let wrong = 0;
      let unattempted = 0;
      let totalTime = 0;
      let count = 0;

      for (let q = section.questionRange.start; q <= section.questionRange.end; q++) {
        const resp = responses.find(r => r.questionNumber === q);
        const ans = key.find(k => k.questionNumber === q);

        if (!resp || resp.selectedOption === '') {
          unattempted++;
        } else if (ans && resp.selectedOption === ans.correctOption) {
          correct++;
        } else {
          wrong++;
        }

        if (resp) {
          totalTime += resp.timeSpentSeconds;
          count++;
        }
      }

      return {
        sectionName: section.sectionName,
        correctCount: correct,
        wrongCount: wrong,
        unattemptedCount: unattempted,
        averageTimePerQuestion: count > 0 ? Math.round(totalTime / count) : 0
      };
    });

    // 2. Telemetry Velocity Vectoring & Speed Traps
    // A speed trap is defined as spending more than 2x the average section time on a single question and getting it wrong.
    let speedTrapCount = 0;
    responses.forEach(resp => {
      const ans = key.find(k => k.questionNumber === resp.questionNumber);
      const isCorrect = ans && resp.selectedOption === ans.correctOption;
      
      // Look up average time for the section this question belongs to
      const section = targetMock.configuration.sections.find(
        s => resp.questionNumber >= s.questionRange.start && resp.questionNumber <= s.questionRange.end
      );
      
      if (section) {
        // Average recommended question duration (XAT DM: 200s, Quant: 260s, VARC: 200s)
        const recommendedAvg = (section.allowedTimeMinutes * 60) / (section.questionRange.end - section.questionRange.start + 1);
        if (resp.timeSpentSeconds > recommendedAvg * 1.5 && !isCorrect && resp.selectedOption !== '') {
          speedTrapCount++;
        }
      }
    });

    // 3. Contextual Cognitive Mapping (Concept Blindspots)
    const errorMap: Record<string, number> = {};
    responses.forEach(resp => {
      const ans = key.find(k => k.questionNumber === resp.questionNumber);
      const isCorrect = ans && resp.selectedOption === ans.correctOption;
      
      if (!isCorrect && resp.selectedOption !== '' && ans) {
        errorMap[ans.cognitiveTag] = (errorMap[ans.cognitiveTag] || 0) + 1;
      }
    });

    let coreBlindspot = 'General Arithmetic Concepts';
    let maxErrors = 0;
    Object.entries(errorMap).forEach(([tag, count]) => {
      if (count > maxErrors) {
        maxErrors = count;
        coreBlindspot = tag;
      }
    });

    // 4. Cross-Section Fatigue Modeling
    // Compare error densities of the first 30% of the exam timeline vs. final 30% of the exam timeline.
    const thirdPart = Math.ceil(responses.length / 3);
    const firstThird = responses.slice(0, thirdPart);
    const lastThird = responses.slice(responses.length - thirdPart);

    const getErrorRate = (slice: ResponseTelemetry[]) => {
      let errors = 0;
      let activeCount = 0;
      slice.forEach(resp => {
        if (resp.selectedOption !== '') {
          activeCount++;
          const ans = key.find(k => k.questionNumber === resp.questionNumber);
          if (!ans || resp.selectedOption !== ans.correctOption) {
            errors++;
          }
        }
      });
      return activeCount > 0 ? errors / activeCount : 0;
    };

    const firstThirdErrorRate = getErrorRate(firstThird);
    const lastThirdErrorRate = getErrorRate(lastThird);
    // Fatigue score is normalized between 0 and 100
    const fatigueScore = Math.min(100, Math.max(0, Math.round((lastThirdErrorRate - firstThirdErrorRate) * 100 + 40)));

    // 5. Predictive Score Matrixing
    let correctCount = 0;
    responses.forEach(resp => {
      const ans = key.find(k => k.questionNumber === resp.questionNumber);
      if (ans && resp.selectedOption === ans.correctOption) {
        correctCount++;
      }
    });
    const accuracy = responses.length > 0 ? correctCount / responses.length : 0;
    
    // Scale percentile depending on accuracy, speed traps, and fatigue
    const baselinePercentile = 50 + accuracy * 45; 
    const speedTrapPenalty = Math.min(5, speedTrapCount * 0.8);
    const fatiguePenalty = Math.min(5, (fatigueScore / 100) * 8);
    const predictedPercentile = parseFloat(Math.min(99.98, Math.max(30, baselinePercentile - speedTrapPenalty - fatiguePenalty)).toFixed(2));
    
    const percentileMin = parseFloat(Math.max(25, predictedPercentile - 1.5).toFixed(2));
    const percentileMax = parseFloat(Math.min(99.99, predictedPercentile + 1.2).toFixed(2));

    const velocityRecommendation = speedTrapCount > 2
      ? "Speed Trap Warning: You spent extensive time on difficult problems instead of securing easier raw points. Skip earlier and double back."
      : "Balanced velocity. Maintain pacing but focus on minimizing careless micro-errors.";

    const completedAttempt: AttemptRecord = {
      ...activeAttempt,
      submittedAt: new Date().toISOString(),
      aiAnalysisOutput: {
        coreBlindspot,
        velocityRecommendation,
        fatigueScore,
        speedTrapCount,
        predictedPercentile,
        percentileMin,
        percentileMax,
        sectionBreakdowns: sectionsBreakdown
      }
    };

    setAttemptsHistory(prev => [completedAttempt, ...prev]);
    setActiveAttempt(null);

    // Sync completed attempt to Supabase
    supabase.from('attempt_records').upsert({
      id: completedAttempt.id,
      user_id: completedAttempt.userId,
      mock_test_id: completedAttempt.mockTestId,
      started_at: completedAttempt.startedAt,
      submitted_at: completedAttempt.submittedAt,
      raw_responses: completedAttempt.rawResponses,
      ai_analysis_output: completedAttempt.aiAnalysisOutput
    }).then(({ error }) => {
      if (error) console.error('Failed to sync final submit to Supabase:', error.message);
    });
  };

  const addCustomMock = (newMock: MockTest) => {
    setMocks(prev => {
      const customOnly = prev.filter(m => !MOCK_TESTS.some(orig => orig.id === m.id));
      const updatedCustom = [...customOnly, newMock];
      localStorage.setItem('schoolsphere_custom_mocks', JSON.stringify(updatedCustom));
      return [...MOCK_TESTS, ...updatedCustom];
    });

    // Sync custom mock to Supabase database
    supabase.from('mock_tests').insert([{
      id: newMock.id,
      title: newMock.title,
      exam_type: newMock.examType,
      price: newMock.price,
      is_free_pyqp: newMock.isFreePYQP,
      pdf_source_url: newMock.pdfSourceUrl,
      configuration: newMock.configuration,
      answer_key: newMock.answerKey
    }]).then(({ error }) => {
      if (error) {
        console.error('Failed to insert custom mock to Supabase:', error.message);
      } else {
        console.log('Custom mock synced to Supabase database!');
      }
    });
  };

  return (
    <ExamContext.Provider value={{
      user,
      mocks,
      activeAttempt,
      attemptsHistory,
      activeSectionIndex,
      sectionTimeRemaining,
      login,
      logout,
      purchaseMock,
      startExam,
      updateResponse,
      toggleMarkForReview,
      changeSection,
      incrementTimeSpentOnActiveQuestion,
      submitExam,
      addCustomMock
    }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) throw new Error('useExam must be used within an ExamProvider');
  return context;
};
