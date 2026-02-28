import express from 'express';
import { supabaseAdmin, handleError, sendSuccess } from '../common.js';

const router = express.Router();

// Helper for error handling removed - using common.handleError

// GET / - List all facilities (rooms flattened)
router.get('/', async (req, res) => {
    try {
        const { data: rooms, error: roomError } = await supabaseAdmin
            .from('facilities_rooms')
            .select('id, room_name, room_number, building_id, equipment')
            .order('room_name');

        if (roomError) throw roomError;
        console.log(`[GET /facilities] Found ${rooms?.length || 0} rooms`);

        const { data: buildings, error: bldError } = await supabaseAdmin
            .from('facilities_buildings')
            .select('id, name');

        if (bldError) throw bldError;
        console.log(`[GET /facilities] Found ${buildings?.length || 0} buildings`);

        // Map building names
        const buildingMap = new Map((buildings || []).map(b => [b.id, b.name]));

        const facilities = rooms.map(room => ({
            id: room.id,
            name: room.room_name || `Room ${room.room_number}`,
            building: buildingMap.get(room.building_id) || 'Unknown Building',
            fullName: `${room.room_name || `Room ${room.room_number}`} (${buildingMap.get(room.building_id) || 'Unknown Building'})`,
            equipment: room.equipment // This might be a string, array or JSON
        }));

        sendSuccess(res, facilities);
    } catch (error) {
        handleError(error, res, 'Failed to fetch all facilities');
    }
});

// GET /hierarchy
// Returns a tree: Buildings -> Floors -> Rooms
router.get('/hierarchy', async (req, res) => {
    try {
        // Fetch all buildings
        const { data: buildings, error: bldError } = await supabaseAdmin
            .from('facilities_buildings')
            .select('*')
            .order('name');

        if (bldError) throw bldError;

        // Fetch all rooms
        const { data: rooms, error: roomError } = await supabaseAdmin
            .from('facilities_rooms')
            .select('id, building_id, room_number, room_name, floor_number, room_type, status')
            .order('room_number');

        if (roomError) throw roomError;

        // Build the tree
        const tree = buildings.map(bld => {
            // Get rooms for this building
            const bldRooms = rooms.filter(r => r.building_id === bld.id);

            // Determine floors range. 
            // If bld.floors is 4, we assume floors 0, 1, 2, 3, 4 (Ground + 4) or 1..4?
            // Let's standard on 1-based for simplicity or 0-based if accepted.
            // Loop Learn likely uses 0 for ground. Let's do 0 to N-1 if N floors? 
            // Or 1 to N?
            // Let's check if any rooms have floor 0.
            // Safe bet: Union of defined floors and room floors.

            // Generate range 1 to bld.floors (inclusive) -> Assuming 1-based floor count usually means "G+3" or just 4 levels. 
            // Let's assume 0 is Ground, so we go from 0 up to bld.floors. 
            // wait, if "floors" input is 4, does it mean 4 stories? So 0, 1, 2, 3? 
            // Let's just generate distinct floors from the building property.

            const maxFloor = bld.floors || 1;
            const floorNumbers = new Set();

            // Add floors 1 to maxFloor (assuming user means 1st floor, 2nd floor...)
            // And maybe 0 for Ground?
            // Let's just do 0 to maxFloor to be safe and comprehensive.
            for (let i = 0; i <= maxFloor; i++) {
                floorNumbers.add(i);
            }

            // Also include floors from actual rooms (in case of data inconsistency)
            bldRooms.forEach(r => floorNumbers.add(r.floor_number));

            const floors = Array.from(floorNumbers).sort((a, b) => a - b).map(floorNum => ({
                floor_number: floorNum,
                rooms: bldRooms.filter(r => r.floor_number === floorNum)
            }));

            return {
                ...bld,
                total_floors: bld.floors,
                floors: floors
            };
        });

        res.json({ data: tree });

    } catch (error) {
        handleError(res, error, 'Failed to fetch facilities hierarchy');
    }
});

// POST /buildings
// Create new building
router.post('/buildings', async (req, res) => {
    try {
        const { name, code, floors, campus_location } = req.body;
        const { data, error } = await supabaseAdmin
            .from('facilities_buildings')
            .insert([{ name, code, floors, campus_location }])
            .select()
            .single();

        if (error) throw error;
        res.json({ data });
    } catch (error) {
        handleError(res, error, 'Failed to create building');
    }
});

