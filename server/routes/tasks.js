import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/tasks.json');

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
        console.error('Error reading tasks:', error);
        return [];
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing tasks:', error);
        return false;
    }
};

router.get('/', (req, res) => {
    const { assigned_to, assigned_by, status, role } = req.query;
    let tasks = readData();

    if (assigned_to) {
        tasks = tasks.filter(t => t.assigned_to === assigned_to);
    }

    if (assigned_by) {
        tasks = tasks.filter(t => t.assigned_by === assigned_by);
    }

    if (status) {
        tasks = tasks.filter(t => t.status === status);
    }

    // Simple mock "join" logic for role filtering if needed, 
    // but usually frontend filters by passing 'assigned_to' = current user id.

    res.json({ data: tasks, error: null });
});

router.post('/', (req, res) => {
    const newTask = {
        id: Date.now().toString(),
        ...req.body,
        status: req.body.status || 'pending',
        created_at: new Date().toISOString()
    };

    const tasks = readData();
    tasks.push(newTask);
    writeData(tasks);

    res.json({ data: newTask, error: null });
});

router.put('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    let tasks = readData();
    const index = tasks.findIndex(t => t.id === id);

    if (index === -1) {
        return res.status(404).json({ data: null, error: 'Task not found' });
    }

    tasks[index] = { ...tasks[index], ...updates };
    writeData(tasks);

    res.json({ data: tasks[index], error: null });
});

router.delete('/:id', (req, res) => {
    const { id } = req.params;
    let tasks = readData();
    const filteredTasks = tasks.filter(t => t.id !== id);

    if (tasks.length === filteredTasks.length) {
        return res.status(404).json({ data: null, error: 'Task not found' });
    }

    writeData(filteredTasks);
    res.json({ data: { success: true }, error: null });
});

export default router;
