-- Update foreign key on transport_fee_payments to ON DELETE CASCADE
ALTER TABLE transport_fee_payments 
DROP CONSTRAINT IF EXISTS transport_fee_payments_registration_id_fkey;

ALTER TABLE transport_fee_payments
ADD CONSTRAINT transport_fee_payments_registration_id_fkey
FOREIGN KEY (registration_id)
REFERENCES transport_registrations(id)
ON DELETE CASCADE;
