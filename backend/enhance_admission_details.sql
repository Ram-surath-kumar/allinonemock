-- ENHANCE ADMISSIONS SCHEMA WITH DETAILED CATEGORIES

-- 1. Create Enums for standardized fields
DO $$ BEGIN
    CREATE TYPE student_category_status AS ENUM ('Regular', 'Distance', 'Part-Time', 'Sponsored', 'Research Scholar');
    CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Other');
    CREATE TYPE reservation_category AS ENUM ('General', 'OBC', 'SC', 'ST', 'EWS');
    CREATE TYPE nationality_type AS ENUM ('Indian', 'NRI', 'OCI', 'Foreign');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add columns to 'admissions' table
ALTER TABLE admissions 
ADD COLUMN IF NOT EXISTS gender gender_type,
ADD COLUMN IF NOT EXISTS category reservation_category,
ADD COLUMN IF NOT EXISTS student_status student_category_status DEFAULT 'Regular',
ADD COLUMN IF NOT EXISTS nationality nationality_type DEFAULT 'Indian',

-- Social Status Fields
ADD COLUMN IF NOT EXISTS is_first_generation_learner BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_bpl BOOLEAN DEFAULT FALSE, -- Below Poverty Line
ADD COLUMN IF NOT EXISTS is_minority BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS minority_type TEXT, -- e.g., Linguistic, Religious
ADD COLUMN IF NOT EXISTS is_pwd BOOLEAN DEFAULT FALSE, -- Person with Disability
ADD COLUMN IF NOT EXISTS pwd_type TEXT; -- Nature of disability

-- 3. Update 'course_registrations' for requested audit fields
-- Note: 'credits_earned' already exists. Adding others.
ALTER TABLE course_registrations
ADD COLUMN IF NOT EXISTS course_type TEXT, -- Theory, Lab
ADD COLUMN IF NOT EXISTS faculty_name TEXT,
ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES auth.users(id), -- Optional link
ADD COLUMN IF NOT EXISTS slot TEXT,
ADD COLUMN IF NOT EXISTS room_number TEXT,
ADD COLUMN IF NOT EXISTS registration_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS drop_date TIMESTAMPTZ,

-- Prerequisite Waiver tracking
ADD COLUMN IF NOT EXISTS waiver_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS waiver_reason TEXT,
ADD COLUMN IF NOT EXISTS waiver_approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_audit BOOLEAN DEFAULT FALSE;

-- 4. Update 'admissions' policies for new columns (implicit in existing policies usually, but good to verify)
-- (No specific action needed if existing policy is 'all columns')
