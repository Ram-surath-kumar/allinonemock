-- ACADEMIC RECORDS SCHEMA

-- 1. Student Academic Records (Per Semester Summary)
CREATE TABLE IF NOT EXISTS student_academic_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) NOT NULL,
    semester_id UUID REFERENCES semesters(id) NOT NULL,
    credits_attempted INTEGER DEFAULT 0,
    credits_earned INTEGER DEFAULT 0,
    sgpa DECIMAL(4,2), -- Semester GPA
    cgpa DECIMAL(4,2), -- Cumulative GPA
    standing TEXT DEFAULT 'Good' CHECK (standing IN ('Good', 'Probation', 'Suspended', 'Dean List')),
    remarks TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, semester_id)
);

-- 2. Official Transcripts (Optional, but good for linking documents)
CREATE TABLE IF NOT EXISTS student_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) NOT NULL,
    document_url TEXT NOT NULL,
    issued_date DATE DEFAULT CURRENT_DATE,
    type TEXT DEFAULT 'official',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE student_academic_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read academic records" ON student_academic_records FOR SELECT USING (true);
