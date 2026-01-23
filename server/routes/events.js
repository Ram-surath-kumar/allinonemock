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
    const { department_id } = req.query;
    let events = readData();

    if (department_id) {
        events = events.filter(e => e.department_id === department_id || !e.department_id || e.department_id === 'all');
    }

    res.json({ data: events, error: null });
});

router.post('/', async (req, res) => {
    console.log('[POST /events] Received payload:', JSON.stringify(req.body, null, 2));

    const newEvent = {
        id: Date.now().toString(),
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

export default router;
