import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper for error handling
const handleError = (res, error, message = 'An error occurred') => {
    console.error(message, error);
    res.status(500).json({ error: message, details: error.message });
};

// GET /hierarchy
// Returns a tree: Buildings -> Floors -> Rooms
router.get('/hierarchy', async (req, res) => {
    try {
        // Fetch all buildings
        const { data: buildings, error: bldError } = await supabase
            .from('facilities_buildings')
            .select('*')
            .order('name');

        if (bldError) throw bldError;

        // Fetch all rooms
        const { data: rooms, error: roomError } = await supabase
            .from('facilities_rooms')
            .select('id, building_id, room_number, room_name, floor_number, room_type, status')
            .order('room_number');

        if (roomError) throw roomError;

        // Build the tree
        const tree = buildings.map(bld => {
            // Get rooms for this building
            const bldRooms = rooms.filter(r => r.building_id === bld.id);

            // Group by floor
            const floors = [];
            // Assuming max floors is in bld.floors, or we infer from rooms
            // Let's infer from rooms + defined floors to be safe
            const distinctFloors = [...new Set(bldRooms.map(r => r.floor_number))].sort((a, b) => a - b);

            distinctFloors.forEach(floorNum => {
                floors.push({
                    floor_number: floorNum,
                    rooms: bldRooms.filter(r => r.floor_number === floorNum)
                });
            });

            return {
                ...bld,
                floors: floors
            };
        });

        res.json({ data: tree });

    } catch (error) {
        handleError(res, error, 'Failed to fetch facilities hierarchy');
    }
});

// GET /rooms/:id
// Get full details + equipment
router.get('/rooms/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data: room, error: roomError } = await supabase
            .from('facilities_rooms')
            .select(`
                *,
                building:facilities_buildings(name, code, campus_location)
            `)
            .eq('id', id)
            .single();

        if (roomError) throw roomError;

        // Fetch equipment
        const { data: equipment, error: eqError } = await supabase
            .from('facilities_equipment')
            .select('*')
            .eq('room_id', id);

        if (eqError) throw eqError;

        res.json({ data: { ...room, equipment } });

    } catch (error) {
        handleError(res, error, 'Failed to fetch room details');
    }
});

// POST /rooms
// Upsert room
router.post('/rooms', async (req, res) => {
    const roomData = req.body;
    try {
        const { data, error } = await supabase
            .from('facilities_rooms')
            .upsert(roomData)
            .select()
            .single();

        if (error) throw error;
        res.json({ data });
    } catch (error) {
        handleError(res, error, 'Failed to save room');
    }
});

// POST /equipment
// Upsert equipment
router.post('/equipment', async (req, res) => {
    const eqData = req.body;
    try {
        const { data, error } = await supabase
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
        const { error } = await supabase
            .from('facilities_equipment')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        handleError(res, error, 'Failed to delete equipment');
    }
});

export default router;
