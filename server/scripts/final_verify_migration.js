// server/scripts/final_verify_migration.js
import { supabaseAdmin } from '../common.js';

async function verify() {
    console.log('--- Final Migration Verification ---');

    // 1. Check if student_profiles table exists
    console.log('1. Checking student_profiles table existence...');
    const { error: tableError } = await supabaseAdmin
        .from('student_profiles')
        .select('count');

    if (tableError && tableError.code === 'PGRST116') {
        console.log('SUCCESS: student_profiles table NOT found (as expected).');
    } else if (tableError && tableError.code === '42P01') {
        console.log('SUCCESS: student_profiles table DOES NOT EXIST.');
    } else if (!tableError) {
        console.log('WARNING: student_profiles table STILL EXISTS.');
    } else {
        console.log('Info: Got error checking table:', tableError.code, tableError.message);
    }

    // 2. Check users table for student data
    console.log('\n2. Checking users table for student data...');
    const { data: students, error: studentError } = await supabaseAdmin
        .from('users')
        .select('id, name, loopid, college_email, category, family_income, is_first_graduate')
        .eq('role', 'student')
        .limit(5);

    if (studentError) {
        console.error('ERROR fetching students:', studentError.message);
    } else {
        console.log(`Found ${students.length} students in users table.`);
        students.forEach(s => {
            console.log(`- Student: ${s.name} (${s.loopid || 'No LoopID'})`);
            console.log(`  Email: ${s.college_email || 'None'}`);
            console.log(`  Category: ${s.category || 'None'}`);
            console.log(`  First Graduate: ${s.is_first_graduate || 'None'}`);
        });
    }

    // 3. Check for specific columns
    console.log('\n3. Verifying columns exist in users...');
    const columnsToCheck = [
        'gender', 'dob', 'blood_group', 'religion', 'aadhar_no',
        'current_street', 'permanent_street', 'father_name', 'medical_history'
    ];

    const { data: colData, error: colError } = await supabaseAdmin
        .from('users')
        .select(columnsToCheck.join(','))
        .limit(1);

    if (colError) {
        console.error('ERROR: Some columns are missing from users table:', colError.message);
    } else {
        console.log('SUCCESS: All checked columns exist in the users table.');
    }

    process.exit(0);
}

verify();
