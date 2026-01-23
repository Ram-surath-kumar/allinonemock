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

// Get all vehicles
router.get('/vehicles', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        handleError(res, error, 'Failed to fetch vehicles');
    }
});

// Get vehicle details by ID (including notes and tasks)
router.get('/vehicles/:id', async (req, res) => {
    try {
        const { data: vehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (vehicleError) throw vehicleError;

        const { data: notes, error: notesError } = await supabase
            .from('vehicle_notes')
            .select('*')
            .eq('vehicle_id', req.params.id)
            .order('created_at', { ascending: false });

        const { data: tasks, error: tasksError } = await supabase
            .from('vehicle_tasks')
            .select('*')
            .eq('vehicle_id', req.params.id)
            .order('due_date', { ascending: true });

        res.json({
            success: true,
            data: {
                ...vehicle,
                notes: notes || [],
                tasks: tasks || []
            }
        });
    } catch (error) {
        handleError(res, error, 'Failed to fetch vehicle details');
    }
});

// Create new vehicle
router.post('/vehicles', async (req, res) => {
    try {
        console.log('Creating vehicle via RPC:', req.body.vehicle_id);
        const { data, error } = await supabase
            .rpc('create_vehicle', { vehicle_data: req.body });


        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (error) {
        handleError(res, error, 'Failed to create vehicle');
    }
});


// Update vehicle
router.put('/vehicles/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('vehicles')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        handleError(res, error, 'Failed to update vehicle');
    }
});

// Delete vehicle
router.delete('/vehicles/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Vehicle deleted successfully' });
    } catch (error) {
        handleError(res, error, 'Failed to delete vehicle');
    }
});

// Add Note
router.post('/vehicles/:id/notes', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('vehicle_notes')
            .insert([{
                vehicle_id: req.params.id,
                ...req.body
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (error) {
        handleError(res, error, 'Failed to add note');
    }
});

// Add Task
router.post('/vehicles/:id/tasks', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('vehicle_tasks')
            .insert([{
                vehicle_id: req.params.id,
                ...req.body
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (error) {
        handleError(res, error, 'Failed to add task');
    }
});

export default router;
