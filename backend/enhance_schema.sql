-- ENHANCEMENT SCHEMA: Advanced Course Registration & Demographics

-- 1. Course Offerings (Specific Sections for a Semester)
-- This links a generic course to a specific semester with logistics.
CREATE TABLE IF NOT EXISTS course_offerings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) NOT NULL,
    semester_id UUID REFERENCES semesters(id) NOT NULL,
    faculty_id UUID REFERENCES auth.users(id), -- Or a separate faculty table
    faculty_name TEXT, -- Snapshot in case user deleted
    room_number TEXT,
    slot_code TEXT, -- e.g., "A1", "B2" or "Mon 10-11"
    capacity INTEGER DEFAULT 60,
    enrolled_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, semester_id, slot_code)
);

-- 2. Enhance Courses Table for Prerequisites
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]'::jsonb; 
-- Structure: [{ course_code: "CS101", type: "mandatory" }]

-- 3. Enhance Course Registrations for Advanced Logic
ALTER TABLE course_registrations 
ADD COLUMN IF NOT EXISTS course_offering_id UUID REFERENCES course_offerings(id),
ADD COLUMN IF NOT EXISTS registration_type TEXT DEFAULT 'credit' CHECK (registration_type IN ('credit', 'audit')),
ADD COLUMN IF NOT EXISTS dropped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_waiver_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS waiver_reason TEXT,
ADD COLUMN IF NOT EXISTS waiver_approved_by UUID, -- Admin ID
ADD COLUMN IF NOT EXISTS registration_date TIMESTAMPTZ DEFAULT NOW(); -- Distinct from created_at if needed

-- 4. Enable RLS for new table
ALTER TABLE course_offerings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read offerings" ON course_offerings FOR SELECT USING (true);

-- 5. Social & Demographic Fields (Adding to student_profiles if distinct columns preferred, 
-- but we will use the existing JSONB 'personal_info' for flexibility as planned. 
-- However, we can create a view or index for reporting if needed later.)

-- 6. Semester Settings for Add/Drop (Optional, can be on semesters table)
ALTER TABLE semesters 
ADD COLUMN IF NOT EXISTS add_drop_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS add_drop_end_date TIMESTAMPTZ;
