# Setup Finance Tables

The Finance tab requires several database tables to be created in Supabase. Follow these steps:

## Quick Setup

1. **Open Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/vzkbyzpqnojhlazwopvz/sql/new

2. **Copy and paste the SQL from `create_finance_tables.sql`**:
   - This will create: `salaries`, `promotions`, `salary_hikes`, and `fees` tables
   - All tables include proper indexes and RLS policies

3. **Click "Run"** (or press Cmd/Ctrl + Enter)

4. **Verify the tables were created**:
   - Go to: https://supabase.com/dashboard/project/vzkbyzpqnojhlazwopvz/editor
   - You should see the new tables in the list

## Tables Created

- **salaries**: Stores staff salary records
- **promotions**: Stores staff promotion history
- **salary_hikes**: Stores salary hike/increment records
- **fees**: Stores student fee payment records (if not already exists)

## Features Available After Setup

Once the tables are created, the Finance tab will display:

1. **Total Income**: Sum of all paid fees and payments
2. **Salary Paid**: Total salaries paid to staff
3. **Net Profit**: Income minus expenses
4. **Career Growth**: Staff career progression with promotions and hikes
5. **Promotion Details**: Complete history of staff promotions
6. **Hike Rate**: Average hike rate and individual salary increments

## Note

If tables don't exist, the Finance tab will still load but show 0 values. You can add data through the Supabase dashboard or create additional endpoints to manage this data.

