
import { supabaseAdmin } from './common.js';

async function verifyLastUser() {
    console.log('--- Verifying Last Created User ---');
    try {
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('Error fetching user:', error);
            return;
        }

        if (!user) {
            console.log('No users found.');
            return;
        }

        console.log('Last User Found:');
        console.log('ID (UUID):', user.id);
        console.log('Name:', user.name);
        console.log('Email:', user.email);
        console.log('Org ID:', user.org_id);
        console.log('User ID (Auto-Inc):', user.user_id);
        console.log('Loop ID:', user.loopid);
        console.log('Role:', user.role);
        console.log('Created At:', user.created_at);

        if (user.loopid && user.loopid.includes('-')) {
            console.log('⚠️ WARNING: Loop ID looks like a UUID!');
        } else {
            console.log('✅ Loop ID format looks correct (not a UUID).');
        }

    } catch (err) {
        console.error('Script error:', err);
    }
}

verifyLastUser();
