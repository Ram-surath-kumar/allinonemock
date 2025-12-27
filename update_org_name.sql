-- Update organization name from "edachennai" to "EDII Chennai"
-- Run this SQL in your Supabase SQL Editor

UPDATE organizations
SET org_name = 'EDII Chennai'
WHERE org_name = 'edachennai' OR LOWER(org_name) = 'edachennai';

-- Verify the update
SELECT id, org_id, org_code, org_name 
FROM organizations 
WHERE org_name = 'EDII Chennai';

