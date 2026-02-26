-- Add missing description column to hostels table

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hostels' AND column_name='description') THEN 
        ALTER TABLE public.hostels ADD COLUMN description text;
    END IF;
END $$;
