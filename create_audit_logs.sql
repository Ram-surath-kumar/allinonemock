-- Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    old_values JSONB, -- Previous state (for updates/deletes)
    new_values JSONB, -- New state (for creates/updates)
    performed_by UUID NULL, -- User ID (can be null if system action)
    user_role TEXT, -- Role of the user at the time
    ip_address TEXT,
    user_agent TEXT,
    reason TEXT, -- Contextual reason
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only Admins and Finance can view audit logs
CREATE POLICY "Admins and Finance can view audit logs" 
ON audit_logs FOR SELECT 
USING (
    auth.uid() IN (
        SELECT id FROM users WHERE role IN ('admin', 'finance')
    )
);

-- System can insert checks (service role bypasses RLS, but good to have)
CREATE POLICY "Enable insert for authenticated users" 
ON audit_logs FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');
