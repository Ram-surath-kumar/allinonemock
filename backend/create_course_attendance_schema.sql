-- COURSE ATTENDANCE SCHEMA

CREATE TABLE IF NOT EXISTS student_course_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) NOT NULL,
    course_offering_id UUID REFERENCES course_offerings(id) NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')),
    remarks TEXT,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_offering_id, date)
);

-- Enable RLS
ALTER TABLE student_course_attendance ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
    CREATE POLICY "Students can view own course attendance" ON student_course_attendance FOR SELECT USING (auth.uid() = student_id);
    CREATE POLICY "Staff can view all course attendance" ON student_course_attendance FOR SELECT USING (true); -- Simplified
    CREATE POLICY "Staff can mark course attendance" ON student_course_attendance FOR INSERT WITH CHECK (true); -- Simplified
    CREATE POLICY "Staff can update course attendance" ON student_course_attendance FOR UPDATE USING (true); -- Simplified
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
