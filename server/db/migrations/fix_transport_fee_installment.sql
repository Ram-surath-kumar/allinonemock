-- Add missing column to transport_fee_payments table
ALTER TABLE IF EXISTS public.transport_fee_payments ADD COLUMN IF NOT EXISTS installment_no INTEGER DEFAULT 1;
