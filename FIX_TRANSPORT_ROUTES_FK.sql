-- Fix Transport Routes Foreign Key Constraint
-- This script addresses the mismatch between vehicles and transport_vehicles tables

-- Step 1: Identify orphaned routes (routes pointing to non-existent vehicles)
SELECT 
    tr.id as route_id, 
    tr.route_name,
    tr.vehicle_id,
    'No matching vehicle' as issue
FROM transport_routes tr
LEFT JOIN vehicles v ON tr.vehicle_id = v.id
WHERE v.id IS NULL AND tr.vehicle_id IS NOT NULL;

-- Step 2: OPTION A - Set orphaned routes to NULL (recommended for now)
UPDATE transport_routes
SET vehicle_id = NULL
WHERE vehicle_id NOT IN (SELECT id FROM vehicles)
  AND vehicle_id IS NOT NULL;

-- Step 3: Drop old foreign key
ALTER TABLE transport_routes 
DROP CONSTRAINT IF EXISTS transport_routes_vehicle_id_fkey;

-- Step 4: Add new foreign key pointing to vehicles table
ALTER TABLE transport_routes 
ADD CONSTRAINT transport_routes_vehicle_id_fkey 
FOREIGN KEY (vehicle_id) 
REFERENCES vehicles(id) 
ON DELETE SET NULL;

-- Verify the fix
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='transport_routes'
  AND kcu.column_name='vehicle_id';
