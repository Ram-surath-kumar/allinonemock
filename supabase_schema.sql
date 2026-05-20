-- SUPABASE DATABASE SETUP MIGRATION
-- NextGen AI Mock Test Platform

-- 1. Create Mock Tests Table
CREATE TABLE IF NOT EXISTS public.mock_tests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    price NUMERIC(10, 2) DEFAULT 0.00,
    is_free_pyqp BOOLEAN DEFAULT FALSE,
    pdf_source_url TEXT NOT NULL,
    configuration JSONB NOT NULL,
    answer_key JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Attempt Records Table
CREATE TABLE IF NOT EXISTS public.attempt_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    mock_test_id TEXT REFERENCES public.mock_tests(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    raw_responses JSONB NOT NULL,
    ai_analysis_output JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_records ENABLE ROW LEVEL SECURITY;

-- 3. Define RLS Policies
-- Allow anyone to read mock tests
CREATE POLICY "Allow public read access to mock_tests" 
ON public.mock_tests FOR SELECT 
USING (true);

-- Allow admins or service key to insert/update mocks
CREATE POLICY "Allow all access to mock_tests via service_role" 
ON public.mock_tests FOR ALL 
USING (true) 
WITH CHECK (true);

-- Allow public read/write to attempts (simulated student auth)
CREATE POLICY "Allow public read access to attempt_records" 
ON public.attempt_records FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to attempt_records" 
ON public.attempt_records FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to attempt_records" 
ON public.attempt_records FOR UPDATE 
USING (true);

-- 4. Seed Pre-configured Mock Tests
INSERT INTO public.mock_tests (id, title, exam_type, price, is_free_pyqp, pdf_source_url, configuration, answer_key)
VALUES 
(
  'cat-elite-01',
  'CAT 2025 Previous Year Paper',
  'CAT',
  0.00,
  true,
  'https://schoolsphere-assets.s3.amazonaws.com/mocks/cat2025.pdf',
  '{
    "totalDurationMinutes": 120,
    "markingScheme": {"correct": 3.0, "incorrect": -1.0},
    "sections": [
      {"sectionName": "Verbal Ability & Reading Comprehension", "allowedTimeMinutes": 40, "questionRange": {"start": 1, "end": 5}},
      {"sectionName": "Data Interpretation & Logical Reasoning", "allowedTimeMinutes": 40, "questionRange": {"start": 6, "end": 10}},
      {"sectionName": "Quantitative Ability", "allowedTimeMinutes": 40, "questionRange": {"start": 11, "end": 15}}
    ]
  }'::jsonb,
  '[
    {"questionNumber": 1, "correctOption": "B", "cognitiveTag": "Reading Comprehension - Inference"},
    {"questionNumber": 2, "correctOption": "C", "cognitiveTag": "Reading Comprehension - Vocabulary"},
    {"questionNumber": 3, "correctOption": "A", "cognitiveTag": "Verbal Ability - Parajumbles"},
    {"questionNumber": 4, "correctOption": "D", "cognitiveTag": "Verbal Ability - Summary"},
    {"questionNumber": 5, "correctOption": "B", "cognitiveTag": "Verbal Ability - Grammar"},
    {"questionNumber": 6, "correctOption": "A", "cognitiveTag": "Logical Reasoning - Matrix Arrangement"},
    {"questionNumber": 7, "correctOption": "C", "cognitiveTag": "Logical Reasoning - Binary Logic"},
    {"questionNumber": 8, "correctOption": "D", "cognitiveTag": "Data Interpretation - Pie Chart"},
    {"questionNumber": 9, "correctOption": "B", "cognitiveTag": "Data Interpretation - Caselet"},
    {"questionNumber": 10, "correctOption": "A", "cognitiveTag": "Logical Reasoning - Games & Tournaments"},
    {"questionNumber": 11, "correctOption": "D", "cognitiveTag": "Arithmetic - Percentages"},
    {"questionNumber": 12, "correctOption": "B", "cognitiveTag": "Algebra - Quadratic Equations"},
    {"questionNumber": 13, "correctOption": "C", "cognitiveTag": "Arithmetic - Time & Work"},
    {"questionNumber": 14, "correctOption": "A", "cognitiveTag": "Geometry - Triangles"},
    {"questionNumber": 15, "correctOption": "D", "cognitiveTag": "Number Systems - Divisibility"}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  exam_type = EXCLUDED.exam_type,
  price = EXCLUDED.price,
  is_free_pyqp = EXCLUDED.is_free_pyqp,
  pdf_source_url = EXCLUDED.pdf_source_url,
  configuration = EXCLUDED.configuration,
  answer_key = EXCLUDED.answer_key;

INSERT INTO public.mock_tests (id, title, exam_type, price, is_free_pyqp, pdf_source_url, configuration, answer_key)
VALUES 
(
  'xat-premium-01',
  'XAT Premium Mock Pack 2026',
  'XAT',
  29.99,
  false,
  'https://schoolsphere-assets.s3.amazonaws.com/mocks/xat2026_premium.pdf',
  '{
    "totalDurationMinutes": 180,
    "markingScheme": {"correct": 1.0, "incorrect": -0.25},
    "sections": [
      {"sectionName": "Verbal and Logical Ability", "allowedTimeMinutes": 60, "questionRange": {"start": 1, "end": 5}},
      {"sectionName": "Decision Making", "allowedTimeMinutes": 60, "questionRange": {"start": 6, "end": 10}},
      {"sectionName": "Quantitative Ability & Data Interpretation", "allowedTimeMinutes": 60, "questionRange": {"start": 11, "end": 15}}
    ]
  }'::jsonb,
  '[
    {"questionNumber": 1, "correctOption": "C", "cognitiveTag": "Verbal Ability - Critical Reasoning"},
    {"questionNumber": 2, "correctOption": "A", "cognitiveTag": "Reading Comprehension - Tone"},
    {"questionNumber": 3, "correctOption": "D", "cognitiveTag": "Verbal Ability - Analogies"},
    {"questionNumber": 4, "correctOption": "B", "cognitiveTag": "Reading Comprehension - Main Idea"},
    {"questionNumber": 5, "correctOption": "C", "cognitiveTag": "Verbal Ability - Vocabulary"},
    {"questionNumber": 6, "correctOption": "B", "cognitiveTag": "Decision Making - Business Ethics"},
    {"questionNumber": 7, "correctOption": "D", "cognitiveTag": "Decision Making - Management Scenario"},
    {"questionNumber": 8, "correctOption": "A", "cognitiveTag": "Decision Making - Ethical Dilemma"},
    {"questionNumber": 9, "correctOption": "C", "cognitiveTag": "Decision Making - Strategic Choice"},
    {"questionNumber": 10, "correctOption": "B", "cognitiveTag": "Decision Making - Financial Decisiveness"},
    {"questionNumber": 11, "correctOption": "A", "cognitiveTag": "Arithmetic - Ratio & Proportion"},
    {"questionNumber": 12, "correctOption": "C", "cognitiveTag": "Algebra - Logarithms"},
    {"questionNumber": 13, "correctOption": "D", "cognitiveTag": "Geometry - Coordinate Geometry"},
    {"questionNumber": 14, "correctOption": "B", "cognitiveTag": "Modern Maths - Probability"},
    {"questionNumber": 15, "correctOption": "C", "cognitiveTag": "Data Interpretation - Line Graphs"}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  exam_type = EXCLUDED.exam_type,
  price = EXCLUDED.price,
  is_free_pyqp = EXCLUDED.is_free_pyqp,
  pdf_source_url = EXCLUDED.pdf_source_url,
  configuration = EXCLUDED.configuration,
  answer_key = EXCLUDED.answer_key;

INSERT INTO public.mock_tests (id, title, exam_type, price, is_free_pyqp, pdf_source_url, configuration, answer_key)
VALUES 
(
  'gmat-focus-01',
  'GMAT Focus Adaptive Practice Set 1',
  'GMAT',
  39.99,
  false,
  'https://schoolsphere-assets.s3.amazonaws.com/mocks/gmat_focus_01.pdf',
  '{
    "totalDurationMinutes": 135,
    "markingScheme": {"correct": 4.0, "incorrect": 0.0},
    "sections": [
      {"sectionName": "Quantitative Reasoning", "allowedTimeMinutes": 45, "questionRange": {"start": 1, "end": 5}},
      {"sectionName": "Verbal Reasoning", "allowedTimeMinutes": 45, "questionRange": {"start": 6, "end": 10}},
      {"sectionName": "Data Insights", "allowedTimeMinutes": 45, "questionRange": {"start": 11, "end": 15}}
    ]
  }'::jsonb,
  '[
    {"questionNumber": 1, "correctOption": "D", "cognitiveTag": "Quant - Problem Solving"},
    {"questionNumber": 2, "correctOption": "B", "cognitiveTag": "Quant - Algebra & Fractions"},
    {"questionNumber": 3, "correctOption": "A", "cognitiveTag": "Quant - Percentages"},
    {"questionNumber": 4, "correctOption": "C", "cognitiveTag": "Quant - Linear Inequalities"},
    {"questionNumber": 5, "correctOption": "E", "cognitiveTag": "Quant - Rates & Work"},
    {"questionNumber": 6, "correctOption": "B", "cognitiveTag": "Verbal - Critical Reasoning"},
    {"questionNumber": 7, "correctOption": "C", "cognitiveTag": "Verbal - Reading Comprehension"},
    {"questionNumber": 8, "correctOption": "A", "cognitiveTag": "Verbal - Sentence Correction"},
    {"questionNumber": 9, "correctOption": "E", "cognitiveTag": "Verbal - Logical Flaw"},
    {"questionNumber": 10, "correctOption": "D", "cognitiveTag": "Verbal - Inference"},
    {"questionNumber": 11, "correctOption": "C", "cognitiveTag": "Data Insights - Data Sufficiency"},
    {"questionNumber": 12, "correctOption": "E", "cognitiveTag": "Data Insights - Multi-Source Reasoning"},
    {"questionNumber": 13, "correctOption": "A", "cognitiveTag": "Data Insights - Table Analysis"},
    {"questionNumber": 14, "correctOption": "B", "cognitiveTag": "Data Insights - Two-Part Analysis"},
    {"questionNumber": 15, "correctOption": "D", "cognitiveTag": "Data Insights - Graphical Interpretation"}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  exam_type = EXCLUDED.exam_type,
  price = EXCLUDED.price,
  is_free_pyqp = EXCLUDED.is_free_pyqp,
  pdf_source_url = EXCLUDED.pdf_source_url,
  configuration = EXCLUDED.configuration,
  answer_key = EXCLUDED.answer_key;
