-- Create table for Admission Applications
CREATE TABLE IF NOT EXISTS admission_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_no TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id), -- Optional link if they have an account
    applicant_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    course_applied TEXT NOT NULL,
    dob DATE,
    
    -- Phase 1: Application Submission
    entrance_exam_details JSONB DEFAULT '{}', -- { exam_name, date, marks, ... }
    academic_qualifications JSONB DEFAULT '{}', -- { 10th: {...}, 12th: {...} }
    merit_details JSONB DEFAULT '{}', -- { rank, category_rank, status, ... }
    
    -- Phase 2: Offer & Admission
    offer_details JSONB DEFAULT '{}', -- { offer_date, accepted, ... }
    fee_payment_details JSONB DEFAULT '{}', -- { amount, status, ... }
    document_verification_status JSONB DEFAULT '{}', -- { 10th: 'Verified', ... }
    
    -- Phase 3: Enrollment
    enrollment_details JSONB DEFAULT '{}', -- { program, batch, roll_no ... }
    
    status TEXT DEFAULT 'applied', -- applied, shortlisted, offered, admitted, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admission_applications ENABLE ROW LEVEL SECURITY;

-- Policies (simplified for development)
CREATE POLICY "Enable all access for authenticated users" ON admission_applications FOR ALL USING (auth.role() = 'authenticated');
