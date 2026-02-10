// Apply allowed_tabs migration to organizations table
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    console.log('Applying migration: add_allowed_tabs_to_organizations');

    try {
        // Execute the migration SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: `
        -- Add allowed_tabs column to organizations table
        ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS allowed_tabs JSONB DEFAULT '["dashboard", "chat", "users", "students", "attendance", "academic_gov", "mis_reports", "finance", "facilities", "hostel", "library", "transport", "exam", "tools", "settings"]'::jsonb;

        -- Add comment to explain the column
        COMMENT ON COLUMN organizations.allowed_tabs IS 'Array of tab identifiers that are enabled for this organization';

        -- Update existing organizations to have all tabs enabled by default
        UPDATE organizations
        SET allowed_tabs = '["dashboard", "chat", "users", "students", "attendance", "academic_gov", "mis_reports", "finance", "facilities", "hostel", "library", "transport", "exam", "tools", "settings"]'::jsonb
        WHERE allowed_tabs IS NULL;
      `
        });

        if (error) {
            // If exec_sql RPC doesn't exist, try direct SQL execution
            console.log('Trying alternative method...');

            const query = `
        ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS allowed_tabs JSONB DEFAULT '["dashboard", "chat", "users", "students", "attendance", "academic_gov", "mis_reports", "finance", "facilities", "hostel", "library", "transport", "exam", "tools", "settings"]'::jsonb;
      `;

            const { error: altError } = await supabase.from('organizations').select('*').limit(0);

            if (altError) {
                throw new Error(`Migration failed: ${altError.message}`);
            }

            console.log('⚠️  Cannot execute DDL via Supabase client. Please run the SQL file manually in Supabase SQL Editor:');
            console.log('📁 File: server/db/migrations/add_allowed_tabs_to_organizations.sql');
            console.log('\nOr copy this SQL and run it in Supabase Dashboard > SQL Editor:\n');
            console.log('---');
            const fs = await import('fs');
            const sql = fs.readFileSync('./server/db/migrations/add_allowed_tabs_to_organizations.sql', 'utf-8');
            console.log(sql);
            console.log('---');
            return;
        }

        console.log('✅ Migration applied successfully');

        // Verify the migration
        const { data: orgs, error: verifyError } = await supabase
            .from('organizations')
            .select('id, org_name, allowed_tabs')
            .limit(3);

        if (verifyError) {
            console.error('Error verifying migration:', verifyError);
        } else {
            console.log('\n📋 Sample organizations after migration:');
            console.log(JSON.stringify(orgs, null, 2));
        }

    } catch (err) {
        console.error('❌ Migration error:', err);
        console.log('\n⚠️  Please run the SQL file manually in Supabase SQL Editor:');
        console.log('📁 File: server/db/migrations/add_allowed_tabs_to_organizations.sql');
        process.exit(1);
    }
}

applyMigration();
