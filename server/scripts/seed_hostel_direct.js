
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Adjust path to .env file (it's in root or server root)
// Assuming running from root, so .env is in root.
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function seedHostelDirect() {
    console.log('--- Seeding Hostel Data (Direct Standalone) ---');

    try {
        // 1. Create Default Hostel
        console.log('1. Creating/Checking Default Hostel...');
        const { data: hostel, error: hostelError } = await supabase
            .from('hostels')
            .upsert({
                name: 'Main Campus Hostel',
                address: 'Building A, University Campus',
                type: 'Boys',
                capacity: 100,
                status: 'active'
            }, { onConflict: 'name' })
            .select()
            .single();

        if (hostelError) throw hostelError;
        console.log(`   Hostel ID: ${hostel.id}`);

        // 2. Create Rooms
        console.log('2. Creating Rooms (101-110)...');
        const { data: existingRooms } = await supabase
            .from('hostel_rooms')
            .select('room_number')
            .eq('hostel_id', hostel.id);

        const existingSet = new Set(existingRooms?.map(r => r.room_number) || []);

        const roomsToCreate = [];
        for (let i = 1; i <= 10; i++) {
            const num = `1${String(i).padStart(2, '0')}`;
            if (!existingSet.has(num)) {
                roomsToCreate.push({
                    hostel_id: hostel.id,
                    room_number: num,
                    floor_number: 1,
                    capacity: 4,
                    room_type: 'Non-AC'
                });
            }
        }

        if (roomsToCreate.length > 0) {
            const { error: roomError } = await supabase
                .from('hostel_rooms')
                .insert(roomsToCreate);
            if (roomError) {
                console.error('Room Creation Failed:', roomError.message);
            } else {
                console.log(`   Added ${roomsToCreate.length} rooms.`);
            }
        }

        // Get all rooms
        const { data: allRooms } = await supabase
            .from('hostel_rooms')
            .select('id, room_number')
            .eq('hostel_id', hostel.id);

        if (!allRooms?.length) throw new Error('No rooms available');

        // 3. Allocate Students
        console.log('3. Allocating Students...');
        const { data: students } = await supabase
            .from('users')
            .select('id, name')
            .eq('role', 'student')
            .eq('status', 'active');

        if (students?.length) {
            let count = 0;
            for (let i = 0; i < students.length; i++) {
                const student = students[i];
                const room = allRooms[i % allRooms.length];

                // Check allocation
                const { data: existing } = await supabase
                    .from('hostel_allocations_api')
                    .select('id')
                    .eq('user_id', student.id)
                    .eq('status', 'active')
                    .maybeSingle();

                if (!existing) {
                    const { error: allocError } = await supabase
                        .from('hostel_allocations_api')
                        .insert({
                            user_id: student.id,
                            room_id: room.id,
                            hostel_id: hostel.id,
                            status: 'active',
                            allocated_date: new Date().toISOString()
                        });

                    if (allocError) console.error(`   Failed to allocate ${student.name}:`, allocError.message);
                    else {
                        console.log(`   Allocated ${student.name} to ${room.room_number}`);
                        count++;
                    }
                }
            }
            console.log(`   Total New Allocations: ${count}`);
        }

    } catch (e) {
        console.error('Fatal Error:', e);
    }
}

seedHostelDirect();
