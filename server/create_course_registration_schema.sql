-- Create table for Courses (if not exists)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- e.g., CS101
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('Theory', 'Lab', 'Theory+Lab')),
    credits INTEGER DEFAULT 3,
    program_id UUID, -- Optional link to academic_programs
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for Course Offerings (Instances per semester)
CREATE TABLE IF NOT EXISTS course_offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    semester TEXT NOT NULL, -- e.g., 'Fall 2024'
    academic_year TEXT NOT NULL, -- e.g., '2024-25'
    faculty_id UUID REFERENCES auth.users(id), -- Faculty Name & ID
    faculty_name TEXT, -- Denormalized for convenience
    slot_timing TEXT, -- e.g., 'Mon 9:00-10:00'
    room_number TEXT,
    capacity INTEGER DEFAULT 50,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'full')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for Course Prerequisites
CREATE TABLE IF NOT EXISTS course_prerequisites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    prerequisite_course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for Add/Drop Periods
CREATE TABLE IF NOT EXISTS add_drop_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for Course Registrations
CREATE TABLE IF NOT EXISTS course_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
    registration_status TEXT DEFAULT 'Registered' CHECK (registration_status IN ('Registered', 'Dropped', 'Pending')),
    registration_type TEXT DEFAULT 'Regular' CHECK (registration_type IN ('Regular', 'Audit')),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    drop_date TIMESTAMP WITH TIME ZONE,
    prerequisite_met BOOLEAN DEFAULT TRUE,
    waiver_reason TEXT,
    approved_by UUID REFERENCES auth.users(id), -- Admin/Faculty who approved waiver
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_drop_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_registrations ENABLE ROW LEVEL SECURITY;

-- Simple Policies for development
CREATE POLICY "Enable read for authenticated users" ON courses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read for authenticated users" ON course_offerings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read for authenticated users" ON course_prerequisites FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read for authenticated users" ON add_drop_periods FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for self" ON course_registrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Enable read for all authenticated" ON course_registrations FOR SELECT USING (auth.role() = 'authenticated');
