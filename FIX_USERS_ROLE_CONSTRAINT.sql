-- Fix Users Table Role Constraint
-- Add driver and conductor roles to the CHECK constraint

-- Step 1: View current constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
AND contype = 'c';

-- Step 2: Drop old constraint
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 3: Add updated constraint with driver and conductor
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'vice_head', 'teacher', 'student', 'housekeeping', 'librarian', 'accountant', 'driver', 'conductor'));

-- Verify the fix
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
AND contype = 'c';
