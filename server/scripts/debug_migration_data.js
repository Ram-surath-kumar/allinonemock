// server/scripts/debug_migration_data.js
import { supabaseAdmin } from '../common.js';

async function debug() {
    console.log('--- Migration Debugging ---');

    // 1. Check student_profiles count
    const { count: spCount, error: spError } = await supabaseAdmin
        .from('student_profiles')
        .select('*', { count: 'exact', head: true });

    if (spError) {
        console.error('Error counting student_profiles:', spError.message);
    } else {
        console.log(`Total records in student_profiles: ${spCount}`);
    }

    // 2. Check users count
    const { count: uCount, error: uError } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true });

    if (uError) {
        console.error('Error counting users:', uError.message);
    } else {
        console.log(`Total records in users: ${uCount}`);
    }

    // 3. Try a manual join check
    console.log('\nChecking for matches between users.id and student_profiles.user_id...');
    const { data: matches, error: matchError } = await supabaseAdmin
        .from('student_profiles')
        .select('user_id, college_email')
        .limit(5);

    if (matchError) {
        console.error('Error fetching sample profiles:', matchError.message);
    } else if (matches && matches.length > 0) {
        for (const sp of matches) {
            const { data: user, error: userError } = await supabaseAdmin
                .from('users')
                .select('id, name')
                .eq('id', sp.user_id)
                .single();

            if (userError) {
                console.log(`- Profile user_id ${sp.user_id} NOT FOUND in users table. Error: ${userError.message}`);
            } else {
                console.log(`- Profile user_id ${sp.user_id} MATCHES User: ${user.name} (ID: ${user.id})`);
            }
        }
    } else {
        console.log('No records found in student_profiles to check.');
    }

    // 4. Check if columns in users have data
    console.log('\nChecking if columns in users are populated...');
    const { data: sampleUsers, error: sampleError } = await supabaseAdmin
        .from('users')
        .select('id, name, college_email, dob')
        .not('college_email', 'is', null)
        .limit(5);

    if (sampleError) {
        console.error('Error checking users columns:', sampleError.message);
    } else if (sampleUsers && sampleUsers.length > 0) {
        console.log(`Found ${sampleUsers.length} users with college_email populated.`);
    } else {
        console.log('No users found with college_email populated.');
    }

    process.exit(0);
}

debug();
