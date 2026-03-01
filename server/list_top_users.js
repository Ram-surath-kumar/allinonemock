import { supabaseAdmin } from './common.js';

async function listUsers() {
    console.log('--- Listing Top 10 Users ---');
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, loopid, name, role')
        .limit(10);

    if (error) {
        console.error('❌ Error fetching users:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('ℹ️ No users found in the database.');
    } else {
        console.table(data);
    }
}

listUsers();
