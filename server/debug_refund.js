
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error("No service key found");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("Attempting to update using clean Supabase client...");
    const id = '1cf556f7-37e4-4768-8371-dda74f62af80';

    // We need a valid UUID for approved_by to satisfy FK if it applies
    // I'll assume the active user (me) or a dummy UUID that exists?
    // Let's get an administrator ID first
    const { data: admin } = await supabase.from('users').select('id, role').eq('role', 'admin').limit(1).single();
    let approverId = admin?.id;

    if (!approverId) {
        console.log("No admin found, getting any user...");
        const { data: user } = await supabase.from('users').select('id').limit(1).single();
        approverId = user?.id;
    }

    console.log(`Approver ID: ${approverId}`);

    const { data, error } = await supabase
        .from('refund_requests')
        .update({
            status: 'approved',
            approved_by: approverId,
            processed_date: new Date()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error("Update Error:", error);
    } else {
        console.log("Update Success:", data);
        // Revert it so I can test again if needed? Or just leave it approved.
    }
}

run();
