-- Create exam_marks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.exam_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    score NUMERIC CHECK (score >= 0 AND score <= 100),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(exam_id, student_id)
);

-- Enable RLS
ALTER TABLE public.exam_marks ENABLE ROW LEVEL SECURITY;

-- Add policies (simplified for now)
CREATE POLICY "Enable read access for authenticated users" ON public.exam_marks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert/update for teachers and admins" ON public.exam_marks
    FOR ALL USING (
        exists (
            select 1 from public.users 
            where id = auth.uid() 
            and role in ('admin', 'vice_head', 'teacher')
        )
    );
