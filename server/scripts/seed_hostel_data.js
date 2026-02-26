
import { supabaseAdmin } from '../common.js';

async function seedHostelData() {
    console.log('--- Seeding Hostel Data (v2) ---');

    try {
        // 1. Create Default Hostel
        console.log('1. Creating/Checking Default Hostel...');
        const { data: hostel, error: hostelError } = await supabaseAdmin
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
        // Check existing rooms first to avoid unique constraint issues if any
        const { data: existingRooms } = await supabaseAdmin
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
                    room_type: 'Non-AC', // Changed from type to room_type based on schema guess/error
                    // actually looking at hostel.js: room_type is correct.
                    // Wait, previous error was: "Assertion failed: !(handle->flags & UV_HANDLE_CLOSED)".
                    // That's usually a node/supabase client issue when reusing connections or closing too early.
                    // Let's remove any explicit process.exit or connection closing if possible, or just use simple logic.
                });
            }
        }

        if (roomsToCreate.length > 0) {
            const { error: roomError } = await supabaseAdmin
                .from('hostel_rooms')
                .insert(roomsToCreate);
            if (roomError) {
                console.error('Room Creation Failed:', roomError.message);
                // Try one by one if batch fails?
            } else {
                console.log(`   Added ${roomsToCreate.length} rooms.`);
            }
        } else {
            console.log('   Rooms already exist.');
        }

        // Get all rooms for allocation
        const { data: allRooms } = await supabaseAdmin
            .from('hostel_rooms')
            .select('id, room_number')
            .eq('hostel_id', hostel.id);

        if (!allRooms || allRooms.length === 0) {
            throw new Error('No rooms found to allocate students to.');
        }

        // 3. Allocate Students
        console.log('3. Allocating Students...');
        const { data: students } = await supabaseAdmin
            .from('users')
            .select('id, name')
            .eq('role', 'student')
            .eq('status', 'active');

        if (students && students.length > 0) {
            let allocatedCount = 0;
            for (let i = 0; i < students.length; i++) {
                const student = students[i];
                const room = allRooms[i % allRooms.length];

                // Check using maybeSingle to avoid errors
                const { data: existingAlloc } = await supabaseAdmin
                    .from('hostel_allocations_api')
                    .select('id')
                    .eq('user_id', student.id)
                    .eq('status', 'active')
                    .maybeSingle();

                if (!existingAlloc) {
                    const { error: allocError } = await supabaseAdmin
                        .from('hostel_allocations_api')
                        .insert({
                            user_id: student.id,
                            room_id: room.id,
                            hostel_id: hostel.id,
                            status: 'active',
                            allocated_date: new Date().toISOString()
                        });

                    if (allocError) {
                        console.error(`   Failed to allocate ${student.name}: ${allocError.message}`);
                    } else {
                        console.log(`   Allocated ${student.name} to Room ${room.room_number}`);
                        allocatedCount++;
                    }
                }
            }
            console.log(`   Total new allocations: ${allocatedCount}`);
        }

    } catch (error) {
        console.error('Seeding Failed:', error);
    }
}

seedHostelData();
