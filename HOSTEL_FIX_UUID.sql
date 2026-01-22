-- FIX: Change hostel_allocations_api.user_id from UUID to INTEGER
-- This matches the type of users.id which is an integer

-- Step 1: Drop the existing user_id column
ALTER TABLE hostel_allocations_api 
DROP COLUMN IF EXISTS user_id;

-- Step 2: Add user_id back as INTEGER with foreign key constraint
ALTER TABLE hostel_allocations_api 
ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Optional: Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_hostel_allocations_user_id 
ON hostel_allocations_api(user_id);

-- Note: This will delete any existing allocations.
-- If you have important allocation data, back it up first!
