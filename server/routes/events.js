import express from 'express';
import { supabaseAdmin, handleError, sendSuccess } from '../common.js';
import { secureDb } from '../services/db.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Apply Authentication
router.use(authenticateUser);

/**
 * @route GET /api/events
 * @desc Get events based on role, department, or specific user ID
 */
router.get('/', async (req, res) => {
    try {
        const { department_id, role, user_id } = req.query;
        const currentUserId = user_id || req.user?.id;
        const currentUserRole = (role || req.userProfile?.role || '').toLowerCase();

        const events = await secureDb.get('events', (query) => {
            // If admin, return all
            if (currentUserRole === 'admin') return query;

            // Otherwise, filter using OR condition:
            // (role match AND department match) OR (user in assigned_to_ids)
            // Note: PostgREST OR syntax is complex via supabase-js, 
            // so we might need to do some manual filtering or use a raw query if available.
            // For now, let's fetch events that the user *might* see and filter in memory.
            return query.order('date', { ascending: false });
        });

        const filteredEvents = events.filter(e => {
            // 1. Admin bypass
            if (currentUserRole === 'admin') return true;

            // 2. Specific User Assignment
            const isAssigned = e.assigned_to_ids && Array.isArray(e.assigned_to_ids) && e.assigned_to_ids.includes(currentUserId);
            if (isAssigned) return true;

            // 3. Role and Department Match
            const roleMatch = !e.recipient_roles ||
                e.recipient_roles.length === 0 ||
                e.recipient_roles.map(r => r.toLowerCase()).includes(currentUserRole);

            const deptMatch = !e.department_id ||
                e.department_id === 'all' ||
                e.department_id === department_id ||
                e.department_id === req.userProfile?.department_id;

            return roleMatch && deptMatch;
        });

        sendSuccess(res, filteredEvents);
    } catch (error) {
        handleError(error, res, 'Failed to fetch events');
    }
});

/**
 * @route POST /api/events
 */
router.post('/', async (req, res) => {
    try {
        const context = {
            user: req.user,
            userProfile: req.userProfile,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            reason: 'Event Creation'
        };

        const eventData = {
            ...req.body,
            created_by: req.user?.id,
            participants: req.body.participants || []
        };

        const newEvent = await secureDb.create('events', eventData, context);

        // Facility booking logic (if applicable)
        if (req.body.facility_id && req.body.date && req.body.time) {
            try {
                const startDateTime = new Date(`${req.body.date}T${req.body.time}`);
                const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

                await supabaseAdmin.from('facilities_bookings').insert({
                    room_id: req.body.facility_id,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    event_name: req.body.title || 'Scheduled Event',
                    status: 'Approved',
                    organizer: req.user?.id || 'system'
                });
            } catch (err) {
                console.error('Facility booking failed:', err.message);
            }
        }

        sendSuccess(res, newEvent);
    } catch (error) {
        handleError(error, res, 'Failed to create event');
    }
});

/**
 * @route PUT /api/events/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const context = {
            user: req.user,
            userProfile: req.userProfile,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            reason: 'Event Update'
        };

        const updatedEvent = await secureDb.update('events', req.params.id, req.body, context);
        sendSuccess(res, updatedEvent);
    } catch (error) {
        handleError(error, res, 'Failed to update event');
    }
});

/**
 * @route DELETE /api/events/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const context = {
            user: req.user,
            userProfile: req.userProfile,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            reason: 'Event Deletion'
        };

        await secureDb.delete('events', req.params.id, context);
        sendSuccess(res, { message: 'Event deleted successfully' });
    } catch (error) {
        handleError(error, res, 'Failed to delete event');
    }
});

/**
 * @route POST /api/events/:id/join
 */
router.post('/:id/join', async (req, res) => {
    try {
        const { id } = req.params;
        const { student_id, payment_amount } = req.body;
        const context = { user: req.user };

        const event = await secureDb.get('events', q => q.eq('id', id).single());
        if (!event) return res.status(404).json({ error: 'Event not found' });

        if (event.type !== 'invite') return res.status(400).json({ error: 'Not an invite event' });

        const participants = event.participants || [];
        if (participants.find(p => p.student_id === student_id)) {
            return res.status(400).json({ error: 'Already joined' });
        }

        participants.push({
            student_id,
            joined_at: new Date().toISOString(),
            payment_amount: payment_amount || 0,
            payment_status: payment_amount > 0 ? 'pending' : 'not_required',
            presence_marked: false
        });

        await secureDb.update('events', id, { participants }, context);
        sendSuccess(res, { success: true });
    } catch (error) {
        handleError(error, res, 'Failed to join event');
    }
});

export default router;
