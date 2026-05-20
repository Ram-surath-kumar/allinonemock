export interface Section {
  sectionName: string;
  allowedTimeMinutes: number;
  questionRange: { start: number; end: number };
}

export interface AnswerKeyEntry {
  questionNumber: number;
  correctOption: string; // 'A', 'B', 'C', 'D'
  cognitiveTag: string;
}

export interface MockTest {
  id: string;
  title: string;
  examType: 'CAT' | 'XAT' | 'GMAT' | 'NMAT' | 'SNAP' | 'BANK';
  price: number;
  isFreePYQP: boolean;
  pdfSourceUrl: string; // Simulated link to PDF question paper
  configuration: {
    totalDurationMinutes: number;
    markingScheme: { correct: number; incorrect: number };
    sections: Section[];
  };
  answerKey: AnswerKeyEntry[];
}

export const MOCK_TESTS: MockTest[] = [
  {
    id: 'cat-elite-01',
    title: 'CAT 2025 Authentic Previous Year Paper',
    examType: 'CAT',
    price: 0,
    isFreePYQP: true,
    pdfSourceUrl: 'https://schoolsphere-assets.s3.amazonaws.com/pyqps/cat-2025-slot1.pdf',
    configuration: {
      totalDurationMinutes: 120,
      markingScheme: { correct: 3, incorrect: -1 },
      sections: [
        { sectionName: 'VARC (Verbal Ability & Reading Comprehension)', allowedTimeMinutes: 40, questionRange: { start: 1, end: 12 } },
        { sectionName: 'DILR (Data Interpretation & Logical Reasoning)', allowedTimeMinutes: 40, questionRange: { start: 13, end: 24 } },
        { sectionName: 'QA (Quantitative Ability)', allowedTimeMinutes: 40, questionRange: { start: 25, end: 36 } }
      ]
    },
    answerKey: [
      // VARC (1-12)
      { questionNumber: 1, correctOption: 'B', cognitiveTag: 'Reading Comprehension - Main Idea' },
      { questionNumber: 2, correctOption: 'A', cognitiveTag: 'Reading Comprehension - Tone' },
      { questionNumber: 3, correctOption: 'C', cognitiveTag: 'Reading Comprehension - Inference' },
      { questionNumber: 4, correctOption: 'D', cognitiveTag: 'Verbal Ability - Parajumbles' },
      { questionNumber: 5, correctOption: 'B', cognitiveTag: 'Verbal Ability - Summary' },
      { questionNumber: 6, correctOption: 'A', cognitiveTag: 'Verbal Ability - Odd Sentence Out' },
      { questionNumber: 7, correctOption: 'C', cognitiveTag: 'Reading Comprehension - Vocabulary' },
      { questionNumber: 8, correctOption: 'D', cognitiveTag: 'Reading Comprehension - Inference' },
      { questionNumber: 9, correctOption: 'A', cognitiveTag: 'Reading Comprehension - Detail' },
      { questionNumber: 10, correctOption: 'B', cognitiveTag: 'Verbal Ability - Parajumbles' },
      { questionNumber: 11, correctOption: 'C', cognitiveTag: 'Verbal Ability - Summary' },
      { questionNumber: 12, correctOption: 'D', cognitiveTag: 'Verbal Ability - Paragraph Completion' },
      // DILR (13-24)
      { questionNumber: 13, correctOption: 'C', cognitiveTag: 'Logical Reasoning - Arrangement' },
      { questionNumber: 14, correctOption: 'A', cognitiveTag: 'Logical Reasoning - Arrangement' },
      { questionNumber: 15, correctOption: 'D', cognitiveTag: 'Logical Reasoning - Games & Tournaments' },
      { questionNumber: 16, correctOption: 'B', cognitiveTag: 'Logical Reasoning - Games & Tournaments' },
      { questionNumber: 17, correctOption: 'C', cognitiveTag: 'Data Interpretation - Matrix Grid' },
      { questionNumber: 18, correctOption: 'B', cognitiveTag: 'Data Interpretation - Matrix Grid' },
      { questionNumber: 19, correctOption: 'A', cognitiveTag: 'Logical Reasoning - Venn Diagrams' },
      { questionNumber: 20, correctOption: 'D', cognitiveTag: 'Logical Reasoning - Venn Diagrams' },
      { questionNumber: 21, correctOption: 'C', cognitiveTag: 'Data Interpretation - Charts & Graphs' },
      { questionNumber: 22, correctOption: 'A', cognitiveTag: 'Data Interpretation - Charts & Graphs' },
      { questionNumber: 23, correctOption: 'B', cognitiveTag: 'Logical Reasoning - Truth Teller & Liars' },
      { questionNumber: 24, correctOption: 'D', cognitiveTag: 'Logical Reasoning - Selection Criteria' },
      // QA (25-36)
      { questionNumber: 25, correctOption: 'A', cognitiveTag: 'Arithmetic - Percentages & Interest' },
      { questionNumber: 26, correctOption: 'B', cognitiveTag: 'Arithmetic - Ratio & Proportion' },
      { questionNumber: 27, correctOption: 'C', cognitiveTag: 'Arithmetic - Time, Speed & Distance' },
      { questionNumber: 28, correctOption: 'D', cognitiveTag: 'Algebra - Logarithms Base Mismatches' },
      { questionNumber: 29, correctOption: 'A', cognitiveTag: 'Algebra - Quadratic Equations' },
      { questionNumber: 30, correctOption: 'B', cognitiveTag: 'Algebra - Sequence & Series' },
      { questionNumber: 31, correctOption: 'D', cognitiveTag: 'Geometry - Circles & Triangles' },
      { questionNumber: 32, correctOption: 'C', cognitiveTag: 'Geometry - Coordinate Geometry' },
      { questionNumber: 33, correctOption: 'B', cognitiveTag: 'Number Systems - Divisibility Rules' },
      { questionNumber: 34, correctOption: 'A', cognitiveTag: 'Modern Maths - Permutations & Combinations' },
      { questionNumber: 35, correctOption: 'C', cognitiveTag: 'Modern Maths - Probability' },
      { questionNumber: 36, correctOption: 'D', cognitiveTag: 'Algebra - Functions & Graphs' }
    ]
  },
  {
    id: 'xat-premium-01',
    title: 'XAT Premium Mock Pack - Extreme Focus',
    examType: 'XAT',
    price: 39.99,
    isFreePYQP: false,
    pdfSourceUrl: 'https://schoolsphere-assets.s3.amazonaws.com/mocks/xat-premium-01.pdf',
    configuration: {
      totalDurationMinutes: 175,
      markingScheme: { correct: 1, incorrect: -0.25 },
      sections: [
        { sectionName: 'VALR (Verbal & Logical Ability)', allowedTimeMinutes: 60, questionRange: { start: 1, end: 15 } },
        { sectionName: 'DM (Decision Making)', allowedTimeMinutes: 50, questionRange: { start: 16, end: 30 } },
        { sectionName: 'QADI (Quantitative Ability & Data Interpretation)', allowedTimeMinutes: 65, questionRange: { start: 31, end: 45 } }
      ]
    },
    answerKey: [
      // VALR
      { questionNumber: 1, correctOption: 'A', cognitiveTag: 'Verbal Ability - Critical Reasoning' },
      { questionNumber: 2, correctOption: 'C', cognitiveTag: 'Verbal Ability - Analogy' },
      { questionNumber: 3, correctOption: 'B', cognitiveTag: 'Reading Comprehension - Poem Analysis' },
      { questionNumber: 4, correctOption: 'D', cognitiveTag: 'Verbal Ability - Grammar & Fillers' },
      { questionNumber: 5, correctOption: 'C', cognitiveTag: 'Reading Comprehension - Abstract Themes' },
      { questionNumber: 6, correctOption: 'A', cognitiveTag: 'Reading Comprehension - Abstract Themes' },
      { questionNumber: 7, correctOption: 'B', cognitiveTag: 'Logical Ability - Syllogisms' },
      { questionNumber: 8, correctOption: 'D', cognitiveTag: 'Logical Ability - Deductions' },
      { questionNumber: 9, correctOption: 'A', cognitiveTag: 'Verbal Ability - Critical Reasoning' },
      { questionNumber: 10, correctOption: 'B', cognitiveTag: 'Reading Comprehension - Inference' },
      { questionNumber: 11, correctOption: 'C', cognitiveTag: 'Reading Comprehension - Tone' },
      { questionNumber: 12, correctOption: 'D', cognitiveTag: 'Verbal Ability - Grammar' },
      { questionNumber: 13, correctOption: 'B', cognitiveTag: 'Logical Ability - Input-Output' },
      { questionNumber: 14, correctOption: 'A', cognitiveTag: 'Logical Ability - Coding-Decoding' },
      { questionNumber: 15, correctOption: 'C', cognitiveTag: 'Verbal Ability - Vocab Context' },
      // DM
      { questionNumber: 16, correctOption: 'C', cognitiveTag: 'Decision Making - Ethical Dilemma' },
      { questionNumber: 17, correctOption: 'D', cognitiveTag: 'Decision Making - Business Strategy' },
      { questionNumber: 18, correctOption: 'B', cognitiveTag: 'Decision Making - Employee Relations' },
      { questionNumber: 19, correctOption: 'A', cognitiveTag: 'Decision Making - Ethical Dilemma' },
      { questionNumber: 20, correctOption: 'D', cognitiveTag: 'Decision Making - Marketing Strategy' },
      { questionNumber: 21, correctOption: 'B', cognitiveTag: 'Decision Making - Product Recall' },
      { questionNumber: 22, correctOption: 'C', cognitiveTag: 'Decision Making - Stakeholder Conflict' },
      { questionNumber: 23, correctOption: 'A', cognitiveTag: 'Decision Making - Ethical Choices' },
      { questionNumber: 24, correctOption: 'C', cognitiveTag: 'Decision Making - Finance Strategy' },
      { questionNumber: 25, correctOption: 'D', cognitiveTag: 'Decision Making - Human Resources' },
      { questionNumber: 26, correctOption: 'B', cognitiveTag: 'Decision Making - Corporate Governance' },
      { questionNumber: 27, correctOption: 'A', cognitiveTag: 'Decision Making - Community Relations' },
      { questionNumber: 28, correctOption: 'C', cognitiveTag: 'Decision Making - Environmental Policy' },
      { questionNumber: 29, correctOption: 'D', cognitiveTag: 'Decision Making - Crisis Management' },
      { questionNumber: 30, correctOption: 'B', cognitiveTag: 'Decision Making - Supply Chain Dispute' },
      // QADI
      { questionNumber: 31, correctOption: 'A', cognitiveTag: 'Arithmetic - Time & Work' },
      { questionNumber: 32, correctOption: 'B', cognitiveTag: 'Arithmetic - Mixtures & Alligations' },
      { questionNumber: 33, correctOption: 'C', cognitiveTag: 'Algebra - Progressions' },
      { questionNumber: 34, correctOption: 'D', cognitiveTag: 'Algebra - Polynomials' },
      { questionNumber: 35, correctOption: 'A', cognitiveTag: 'Geometry - Mensuration' },
      { questionNumber: 36, correctOption: 'C', cognitiveTag: 'Geometry - Heights & Distances' },
      { questionNumber: 37, correctOption: 'B', cognitiveTag: 'Number Systems - Prime Factorization' },
      { questionNumber: 38, correctOption: 'A', cognitiveTag: 'Modern Maths - Probability Selection' },
      { questionNumber: 39, correctOption: 'C', cognitiveTag: 'Data Interpretation - Caselet' },
      { questionNumber: 40, correctOption: 'D', cognitiveTag: 'Data Interpretation - Caselet' },
      { questionNumber: 41, correctOption: 'B', cognitiveTag: 'Data Interpretation - Scatter Plots' },
      { questionNumber: 42, correctOption: 'A', cognitiveTag: 'Data Interpretation - Radar Charts' },
      { questionNumber: 43, correctOption: 'D', cognitiveTag: 'Arithmetic - Interest Rates' },
      { questionNumber: 44, correctOption: 'C', cognitiveTag: 'Algebra - Inequalities' },
      { questionNumber: 45, correctOption: 'B', cognitiveTag: 'Geometry - Properties of Triangles' }
    ]
  },
  {
    id: 'gmat-focus-01',
    title: 'GMAT Focus Edition Adaptive Starter Mock',
    examType: 'GMAT',
    price: 49.99,
    isFreePYQP: false,
    pdfSourceUrl: 'https://schoolsphere-assets.s3.amazonaws.com/mocks/gmat-focus-01.pdf',
    configuration: {
      totalDurationMinutes: 135,
      markingScheme: { correct: 4, incorrect: 0 },
      sections: [
        { sectionName: 'Quant (Quantitative Reasoning)', allowedTimeMinutes: 45, questionRange: { start: 1, end: 15 } },
        { sectionName: 'Verbal (Verbal Reasoning)', allowedTimeMinutes: 45, questionRange: { start: 16, end: 30 } },
        { sectionName: 'Data Insights', allowedTimeMinutes: 45, questionRange: { start: 31, end: 45 } }
      ]
    },
    answerKey: [
      // Quant (1-15)
      { questionNumber: 1, correctOption: 'A', cognitiveTag: 'Quant - Number Properties' },
      { questionNumber: 2, correctOption: 'B', cognitiveTag: 'Quant - Word Problems' },
      { questionNumber: 3, correctOption: 'C', cognitiveTag: 'Quant - Linear Equations' },
      { questionNumber: 4, correctOption: 'D', cognitiveTag: 'Quant - Exponents & Roots' },
      { questionNumber: 5, correctOption: 'B', cognitiveTag: 'Quant - Inequalities' },
      { questionNumber: 6, correctOption: 'A', cognitiveTag: 'Quant - Fractions & Decimals' },
      { questionNumber: 7, correctOption: 'C', cognitiveTag: 'Quant - Rates & Work' },
      { questionNumber: 8, correctOption: 'D', cognitiveTag: 'Quant - Percentages' },
      { questionNumber: 9, correctOption: 'B', cognitiveTag: 'Quant - Statistics (Mean/Median)' },
      { questionNumber: 10, correctOption: 'C', cognitiveTag: 'Quant - Sets & Venn Diagrams' },
      { questionNumber: 11, correctOption: 'A', cognitiveTag: 'Quant - Permutations & Probability' },
      { questionNumber: 12, correctOption: 'D', cognitiveTag: 'Quant - Geometry Coordinate' },
      { questionNumber: 13, correctOption: 'B', cognitiveTag: 'Quant - Number Theory' },
      { questionNumber: 14, correctOption: 'C', cognitiveTag: 'Quant - Ratio Analysis' },
      { questionNumber: 15, correctOption: 'A', cognitiveTag: 'Quant - System of Equations' },
      // Verbal (16-30)
      { questionNumber: 16, correctOption: 'C', cognitiveTag: 'Critical Reasoning - Weaken' },
      { questionNumber: 17, correctOption: 'D', cognitiveTag: 'Critical Reasoning - Strengthen' },
      { questionNumber: 18, correctOption: 'A', cognitiveTag: 'Reading Comprehension - Main Idea' },
      { questionNumber: 19, correctOption: 'B', cognitiveTag: 'Reading Comprehension - Logical Structure' },
      { questionNumber: 20, correctOption: 'C', cognitiveTag: 'Critical Reasoning - Assumption' },
      { questionNumber: 21, correctOption: 'A', cognitiveTag: 'Critical Reasoning - Boldface Role' },
      { questionNumber: 22, correctOption: 'D', cognitiveTag: 'Reading Comprehension - Evaluation' },
      { questionNumber: 23, correctOption: 'B', cognitiveTag: 'Reading Comprehension - Specific Fact' },
      { questionNumber: 24, correctOption: 'C', cognitiveTag: 'Critical Reasoning - Resolve Paradox' },
      { questionNumber: 25, correctOption: 'A', cognitiveTag: 'Critical Reasoning - Inference' },
      { questionNumber: 26, correctOption: 'D', cognitiveTag: 'Reading Comprehension - Author Intent' },
      { questionNumber: 27, correctOption: 'C', cognitiveTag: 'Reading Comprehension - Inference' },
      { questionNumber: 28, correctOption: 'B', cognitiveTag: 'Critical Reasoning - Evaluate Argument' },
      { questionNumber: 29, correctOption: 'A', cognitiveTag: 'Critical Reasoning - Flaw Identification' },
      { questionNumber: 30, correctOption: 'D', cognitiveTag: 'Critical Reasoning - Weaken' },
      // Data Insights (31-45)
      { questionNumber: 31, correctOption: 'D', cognitiveTag: 'Data Insights - Table Analysis' },
      { questionNumber: 32, correctOption: 'B', cognitiveTag: 'Data Insights - Multi-Source Reasoning' },
      { questionNumber: 33, correctOption: 'C', cognitiveTag: 'Data Insights - Multi-Source Reasoning' },
      { questionNumber: 34, correctOption: 'A', cognitiveTag: 'Data Insights - Graphical Interpretation' },
      { questionNumber: 35, correctOption: 'D', cognitiveTag: 'Data Insights - Graphical Interpretation' },
      { questionNumber: 36, correctOption: 'B', cognitiveTag: 'Data Insights - Two-Part Analysis' },
      { questionNumber: 37, correctOption: 'C', cognitiveTag: 'Data Insights - Two-Part Analysis' },
      { questionNumber: 38, correctOption: 'A', cognitiveTag: 'Data Insights - Data Sufficiency' },
      { questionNumber: 39, correctOption: 'D', cognitiveTag: 'Data Insights - Data Sufficiency' },
      { questionNumber: 40, correctOption: 'C', cognitiveTag: 'Data Insights - Data Sufficiency' },
      { questionNumber: 41, correctOption: 'B', cognitiveTag: 'Data Insights - Table Analysis' },
      { questionNumber: 42, correctOption: 'A', cognitiveTag: 'Data Insights - Graphical Plots' },
      { questionNumber: 43, correctOption: 'C', cognitiveTag: 'Data Insights - Two-Part Logic' },
      { questionNumber: 44, correctOption: 'D', cognitiveTag: 'Data Insights - Multi-Source Analysis' },
      { questionNumber: 45, correctOption: 'A', cognitiveTag: 'Data Insights - Data Sufficiency' }
    ]
  }
];

export interface ResponseTelemetry {
  questionNumber: number;
  selectedOption: string; // 'A', 'B', 'C', 'D' or ''
  timeSpentSeconds: number;
  timestamp: string; // ISO date
  isMarkedForReview: boolean;
}

export interface AttemptRecord {
  id: string;
  userId: string;
  mockTestId: string;
  startedAt: string;
  submittedAt: string | null;
  rawResponses: ResponseTelemetry[];
  aiAnalysisOutput?: {
    coreBlindspot: string;
    velocityRecommendation: string;
    fatigueScore: number;
    speedTrapCount: number;
    predictedPercentile: number;
    percentileMin: number;
    percentileMax: number;
    sectionBreakdowns: {
      sectionName: string;
      correctCount: number;
      wrongCount: number;
      unattemptedCount: number;
      averageTimePerQuestion: number;
    }[];
  };
}
