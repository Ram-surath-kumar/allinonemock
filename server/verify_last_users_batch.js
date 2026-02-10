
import { supabaseAdmin } from './common.js';

async function verifyLastUsers() {
    console.log('--- Verifying Last 5 Created Users ---');
    try {
        const { data: users, error } = await supabaseAdmin
            .from('users')
            .select('id, name, email, loopid, role, created_at, org_id')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error fetching users:', error);
            return;
        }

        if (!users || users.length === 0) {
            console.log('No users found.');
            return;
        }

        users.forEach((user, index) => {
            console.log(`[User ${index + 1}] ${user.name} (${user.role})`);
            console.log(`  Email: ${user.email}`);
            console.log(`  LoopID: ${user.loopid}`);
            console.log(`  OrgID: ${user.org_id}`);

            if (user.loopid && user.loopid.includes('-')) {
                console.log('  ⚠️ STATUS: UUID Detected in LoopID');
            } else if (user.email && user.email.includes('pending_')) {
                console.log('  ⚠️ STATUS: Pending Email (UUID)');
            } else {
                console.log('  ✅ STATUS: OK');
            }
            console.log('---');
        });

    } catch (err) {
        console.error('Script error:', err);
    }
}

verifyLastUsers();