// GET /rooms/:id
// Get full details + equipment
router.get('/rooms/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data: room, error: roomError } = await supabaseAdmin
            .from('facilities_rooms')
            .select('*')
            .eq('id', id)
            .single();

        if (roomError) throw roomError;

        // Manually fetch building details to avoid schema/foreign key issues
        let building = null;
        if (room.building_id) {
            const { data: buildingData, error: bldError } = await supabaseAdmin
                .from('facilities_buildings')
                .select('name, code, campus_location')
                .eq('id', room.building_id)
                .single();

            if (!bldError) {
                building = buildingData;
            }
        }

        // Fetch equipment
        const { data: equipmentList, error: eqError } = await supabaseAdmin
            .from('facilities_equipment')
            .select('*')
            .eq('room_id', id);

        if (eqError) throw eqError;

        res.json({
            data: {
                ...room,
                // Map the JSONB column to what frontend expects for the form state
                equipment_json: room.equipment,
                // Send the detailed list separately
                equipment_list: equipmentList,
                // Attach manually fetched building
                building: building
            }
        });

    } catch (error) {
        handleError(res, error, 'Failed to fetch room details');
    }
});

// POST /rooms
// Upsert room
router.post('/rooms', async (req, res) => {
    const roomData = req.body;
    console.log("Saving Room Data:", JSON.stringify(roomData, null, 2));
    try {
        const { data, error } = await supabaseAdmin
            .from('facilities_rooms')
            .upsert(roomData)
            .select()
            .single();

        if (error) {
            console.error("Supabase Upsert Error:", error);
            // Return full error details to frontend without crashing server
            return res.status(500).json({
                error: error.message,
                details: error
            });
        }
        res.json({ data });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST /equipment
// Upsert equipment
router.post('/equipment', async (req, res) => {
    const eqData = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('facilities_equipment')
            .upsert(eqData)
            .select()
            .single();

        if (error) throw error;
        res.json({ data });
    } catch (error) {
        handleError(res, error, 'Failed to save equipment');
    }
});

// DELETE /equipment/:id
router.delete('/equipment/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabaseAdmin
            .from('facilities_equipment')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        handleError(res, error, 'Failed to delete equipment');
    }
});

// GET /bookings/:roomId
router.get('/bookings/:roomId', async (req, res) => {
    const { roomId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('facilities_bookings')
            .select('*')
            .eq('room_id', roomId)
            .order('start_time', { ascending: true }); // Upcoming first? actually asc is better for calendar

        if (error) throw error;
        res.json({ data });
    } catch (error) {
        handleError(res, error, 'Failed to fetch bookings');
    }
});

// POST /bookings
router.post('/bookings', async (req, res) => {
    try {
        const booking = req.body;
        // Basic Overlap Check (Optional but good)
        // For MVP just insert
        const { data, error } = await supabaseAdmin
            .from('facilities_bookings')
            .insert(booking)
            .select()
            .single();

        if (error) throw error;
        res.json({ data });
    } catch (error) {
        handleError(res, error, 'Failed to create booking');
    }
});

// DELETE /bookings/:id
router.delete('/bookings/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabaseAdmin
            .from('facilities_bookings')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        handleError(res, error, 'Failed to delete booking');
    }
});

// GET /documents/:roomId
router.get('/documents/:roomId', async (req, res) => {
    const { roomId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('facilities_documents')
            .select('*')
            .eq('room_id', roomId)
            .order('uploaded_at', { ascending: false });

        if (error) throw error;
        res.json({ data });
    } catch (error) {
        handleError(res, error, 'Failed to fetch documents');
    }
});

// POST /documents
router.post('/documents', async (req, res) => {
    try {
        const doc = req.body;
        const { data, error } = await supabaseAdmin
            .from('facilities_documents')
            .insert(doc)
            .select()
            .single();

        if (error) throw error;
        res.json({ data });
    } catch (error) {
        handleError(res, error, 'Failed to add document');
    }
});

// DELETE /documents/:id
router.delete('/documents/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabaseAdmin
            .from('facilities_documents')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        handleError(res, error, 'Failed to delete document');
    }
});

export default router;
