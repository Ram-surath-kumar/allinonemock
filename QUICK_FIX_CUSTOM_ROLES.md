# Quick Fix: Create Custom Roles Table

The `custom_roles` table is missing in your Supabase database. Follow these steps to create it:

## Step 1: Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/vzkbyzpqnojhlazwopvz/sql/new

## Step 2: Copy and Run This SQL

```sql
-- Create custom_roles table
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_roles_name ON custom_roles(name);
CREATE INDEX IF NOT EXISTS idx_custom_roles_created_by ON custom_roles(created_by);

-- Enable RLS
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read custom roles"
  ON custom_roles FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to insert
CREATE POLICY "Allow admins to insert custom roles"
  ON custom_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Allow admins to update
CREATE POLICY "Allow admins to update custom roles"
  ON custom_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Allow admins to delete
CREATE POLICY "Allow admins to delete custom roles"
  ON custom_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

## Step 3: Click "Run" (or press Cmd/Ctrl + Enter)

## Step 4: Verify

After running, try creating a role again in the Tools page. It should work now! ✅

## Alternative: Disable RLS (Development Only)

If you're having RLS issues and just want to test:

```sql
ALTER TABLE custom_roles DISABLE ROW LEVEL SECURITY;
```

**Note**: Keep RLS enabled for production security.

