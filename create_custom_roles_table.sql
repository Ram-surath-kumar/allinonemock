-- Create custom_roles table for storing custom role definitions
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_roles_name ON custom_roles(name);

-- Create index on created_by for filtering
CREATE INDEX IF NOT EXISTS idx_custom_roles_created_by ON custom_roles(created_by);

-- Enable Row Level Security (RLS)
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read custom roles
CREATE POLICY "Allow authenticated users to read custom roles"
  ON custom_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow admins to insert custom roles
CREATE POLICY "Allow admins to insert custom roles"
  ON custom_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create policy to allow admins to update custom roles
CREATE POLICY "Allow admins to update custom roles"
  ON custom_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create policy to allow admins to delete custom roles
CREATE POLICY "Allow admins to delete custom roles"
  ON custom_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add comment to table
COMMENT ON TABLE custom_roles IS 'Stores custom role definitions with their associated permissions';

