import { supabaseAdmin } from './common.js';

async function checkSchema() {
    console.log('🔍 Checking Users Schema...');
    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .limit(1);

        if (error) throw error;
        if (data && data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]));
        } else {
            console.log('No data found, cannot infer columns easily without RPC.');
            // Attempt to inserting dummy might reveal columns, but risky.
            // Let's assume selecting * worked, so we know what IS there if there's data.
            // If no data, we are stuck again. But I know there is data (13 users).
        }
    } catch (err) {
        console.error('Schema check failed:', err);
    }
}

checkSchema();
