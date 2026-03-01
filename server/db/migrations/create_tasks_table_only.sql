-- Standalone SQL to create the Tasks table in Supabase
-- Run this if the Assign Task feature still shows a 500 error

CREATE TABLE IF NOT EXISTS public.tasks (
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

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
