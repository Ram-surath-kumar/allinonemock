// server/scripts/compare_data.js
import { supabaseAdmin } from '../common.js';

async function compare() {
    console.log('--- DATA COMPARISON ---');
    const { data: sps, error: spError } = await supabaseAdmin
        .from('student_profiles')
        .select('*');

    if (spError) {
        console.error('Error:', spError.message);
        process.exit(1);
    }

    for (const sp of sps) {
        const { data: user, error: uError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', sp.user_id)
            .single();

        if (uError) {
            console.log(`[FAIL] No user matches student_profile.user_id: ${sp.user_id}`);
            continue;
        }

        console.log(`\nChecking User: ${user.name} (ID: ${user.id})`);

        const fieldsCompare = [
            ['college_email', sp.college_email, user.college_email],
            ['dob', sp.dob, user.dob],
            ['gender', sp.gender, user.gender],
            ['category', sp.category, user.category],
            ['father_name', sp.father_name, user.father_name],
            ['mother_name', sp.mother_name, user.mother_name]
        ];

        fieldsCompare.forEach(([field, spVal, uVal]) => {
            const match = spVal === uVal;
            console.log(`${match ? '[ OK ]' : '[DIFF]'} ${field.padEnd(20)} | SP: ${String(spVal).padEnd(25)} | USER: ${String(uVal).padEnd(25)}`);
        });
    }
}

compare();
