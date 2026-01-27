-- Create Seating Plans Table
CREATE TABLE IF NOT EXISTS seating_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL, -- Nullable if just reserving a seat
  center_id TEXT NOT NULL,
  room_number TEXT NOT NULL,
  seat_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique seat per exam
  UNIQUE(exam_id, center_id, room_number, seat_number)
);

-- Index for faster lookup by exam
CREATE INDEX IF NOT EXISTS idx_seating_exam_id ON seating_plans(exam_id);
CREATE INDEX IF NOT EXISTS idx_seating_student_id ON seating_plans(student_id);

-- Create Hall Tickets Table
CREATE TABLE IF NOT EXISTS hall_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'GENERATED', -- GENERATED, DOWNLOADED, BLOCKED
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_url TEXT, -- Optional link to PDF if pre-generated
  
  -- Unique ticket per student per exam
  UNIQUE(exam_id, student_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_hall_tickets_exam_id ON hall_tickets(exam_id);
CREATE INDEX IF NOT EXISTS idx_hall_tickets_student_id ON hall_tickets(student_id);

-- Check constraints for valid status
ALTER TABLE hall_tickets ADD CONSTRAINT check_hall_ticket_status 
  CHECK (status IN ('GENERATED', 'DOWNLOADED', 'BLOCKED'));
