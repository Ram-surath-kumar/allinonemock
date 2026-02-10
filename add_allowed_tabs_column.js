// Direct SQL execution to add allowed_tabs column
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

async function addColumn() {
    console.log('Adding allowed_tabs column to organizations table...');

    // First, try to add the column
    const alterTableSQL = `
    ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS allowed_tabs JSONB 
    DEFAULT '["dashboard", "chat", "users", "students", "attendance", "academic_gov", "mis_reports", "finance", "facilities", "hostel", "library", "transport", "exam", "tools", "settings"]'::jsonb;
  `;

    console.log('Executing ALTER TABLE...');

    // Use REST API directly
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql_query: alterTableSQL })
    });

    if (!response.ok) {
        console.log('exec_sql RPC not available. Please run this SQL manually in Supabase SQL Editor:');
        console.log('---START SQL---');
        console.log(alterTableSQL);
        console.log('---END SQL---');
        console.log('\nInstructions:');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Paste the SQL above');
        console.log('5. Click "Run"');
        return;
    }

    console.log('✅ Column added successfully!');

    // Update existing rows
    const { data, error } = await supabase
        .from('organizations')
        .update({
            allowed_tabs: ["dashboard", "chat", "users", "students", "attendance", "academic_gov", "mis_reports", "finance", "facilities", "hostel", "library", "transport", "exam", "tools", "settings"]
        })
        .is('allowed_tabs', null);

    if (error) {
        console.log('Note: Could not update existing rows:', error.message);
    } else {
        console.log('✅ Updated existing organizations with default tabs');
    }
}

addColumn().catch(err => {
    console.error('Error:', err.message);
    console.log('\n📝 MANUAL MIGRATION REQUIRED:');
    console.log('Please run this SQL in Supabase SQL Editor:');
    console.log('---');
    console.log(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS allowed_tabs JSONB DEFAULT '["dashboard", "chat", "users", "students", "attendance", "academic_gov", "mis_reports", "finance", "facilities", "hostel", "library", "transport", "exam", "tools", "settings"]'::jsonb;`);
    console.log('---');
});
