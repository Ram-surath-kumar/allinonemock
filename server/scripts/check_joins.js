// server/scripts/check_joins.js
import { supabaseAdmin } from '../common.js';

async function check() {
    console.log('--- JOIN CHECK ---');
    const { data: sps, error: spError } = await supabaseAdmin
        .from('student_profiles')
        .select('user_id, college_email, student_id_no');

    if (spError) {
        console.error('Error:', spError.message);
        process.exit(1);
    }

    for (const sp of sps) {
        const { data: user, error: uError } = await supabaseAdmin
            .from('users')
            .select('id, name, college_email')
            .eq('id', sp.user_id)
            .single();

        if (uError) {
            console.log(`[FAIL] No user matches student_profile.user_id: ${sp.user_id}`);
        } else {
            console.log(`[MATCH] User: ${user.name} (ID: ${user.id})`);
            console.log(`   SP Email: ${sp.college_email}`);
            console.log(`   User Email: ${user.college_email}`);
        }
    }
}

check();
