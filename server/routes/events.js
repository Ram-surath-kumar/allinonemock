import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabaseAdmin } from '../common.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/events.json');

const readData = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const dir = path.dirname(DATA_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(DATA_FILE, '[]');
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading events:', error);
        return [];
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing events:', error);
        return false;
    }
};

router.get('/', (req, res) => {
    const { department_id, role } = req.query;
    console.log(`[GET /events] Filtering params - Role: ${role}, Dept: ${department_id}`);

    let events = readData();

    // Admin sees everything
    if (role && role.toLowerCase() === 'admin') {
        res.json({ data: events, error: null });
        return;
    }

    events = events.filter(e => {
        // Filter by Department
        const deptMatch = !department_id ||
            !e.department_id ||
            e.department_id === 'all' ||
            e.department_id === department_id;

        // Filter by Role
        // If event has recipient_roles, user's role MUST be in it (case-insensitive).
        // If event has NO recipient_roles, assume public/all.
        let roleMatch = true;

        if (role && e.recipient_roles && Array.isArray(e.recipient_roles) && e.recipient_roles.length > 0) {
            const normalizedUserRole = role.toLowerCase();
            const normalizedEventRoles = e.recipient_roles.map(r => r.toLowerCase());
            roleMatch = normalizedEventRoles.includes(normalizedUserRole);
        }

        return deptMatch && roleMatch;
    });

    res.json({ data: events, error: null });
});

router.post('/', async (req, res) => {
    console.log('[POST /events] Received payload:', JSON.stringify(req.body, null, 2));

    const newEvent = {
        id: Date.now().toString(),
        type: req.body.type || 'information', // 'invite' or 'information'
        fee: req.body.fee || 0,
        participants: [],
        ...req.body,
        created_at: new Date().toISOString()
    };

    const events = readData();
    events.push(newEvent);
    writeData(events);

    // Create facility booking if facility_id is present
    if (req.body.facility_id && req.body.date && req.body.time) {
        const logMsg = (msg) => {
            const logLine = `[${new Date().toISOString()}] ${msg}\n`;
            try { fs.appendFileSync(path.join(__dirname, '../debug_events.log'), logLine); } catch (_e) { /* Ignore file write errors */ }
            console.log(logLine.trim());
        };

        logMsg(`Attempting to create facility booking for Event: ${newEvent.title}`);
        logMsg(`Facility ID: ${req.body.facility_id}`);

        try {
            const startDateTime = new Date(`${req.body.date}T${req.body.time}`);
            // Default 1 hour duration
            const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

            logMsg(`Times: ${startDateTime.toISOString()} - ${endDateTime.toISOString()}`);

            const payload = {
                room_id: req.body.facility_id,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                event_name: req.body.title || 'Scheduled Event',
                status: 'Approved',
                organizer: req.body.userId || 'system'
            };

            logMsg(`Insert Payload: ${JSON.stringify(payload)}`);

            const { data, error: bookingError } = await supabaseAdmin
                .from('facilities_bookings')
                .insert(payload)
                .select();

            if (bookingError) {
                logMsg(`Failed to create facility booking: ${JSON.stringify(bookingError)}`);
            } else {
                logMsg(`Facility booking created successfully. Data: ${JSON.stringify(data)}`);
            }
        } catch (err) {
            logMsg(`Error creating facility booking: ${err.message}`);
        }
    } else {
        // Log why we skipped
        const logLine = `[${new Date().toISOString()}] SKIPPED Booking. FacID: ${req.body.facility_id}, Date: ${req.body.date}, Time: ${req.body.time}\n`;
        try { fs.appendFileSync(path.join(__dirname, '../debug_events.log'), logLine); } catch (e) { }
    }

    res.json({ data: newEvent, error: null });
});

// Join an event (for invite type events)
router.post('/:id/join', (req, res) => {
    const { id } = req.params;
    const { student_id, payment_amount } = req.body;

    const events = readData();
    const eventIndex = events.findIndex(e => e.id === id);

    if (eventIndex === -1) {
        return res.status(404).json({ data: null, error: 'Event not found' });
    }

    const event = events[eventIndex];

    // Check if event is invite type
    if (event.type !== 'invite') {
        return res.status(400).json({ data: null, error: 'This event does not require joining' });
    }

    // Check if already joined
    const existingParticipant = event.participants?.find(p => p.student_id === student_id);
    if (existingParticipant) {
        return res.status(400).json({ data: null, error: 'Already joined this event' });
    }

    // Add participant
    if (!event.participants) {
        event.participants = [];
    }

    event.participants.push({
        student_id,
        joined_at: new Date().toISOString(),
        payment_amount: payment_amount || 0,
        payment_status: payment_amount > 0 ? 'pending' : 'not_required',
        presence_marked: false
    });

    events[eventIndex] = event;
    writeData(events);

    res.json({ data: { success: true, event }, error: null });
});

// Mark presence for an event
router.post('/:id/presence', (req, res) => {
    const { id } = req.params;
    const { student_id } = req.body;

    const events = readData();
    const eventIndex = events.findIndex(e => e.id === id);

    if (eventIndex === -1) {
        return res.status(404).json({ data: null, error: 'Event not found' });
    }

    const event = events[eventIndex];

    // For invite events, check if student has joined
    if (event.type === 'invite') {
        const participant = event.participants?.find(p => p.student_id === student_id);
        if (!participant) {
            return res.status(400).json({ data: null, error: 'You must join the event first' });
        }
        if (participant.presence_marked) {
            return res.status(400).json({ data: null, error: 'Presence already marked' });
        }
        participant.presence_marked = true;
        participant.presence_marked_at = new Date().toISOString();
    } else {
        // For information events, add participant if not exists
        if (!event.participants) {
            event.participants = [];
        }
        let participant = event.participants.find(p => p.student_id === student_id);
        if (!participant) {
            participant = {
                student_id,
                joined_at: new Date().toISOString(),
                presence_marked: true,
                presence_marked_at: new Date().toISOString()
            };
            event.participants.push(participant);
        } else {
            if (participant.presence_marked) {
                return res.status(400).json({ data: null, error: 'Presence already marked' });
            }
            participant.presence_marked = true;
            participant.presence_marked_at = new Date().toISOString();
        }
    }

    events[eventIndex] = event;
    writeData(events);

    res.json({ data: { success: true, event }, error: null });
});

// Get event participants
router.get('/:id/participants', (req, res) => {
    const { id } = req.params;
    const events = readData();
    const event = events.find(e => e.id === id);

    if (!event) {
        return res.status(404).json({ data: null, error: 'Event not found' });
    }

    res.json({ data: event.participants || [], error: null });
});

// Update event
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const events = readData();
    const index = events.findIndex(e => e.id === id);

    if (index === -1) {
        return res.status(404).json({ data: null, error: 'Event not found' });
    }

    events[index] = { ...events[index], ...updates, updated_at: new Date().toISOString() };
    writeData(events);

    res.json({ data: events[index], error: null });
});

// Delete event
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const events = readData();
    const filteredEvents = events.filter(e => e.id !== id);

    if (events.length === filteredEvents.length) {
        return res.status(404).json({ data: null, error: 'Event not found' });
    }

    writeData(filteredEvents);
    res.json({ data: { success: true }, error: null });
});

export default router;
