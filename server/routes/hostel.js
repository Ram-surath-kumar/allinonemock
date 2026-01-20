import express from 'express';
import { supabaseAdmin } from '../common.js';
import { handleError, sendSuccess, sendValidationError } from '../common.js';
import { feeService } from '../services/feeService.js';

const router = express.Router();

// Get hostel dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    // Get all hostels
    const { data: hostels, error: hostelsError } = await supabaseAdmin
      .from('hostels')
      .select('*');

    if (hostelsError) {
      throw hostelsError;
    }

    // Get all rooms
    const { data: rooms, error: roomsError } = await supabaseAdmin
      .from('hostel_rooms')
      .select('*');

    if (roomsError) {
      throw roomsError;
    }

    // Get all allocations
    const { data: allocations, error: allocationsError } = await supabaseAdmin
      .from('hostel_allocations_api')
      .select('*');

    if (allocationsError) {
      throw allocationsError;
    }

    // Calculate stats
    const totalHostels = hostels?.length || 0;
    const totalRooms = rooms?.length || 0;
    const totalBeds = rooms?.reduce((sum, room) => sum + (room.capacity || 0), 0) || 0;
    const occupiedBeds = allocations?.filter(a => a.status === 'active').length || 0;
    const availableBeds = totalBeds - occupiedBeds;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const stats = {
      totalHostels,
      totalRooms,
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate
    };

    sendSuccess(res, {
      stats,
      hostels: hostels || [],
      rooms: rooms || [],
      allocations: allocations || []
    });
  } catch (error) {
    handleError(error, res, 'Failed to fetch hostel dashboard data');
  }
});

// Get all hostels
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('hostels')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    sendSuccess(res, data || []);
  } catch (error) {
    handleError(error, res, 'Failed to fetch hostels');
  }
});

// Create a new hostel
router.post('/', async (req, res) => {
  try {
    const { name, address, capacity, description, type, gender, contact_info, facilities } = req.body;

    if (!name) {
      return sendValidationError(res, 'name is required');
    }

    const { data, error } = await supabaseAdmin
      .from('hostels')
      .insert({
        name,
        address: address || null,
        capacity: capacity || null,
        description: description || null,
        type: type || null,
        gender: gender || null,
        contact_info: contact_info || null,
        facilities: facilities || {}
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to create hostel');
  }
});

// Get all rooms
router.get('/rooms', async (req, res) => {
  try {
    const { hostel_id } = req.query;

    let query = supabaseAdmin
      .from('hostel_rooms')
      .select('*');

    if (hostel_id) {
      query = query.eq('hostel_id', hostel_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    sendSuccess(res, data || []);
  } catch (error) {
    handleError(error, res, 'Failed to fetch rooms');
  }
});

// Create a new room
router.post('/rooms', async (req, res) => {
  try {
    const { hostel_id, room_number, capacity, room_type } = req.body;

    if (!hostel_id || !room_number) {
      return sendValidationError(res, 'hostel_id and room_number are required');
    }

    const { data, error } = await supabaseAdmin
      .from('hostel_rooms')
      .insert({
        hostel_id,
        room_number,
        capacity: capacity || 1,
        room_type: room_type || 'standard'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to create room');
  }
});

// Get all allocations
router.get('/allocations', async (req, res) => {
  try {
    const { hostel_id, room_id, user_id, status } = req.query;

    let query = supabaseAdmin
      .from('hostel_allocations_api')
      .select('*');

    if (hostel_id) {
      query = query.eq('hostel_id', hostel_id);
    }
    if (room_id) {
      query = query.eq('room_id', room_id);
    }
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('allocated_date', { ascending: false });

    if (error) {
      throw error;
    }

    sendSuccess(res, data || []);
  } catch (error) {
    handleError(error, res, 'Failed to fetch allocations');
  }
});

// Create a new allocation
router.post('/allocations', async (req, res) => {
  try {
    const { user_id, room_id, hostel_id } = req.body;

    if (!user_id || !room_id) {
      return sendValidationError(res, 'user_id and room_id are required');
    }

    // Check if room has available capacity
    const { data: room, error: roomError } = await supabaseAdmin
      .from('hostel_rooms')
      .select('*')
      .eq('id', room_id)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ data: null, error: 'Room not found' });
    }

    // Count current allocations for this room
    const { data: currentAllocations, error: allocError } = await supabaseAdmin
      .from('hostel_allocations_api')
      .select('id')
      .eq('room_id', room_id)
      .eq('status', 'active');

    if (allocError) {
      throw allocError;
    }

    const currentOccupancy = currentAllocations?.length || 0;
    if (currentOccupancy >= (room.capacity || 1)) {
      return res.status(400).json({ data: null, error: 'Room is at full capacity' });
    }

    // Check if user already has an active allocation
    const { data: existingAlloc, error: existingError } = await supabaseAdmin
      .from('hostel_allocations_api')
      .select('id')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single();

    if (existingAlloc) {
      return res.status(400).json({ data: null, error: 'User already has an active allocation' });
    }

    // Create allocation
    const { data, error } = await supabaseAdmin
      .from('hostel_allocations_api')
      .insert({
        user_id,
        room_id,
        hostel_id: hostel_id || room.hostel_id,
        allocated_date: new Date().toISOString().split('T')[0],
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // AUTO-FEE GENERATION
    try {
      const context = {
        user: { id: 'system' }, // Default context since we might not have full req.user in this route yet
        reason: 'Hostel Room Allocation'
      };
      await feeService.assignHostelFee(user_id, room_id, context);
    } catch (feeError) {
      console.error('Failed to assign hostel fee:', feeError);
      // Don't fail the response, just log it
    }

    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to create allocation');
  }
});

export default router;

