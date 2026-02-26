-- Fix missing unique constraints for upsert operations in the backend

-- 1. Attendance Table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_student_id_date_key') THEN 
        ALTER TABLE public.attendance ADD CONSTRAINT attendance_student_id_date_key UNIQUE (student_id, date);
    END IF;
END $$;

-- 2. Exam Marks Table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exam_marks_exam_id_student_id_key') THEN 
        ALTER TABLE public.exam_marks ADD CONSTRAINT exam_marks_exam_id_student_id_key UNIQUE (exam_id, student_id);
    END IF;
END $$;

-- 3. Hall Tickets Table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hall_tickets_exam_id_student_id_key') THEN 
        ALTER TABLE public.hall_tickets ADD CONSTRAINT hall_tickets_exam_id_student_id_key UNIQUE (exam_id, student_id);
    END IF;
END $$;
