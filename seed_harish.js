import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Use Service Role Key for Admin actions (creating users)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is missing. Cannot create admin client.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedHarish() {
    const email = 'harish@schoolsphere.com';
    const password = 'password123';
    const name = 'Harish';

    console.log(`Seeding user: ${email}`);

    // 1. Check if exists in Auth
    // Note: listUsers requires admin permissions
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    let userId;
    const existingUser = users?.find(u => u.email === email);

    if (existingUser) {
        console.log('Auth user already exists:', existingUser.id);
        userId = existingUser.id;
        // Optional: Update password to ensure we know it?
        await supabase.auth.admin.updateUserById(userId, { password: password });
        console.log('Password updated.');
    } else {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
        });

        if (createError) {
            console.error('Failed to create auth user:', createError.message);
            return;
        }
        console.log('Auth user created:', newUser.user.id);
        userId = newUser.user.id;
    }

    // 2. Ensure entry in public.users table (if your app uses it)
    const { error: upsertError } = await supabase.from('users').upsert({
        id: userId,
        email: email,
        name: name,
        role: 'student',
        status: 'active'
    });

    if (upsertError) {
        console.error('Failed to upsert public user:', upsertError.message);
    } else {
        console.log('Public user synced.');
    }
}

seedHarish();
