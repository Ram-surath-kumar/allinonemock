
import { supabaseAdmin } from './common.js';

async function fixLastUser() {
    console.log('--- Checking Last User for Fixes ---');
    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !user) {
        console.error('Error fetching user:', error);
        return;
    }

    console.log(`Checking User: ${user.name} (ID: ${user.id})`);
    console.log(`Current Email: ${user.email}`);
    console.log(`Current LoopID: ${user.loopid}`);
    console.log(`Org: ${user.org_id}, UserID: ${user.user_id}`);

    let needsUpdate = false;
    const updates = {};

    if (!user.org_id || !user.user_id) {
        console.log('❌ Cannot fix: Missing org_id or user_id');
        return;
    }

    const correctLoopId = `${user.org_id}${user.user_id}`;
    const correctEmail = `${correctLoopId}@loopverse.in`;

    if (user.email !== correctEmail) {
        console.log(`⚠️ Email Mismatch. Expected: ${correctEmail}, Found: ${user.email}`);
        updates.email = correctEmail;
        needsUpdate = true;
    }

    if (user.loopid !== correctLoopId && user.role === 'student') {
        console.log(`⚠️ LoopID Mismatch. Expected: ${correctLoopId}, Found: ${user.loopid}`);
        updates.loopid = correctLoopId;
        needsUpdate = true;
    }

    if (needsUpdate) {
        console.log('Applying Fixes...');
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update(updates)
            .eq('id', user.id);

        if (updateError) {
            console.error('❌ Update Failed:', updateError);
        } else {
            console.log('✅ User Fixed Successfully!');
        }
    } else {
        console.log('✅ User data appears correct. No fixes needed.');
    }
}

fixLastUser();
