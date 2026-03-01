-- COMPREHENSIVE FIX SCRIPT
-- Resolves missing tables and columns reported during testing

-- 1. Tasks Table (In case it was missed previously)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.users(id),
    assigned_to_name TEXT,
    assigned_by UUID REFERENCES public.users(id),
    assigned_by_name TEXT,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', 
    priority TEXT DEFAULT 'medium', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add missing 'semester' column to fee_structures
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS semester TEXT;

-- 3. Create missing fee_assignment_rules table
CREATE TABLE IF NOT EXISTS public.fee_assignment_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    structure_id UUID REFERENCES public.fee_structures(id),
    criteria_type TEXT NOT NULL, -- e.g., 'department', 'batch', 'all'
    criteria_value TEXT,         -- e.g., 'CS', '2024'
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create missing tax_config table (Finance API expects singular tax_config)
CREATE TABLE IF NOT EXISTS public.tax_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gst_rate NUMERIC DEFAULT 18.0,
    tds_rate NUMERIC DEFAULT 10.0,
    gst_no TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert a default tax config row to prevent initial errors
INSERT INTO public.tax_config (gst_rate, tds_rate) 
SELECT 18.0, 10.0 
WHERE NOT EXISTS (SELECT 1 FROM public.tax_config);

-- 5. Add missing pickup_stop_name to transport_registrations (In case previously missed)
ALTER TABLE public.transport_registrations ADD COLUMN IF NOT EXISTS pickup_stop_name TEXT;
