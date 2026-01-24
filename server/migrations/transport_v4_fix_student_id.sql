-- Change transport_registrations.student_id to UUID
-- First, drop the column constraint if any (not strictly needed if we just alter type, but safer)
-- Then alter the column type. USING clause is needed if there's data, but for empty/test data we can cast or just drop/add.
-- Since this is dev, safest for type change is usually:
ALTER TABLE transport_registrations ALTER COLUMN student_id TYPE UUID USING student_id::text::uuid;
