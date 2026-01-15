-- GRADUATION & PROGRAM SCHEMA

-- 1. Programs (Degrees/Majors)
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- e.g., 'BTECH-CS', 'MBA-Fin'
    name TEXT NOT NULL,
    department TEXT, -- Could be a reference, using text for simplicity now
    total_credits_required INTEGER DEFAULT 120,
    min_cgpa_required DECIMAL(4,2) DEFAULT 5.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Program Core Courses (Mandatory Courses)
CREATE TABLE IF NOT EXISTS program_core_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    semester_recommended INTEGER, -- e.g., 1, 2, ... 8
    UNIQUE(program_id, course_id)
);

-- 3. Student Program Assignment (Link Student to Program)
-- Adding program_id to student_profiles or a separate table. 
-- Using a separate table for cleaner separation or modifying admissions.
-- For now, let's assume one active program per student.
ALTER TABLE admissions ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id);

-- Enable RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_core_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read programs" ON programs FOR SELECT USING (true);
CREATE POLICY "Public read program requirements" ON program_core_courses FOR SELECT USING (true);

-- Seed Data (Example Programs)
INSERT INTO programs (code, name, department, total_credits_required)
VALUES 
    ('BTECH-CS', 'B.Tech Computer Science', 'Computer Science', 160),
    ('MBA', 'Master of Business Administration', 'Management', 80)
ON CONFLICT (code) DO NOTHING;
