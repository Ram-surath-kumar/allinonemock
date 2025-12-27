# Setup Custom Roles Table

The `custom_roles` table needs to be created in your Supabase database before you can use the role management feature.

## Quick Setup

1. **Open Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/vzkbyzpqnojhlazwopvz/sql/new

2. **Copy and paste the SQL below**:

```sql
-- Create custom_roles table for storing custom role definitions
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
```

3. **Click "Run"** (or press Cmd/Ctrl + Enter)

4. **Verify the table was created**:
   - Go to: https://supabase.com/dashboard/project/vzkbyzpqnojhlazwopvz/editor
   - You should see `custom_roles` in the table list

5. **Try creating a role again** - it should work now! ✅

## Alternative: Disable RLS (For Development Only)

If you're having issues with RLS policies and just want to test quickly:

```sql
ALTER TABLE custom_roles DISABLE ROW LEVEL SECURITY;
```

**Note**: This is less secure and should only be used for development. For production, keep RLS enabled.

