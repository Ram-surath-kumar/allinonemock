-- Admission Schema Migration Script
-- Create Enum Types for Status Tracking
CREATE TYPE admission_status AS ENUM (
  'applied', 'verified', 'shortlisted', 'merit_listed', 'admitted', 'rejected', 'withdrawn'
);

CREATE TYPE enrollment_status AS ENUM (
  'active', 'on_leave', 'graduated', 'dropped_out', 'suspended'
);

-- ENHANCE: Admissions Table (if not already fully compatible)
-- We assume 'admissions' table exists but we adding columns if needed.
-- For this script, we'll create new tables primarily.

-- 0. Admissions Table (Missing in DB)
CREATE TABLE IF NOT EXISTS admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_no TEXT UNIQUE NOT NULL,
  applicant_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  course_applied TEXT NOT NULL,
  dob DATE,
  status admission_status DEFAULT 'applied',
  entrance_exam_score DECIMAL(5,2),
  academic_year TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Entrance Exam Management
CREATE TABLE entrance_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  exam_code TEXT UNIQUE NOT NULL,
  academic_year TEXT NOT NULL,
  exam_date DATE,
  max_score DECIMAL(5,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE entrance_exam_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID REFERENCES admissions(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES entrance_exams(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  percentile DECIMAL(5,2),
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(admission_id, exam_id)
);

-- 2. Merit List Management
CREATE TABLE merit_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., "Round 1 - Computer Science"
  academic_year TEXT NOT NULL,
  round_number INTEGER DEFAULT 1,
  cut_off_score DECIMAL(5,2) NOT NULL,
  category TEXT, -- e.g., 'General', 'SC/ST', 'OBC'
  course_identifier TEXT NOT NULL, -- Link to specific program flow
  status TEXT DEFAULT 'draft', -- draft, published, closed
  publish_date TIMESTAMPTZ,
  created_by UUID, -- Reference to admin user if needed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Academic Structure (Courses & Registration)

-- Courses Catalog
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL DEFAULT 3,
  department_id UUID, -- References departments(id) - assuming it exists
  type TEXT CHECK (type IN ('core', 'elective', 'optional')),
  level TEXT CHECK (level IN ('undergraduate', 'postgraduate')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semester Definitions
CREATE TABLE semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., "Fall 2024"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  academic_year TEXT NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  registration_start_date TIMESTAMPTZ,
  registration_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Enrollment (Program Level)
CREATE TABLE student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL, -- References users(id)
  program_name TEXT NOT NULL,
  batch_year TEXT NOT NULL, -- e.g., "2024-2028"
  current_semester INTEGER DEFAULT 1,
  status enrollment_status DEFAULT 'active',
  admission_reference_id UUID REFERENCES admissions(id), -- Link back to admission application
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Registration (Semester Level)
CREATE TABLE course_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  semester_id UUID REFERENCES semesters(id),
  course_id UUID REFERENCES courses(id),
  status TEXT DEFAULT 'registered', -- registered, dropped, withdrawn, completed
  grade TEXT, -- For later use
  credits_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, semester_id, course_id)
);

-- Enable RLS (Row Level Security) - Basic Setup
ALTER TABLE entrance_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrance_exam_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE merit_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_registrations ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for development - Open read, restricted write)
-- In production, strict policies based on user roles are needed.

CREATE POLICY "Public read access for exams" ON entrance_exams FOR SELECT USING (true);
CREATE POLICY "Admin write access for exams" ON entrance_exams FOR ALL USING (auth.role() = 'service_role'); -- Simplified

CREATE POLICY "Student read own scores" ON entrance_exam_scores FOR SELECT USING (true); -- Ideally check ownership via admission_id

CREATE POLICY "Public read courses" ON courses FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX idx_admissions_status ON admissions(status);
CREATE INDEX idx_scores_exam_id ON entrance_exam_scores(exam_id);
CREATE INDEX idx_registrations_student ON course_registrations(student_id);
