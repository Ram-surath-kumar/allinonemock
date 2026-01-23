import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/schedules.json');

// Helper to read data
const readData = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            // Create dir if not exists
            const dir = path.dirname(DATA_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(DATA_FILE, '[]');
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading schedules:', error);
        return [];
    }
};

// Helper to write data
const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing schedules:', error);
        return false;
    }
};

// GET all schedules (or filter by teacher/student context)
router.get('/', (req, res) => {
    const { teacher_id, department_id, day } = req.query;
    let schedules = readData();

    if (teacher_id) {
        schedules = schedules.filter(s => s.teacher_id === teacher_id);
    }

    if (department_id) {
        schedules = schedules.filter(s => s.department_id === department_id);
    }

    // Optional: filter by day if provided, otherwise return all or implement logic to return today's
    // For "Today's Schedule", frontend usually filters or we filter here.
    // We'll just return matches for now.

    res.json({ data: schedules, error: null });
});

// POST to create a new schedule
router.post('/', (req, res) => {
    const newSchedule = {
        id: Date.now().toString(),
        ...req.body,
        updated_at: new Date().toISOString()
    };

    const schedules = readData();
    schedules.push(newSchedule);
    writeData(schedules);

    res.json({ data: newSchedule, error: null });
});

// PUT to update a schedule
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const schedules = readData();
    const index = schedules.findIndex(s => s.id === id);

    if (index === -1) {
        return res.status(404).json({ data: null, error: 'Schedule not found' });
    }

    schedules[index] = { ...schedules[index], ...updates };
    writeData(schedules);

    res.json({ data: schedules[index], error: null });
});

// DELETE a schedule
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const schedules = readData();
    const filteredSchedules = schedules.filter(s => s.id !== id);

    if (schedules.length === filteredSchedules.length) {
        return res.status(404).json({ data: null, error: 'Schedule not found' });
    }

    writeData(filteredSchedules);
    res.json({ data: { success: true }, error: null });
});

export default router;
