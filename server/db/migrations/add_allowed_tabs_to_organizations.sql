-- Migration: Add allowed_tabs to organizations table
-- This allows super admins to control which tabs/features are available to each organization

-- Add allowed_tabs column to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS allowed_tabs JSONB DEFAULT '["dashboard", "chat", "users", "students", "attendance", "academic_gov", "mis_reports", "finance", "facilities", "hostel", "library", "transport", "exam", "tools", "settings"]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN organizations.allowed_tabs IS 'Array of tab identifiers that are enabled for this organization';

-- Update existing organizations to have all tabs enabled by default
UPDATE organizations
SET allowed_tabs = '["dashboard", "chat", "users", "students", "attendance", "academic_gov", "mis_reports", "finance", "facilities", "hostel", "library", "transport", "exam", "tools", "settings"]'::jsonb
WHERE allowed_tabs IS NULL;
