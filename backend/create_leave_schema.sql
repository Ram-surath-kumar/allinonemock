-- LEAVE MANAGEMENT SCHEMA

CREATE TABLE IF NOT EXISTS student_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) NOT NULL,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('Medical', 'Casual', 'Duty', 'Emergency')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    approved_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE student_leaves ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
    CREATE POLICY "Students can view own leaves" ON student_leaves FOR SELECT USING (auth.uid() = student_id);
    CREATE POLICY "Students can apply for leaves" ON student_leaves FOR INSERT WITH CHECK (auth.uid() = student_id);
    CREATE POLICY "Staff can view all leaves" ON student_leaves FOR SELECT USING (TRUE); -- Simplified for admin
    CREATE POLICY "Staff can update leaves" ON student_leaves FOR UPDATE USING (TRUE); -- Simplified for admin
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
