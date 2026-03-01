-- Create tables for Events and Tasks in Supabase
-- Drop existing tables to ensure clean schema migration
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;

-- 1. Events Table
CREATE TABLE public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'information', -- 'information', 'invite'
    fee DECIMAL(10, 2) DEFAULT 0,
    department_id TEXT, -- Can be 'all' or UUID
    date DATE NOT NULL,
    time TIME NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    recipient_roles TEXT[], -- Array of roles like ['student', 'teacher']
    assigned_to_ids UUID[], -- Specific student/user IDs
    facility_id UUID,
    created_by UUID REFERENCES public.users(id),
    participants JSONB DEFAULT '[]'::jsonb, -- Store participants for invite events
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tasks Table
CREATE TABLE public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.users(id),
    assigned_to_name TEXT,
    assigned_by UUID REFERENCES public.users(id),
    assigned_by_name TEXT,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'in_progress'
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- Enable RLS (Assuming default policies or handles via service role in backend)
-- ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
