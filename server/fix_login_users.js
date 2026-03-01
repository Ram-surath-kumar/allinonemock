import { supabaseAdmin } from './common.js';

async function fixUsers() {
    console.log('--- Fixing/Ensuring Base Users ---');

    try {
        // 1. Ensure Organization
        let orgId;
        const { data: orgs, error: orgError } = await supabaseAdmin
            .from('organizations')
            .select('id')
            .eq('org_code', 'AU-LV001')
            .limit(1);

        if (orgError) throw orgError;

        if (orgs.length === 0) {
            console.log('Creating organization AU-LV001...');
            const { data: newOrg, error: createOrgError } = await supabaseAdmin
                .from('organizations')
                .insert({
                    org_name: 'Anna University Affiliated - Loop Demo',
                    org_code: 'AU-LV001',
                    contact_info: { phone: "044-22357004", email: "admin@au-loop.edu.in", address: "Guindy, Chennai" }
                })
                .select()
                .single();
            if (createOrgError) throw createOrgError;
            orgId = newOrg.id;
        } else {
            orgId = orgs[0].id;
        }
        console.log('Organization ID:', orgId);

        // 2. Ensure Department
        let deptId;
        const { data: depts, error: deptError } = await supabaseAdmin
            .from('departments')
            .select('id')
            .eq('code', 'CSE')
            .limit(1);

        if (deptError) throw deptError;

        if (depts.length === 0) {
            console.log('Creating department CSE...');
            const { data: newDept, error: createDeptError } = await supabaseAdmin
                .from('departments')
                .insert({
                    org_id: orgId,
                    name: 'Computer Science and Engineering',
                    code: 'CSE',
                    description: 'B.Tech IT & CSE Dept',
                    email: 'cse@au-loop.edu.in'
                })
                .select()
                .single();
            if (createDeptError) throw createDeptError;
            deptId = newDept.id;
        } else {
            deptId = depts[0].id;
        }
        console.log('Department ID:', deptId);

        // 3. Ensure Admin User
        const { data: adminUsers, error: adminError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', 'admin@loopverse.in')
            .limit(1);

        if (adminError) throw adminError;

        if (adminUsers.length === 0) {
            console.log('Creating admin user...');
            const { error: createAdminError } = await supabaseAdmin
                .from('users')
                .insert({
                    org_id: orgId,
                    department_id: deptId,
                    name: 'System Admin',
                    email: 'admin@loopverse.in',
                    role: 'admin',
                    status: 'active',
                    loopid: 'admin'
                });
            if (createAdminError) throw createAdminError;
        } else {
            console.log('Admin user already exists.');
        }

        // 4. Ensure Student User (1000120002)
        const { data: studentUsers, error: studentError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('loopid', '1000120002')
            .limit(1);

        if (studentError) throw studentError;

        if (studentUsers.length === 0) {
            console.log('Creating student user 1000120002...');
            const { error: createStudentError } = await supabaseAdmin
                .from('users')
                .insert({
                    org_id: orgId,
                    department_id: deptId,
                    name: 'Karthik Kumar',
                    email: '1000120002@loopverse.in',
                    role: 'student',
                    status: 'active',
                    loopid: '1000120002',
                    user_id: 120002
                });
            if (createStudentError) throw createStudentError;
        } else {
            console.log('Student user 1000120002 already exists. Updating email...');
            const { error: updateStudentError } = await supabaseAdmin
                .from('users')
                .update({ email: '1000120002@loopverse.in' })
                .eq('loopid', '1000120002');
            if (updateStudentError) throw updateStudentError;
        }

        console.log('✅ Base users ensured successfully!');

    } catch (err) {
        console.error('❌ Error executing fix:', err.message);
        if (err.details) console.error('Details:', err.details);
        if (err.hint) console.error('Hint:', err.hint);
    }
}

fixUsers();
