-- Complete Finance & Accounting Module Schema
-- Run this in your Supabase SQL Editor

-- =============================================
-- 3.1 Fee Management
-- =============================================

-- Fee Categories (e.g., General, OBC, SC/ST, Staff Child)
CREATE TABLE IF NOT EXISTS fee_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee Heads (e.g., Tuition Fee, Hostel Fee, Lab Fee, Transport Fee)
CREATE TABLE IF NOT EXISTS fee_heads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('tuition', 'hostel', 'transport', 'library', 'lab', 'mess', 'other')),
    is_refundable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee Structures (Master definition for a batch/semester/category)
CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- e.g., "Grade 10 - Sem 1 - General"
    batch_year INTEGER NOT NULL, -- e.g., 2025
    semester TEXT, -- e.g., "1", "2", "Annual"
    category_id UUID REFERENCES fee_categories(id),
    due_date DATE NOT NULL,
    total_amount DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee Structure Items (Breakdown of heads in a structure)
CREATE TABLE IF NOT EXISTS fee_structure_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
    head_id UUID REFERENCES fee_heads(id),
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scholarships & Discounts
CREATE TABLE IF NOT EXISTS scholarships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('percentage', 'fixed_amount')),
    value DECIMAL(12, 2) NOT NULL, -- Percentage (e.g. 20.00) or Amount (5000.00)
    criteria TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Fee Assignments (Main tracking record for a student's fee)
CREATE TABLE IF NOT EXISTS student_fee_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) NOT NULL,
    structure_id UUID REFERENCES fee_structures(id),
    scholarship_id UUID REFERENCES scholarships(id),
    total_amount DECIMAL(12, 2) NOT NULL, -- Base amount from structure
    discount_amount DECIMAL(12, 2) DEFAULT 0, -- Calculated from scholarship
    net_amount DECIMAL(12, 2) NOT NULL, -- Total - Discount
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
    assigned_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee Installments (If allowed)
CREATE TABLE IF NOT EXISTS fee_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES student_fee_assignments(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3.2 Collections & Payments
-- =============================================

-- Payment Gateways Configuration
CREATE TABLE IF NOT EXISTS payment_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL UNIQUE, -- 'razorpay', 'stripe', 'payu'
    config JSONB NOT NULL DEFAULT '{}', -- Store API keys (exclude secrets effectively in RLS)
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions (All incoming payments)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id),
    assignment_id UUID REFERENCES student_fee_assignments(id),
    installment_id UUID REFERENCES fee_installments(id), -- Optional, if specific installment
    amount DECIMAL(12, 2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('online', 'cash', 'cheque', 'bank_transfer', 'wallet', 'demand_draft')),
    payment_gateway_id UUID REFERENCES payment_gateways(id), -- If online
    gateway_transaction_id TEXT, -- e.g., Razorpay pay_ID
    receipt_number TEXT UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    remarks TEXT,
    created_by UUID REFERENCES users(id), -- For manual entries
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3.3 Refund & Adjustments
-- =============================================

CREATE TABLE IF NOT EXISTS refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id),
    student_id UUID REFERENCES users(id),
    amount DECIMAL(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'processed')),
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    processed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id),
    assignment_id UUID REFERENCES student_fee_assignments(id),
    type TEXT CHECK (type IN ('credit', 'write_off', 'penalty')),
    amount DECIMAL(12, 2) NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3.4 General Accounting
-- =============================================

CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- e.g., '1001'
    name TEXT NOT NULL, -- e.g., 'Cash in Hand'
    type TEXT CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
    subtype TEXT, -- e.g., 'current_asset', 'direct_income'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    reference_type TEXT, -- 'transaction', 'invoice', 'salary'
    reference_id UUID,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'posted')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id),
    debit DECIMAL(15, 2) DEFAULT 0,
    credit DECIMAL(15, 2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3.5 Bank Management
-- =============================================

CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    branch_name TEXT,
    ifsc_code TEXT,
    currency TEXT DEFAULT 'INR',
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    current_balance DECIMAL(15, 2) DEFAULT 0,
    gl_account_id UUID REFERENCES chart_of_accounts(id), -- Link to GL
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id UUID REFERENCES bank_accounts(id),
    transaction_date DATE NOT NULL,
    type TEXT CHECK (type IN ('deposit', 'withdraw')),
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    reference_number TEXT, -- Cheque No, Ref ID
    transaction_id UUID REFERENCES transactions(id), -- Link to fee payment if applicable
    status TEXT DEFAULT 'cleared' CHECK (status IN ('pending', 'cleared', 'bounced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3.6 Tax Compliance
-- =============================================

CREATE TABLE IF NOT EXISTS tax_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- e.g., 'GST 18%'
    percentage DECIMAL(5, 2) NOT NULL,
    type TEXT CHECK (type IN ('gst', 'tds', 'other')),
    gl_account_id UUID REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_id UUID REFERENCES tax_settings(id),
    transaction_id UUID REFERENCES transactions(id), -- Linked to income
    expense_id UUID, -- Placeholder if linked to expense
    taxable_amount DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- =============================================
-- Triggers and Functions
-- =============================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_fee_categories_modtime BEFORE UPDATE ON fee_categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_fee_heads_modtime BEFORE UPDATE ON fee_heads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_fee_structures_modtime BEFORE UPDATE ON fee_structures FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_scholarships_modtime BEFORE UPDATE ON scholarships FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_student_fee_assignments_modtime BEFORE UPDATE ON student_fee_assignments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_fee_installments_modtime BEFORE UPDATE ON fee_installments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_transactions_modtime BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bank_accounts_modtime BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bank_transactions_modtime BEFORE UPDATE ON bank_transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- RLS Policies (Basic Setup)
-- =============================================
-- TODO: Refine based on roles (Accountant vs Admin)

ALTER TABLE fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structure_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_records ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users (General rule, restrict write to staff)
CREATE POLICY "Public Read Access" ON fee_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public Read Access" ON fee_heads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public Read Access" ON fee_structures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public Read Access" ON fee_structure_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public Read Access" ON scholarships FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public Read Access" ON student_fee_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public Read Access" ON fee_installments FOR SELECT TO authenticated USING (true);

-- Manage policies (Write access for Admins and Accountants)
-- IMPORTANT: Add 'accountant' role check logic here

CREATE POLICY "Admin/Accountant Manage" ON fee_categories FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND (users.role IN ('admin', 'accountant')))
);

-- (Repeat similar policies for other tables as needed strictly)
-- For simplicity in this script, enabling basic authenticated access for implementation
-- Secure policies should be applied in production.
