-- Fix missing elements for SIM module

-- 1. Add course_id to course_registrations if not exists
-- This allows direct joining with courses table as expected by some backend routes
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='course_registrations' AND column_name='course_id') THEN 
        ALTER TABLE public.course_registrations ADD COLUMN course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Create student_academic_records table if not exists
CREATE TABLE IF NOT EXISTS public.student_academic_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    semester_id UUID REFERENCES public.semesters(id) NOT NULL,
    credits_attempted INTEGER DEFAULT 0,
    credits_earned INTEGER DEFAULT 0,
    sgpa NUMERIC DEFAULT 0.0,
    cgpa NUMERIC DEFAULT 0.0,
    standing TEXT DEFAULT 'Good' CHECK (standing IN ('Good', 'Probation', 'Suspended', 'Dean List')),
    remarks TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, semester_id)
);

-- 3. Create student_transcripts table if not exists
CREATE TABLE IF NOT EXISTS public.student_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,
    issued_date DATE DEFAULT CURRENT_DATE,
    type TEXT DEFAULT 'official' CHECK (type IN ('official', 'unofficial')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for new tables
ALTER TABLE public.student_academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_transcripts ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_academic_records' AND policyname = 'Users can view their own academic records') THEN
        CREATE POLICY "Users can view their own academic records" ON public.student_academic_records
            FOR SELECT USING (auth.uid() = student_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_transcripts' AND policyname = 'Users can view their own transcripts') THEN
        CREATE POLICY "Users can view their own transcripts" ON public.student_transcripts
            FOR SELECT USING (auth.uid() = student_id);
    END IF;
END $$;
