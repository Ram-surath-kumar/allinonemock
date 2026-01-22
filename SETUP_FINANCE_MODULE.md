# Setup Complete Finance Module

To enable the full Finance & Accounting module (v3.0), you need to update the Supabase database schema.

## Instructions

1.  **Open Supabase SQL Editor**:
    - Go to your Supabase project dashboard.
    - Navigate to the SQL Editor.

2.  **Upload or Paste SQL**:
    - Open `create_complete_finance_module.sql` from your project root.
    - Copy the entire content.
    - Paste it into the SQL Editor.

3.  **Run the Script**:
    - Click **Run**.
    - Ensure there are no errors.

## What This Creates

### 3.1 Fee Management
- `fee_categories`, `fee_heads`, `fee_structures`
- `student_fee_assignments`, `fee_installments`
- `scholarships`

### 3.2 Collections
- `transactions`, `payment_gateways`

### 3.3 Refunds
- `refund_requests`, `adjustments`

### 3.4 Accounting
- `chart_of_accounts`, `journal_entries`, `journal_lines`

### 3.5 Banking
- `bank_accounts`, `bank_transactions`

### 3.6 Tax
- `tax_settings`, `tax_records`

## Next Steps

Once the database is set up, the application will be able to perform advanced financial operations including fee installment tracking, automated journal entries, and bank reconciliation.
