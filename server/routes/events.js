import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

router.post('/', (req, res) => {
    const newEvent = {
        id: Date.now().toString(),
        ...req.body,
        created_at: new Date().toISOString()
    };

    const events = readData();
    events.push(newEvent);
    writeData(events);

    res.json({ data: newEvent, error: null });
});

export default router;
