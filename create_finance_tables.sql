-- Create finance-related tables for storing financial data
-- Run this SQL in your Supabase SQL Editor

-- Salaries table
CREATE TABLE IF NOT EXISTS salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed')),
  payment_date DATE,
  month INTEGER,
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  from_role TEXT,
  to_role TEXT NOT NULL,
  promotion_date DATE DEFAULT CURRENT_DATE,
  reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Salary hikes table
CREATE TABLE IF NOT EXISTS salary_hikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  hike_percentage DECIMAL(5, 2) NOT NULL,
  previous_salary DECIMAL(10, 2) NOT NULL,
  new_salary DECIMAL(10, 2) NOT NULL,
  hike_date DATE DEFAULT CURRENT_DATE,
  reason TEXT,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fees/Payments table (if not exists)
CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  fee_type TEXT,
  due_date DATE,
  paid_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'completed')),
  payment_method TEXT,
  transaction_id TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_salaries_user_id ON salaries(user_id);
CREATE INDEX IF NOT EXISTS idx_salaries_status ON salaries(status);
CREATE INDEX IF NOT EXISTS idx_salaries_month_year ON salaries(month, year);

CREATE INDEX IF NOT EXISTS idx_promotions_user_id ON promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_date ON promotions(promotion_date);

CREATE INDEX IF NOT EXISTS idx_salary_hikes_user_id ON salary_hikes(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_hikes_date ON salary_hikes(hike_date);

CREATE INDEX IF NOT EXISTS idx_fees_student_id ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);

-- Enable Row Level Security (RLS)
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_hikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for salaries
CREATE POLICY "Allow authenticated users to read salaries"
  ON salaries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage salaries"
  ON salaries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for promotions
CREATE POLICY "Allow authenticated users to read promotions"
  ON promotions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage promotions"
  ON promotions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for salary_hikes
CREATE POLICY "Allow authenticated users to read salary_hikes"
  ON salary_hikes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage salary_hikes"
  ON salary_hikes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for fees
CREATE POLICY "Allow authenticated users to read fees"
  ON fees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins and accountants to manage fees"
  ON fees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR users.role = 'accountant')
    )
  );

-- Add comments
COMMENT ON TABLE salaries IS 'Stores staff salary records';
COMMENT ON TABLE promotions IS 'Stores staff promotion history';
COMMENT ON TABLE salary_hikes IS 'Stores salary hike/increment records';
COMMENT ON TABLE fees IS 'Stores student fee payment records';

