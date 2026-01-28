import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabaseAdmin } from '../common.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MESSAGES_FILE = path.join(__dirname, '../data/chat_messages.json');
const CALLS_FILE = path.join(__dirname, '../data/chat_calls.json');

const readMessages = () => {
    try {
        if (!fs.existsSync(MESSAGES_FILE)) {
            const dir = path.dirname(MESSAGES_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(MESSAGES_FILE, '[]');
            return [];
        }
        const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading messages:', error);
        return [];
    }
};

const writeMessages = (data) => {
    try {
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing messages:', error);
        return false;
    }
};

const readCalls = () => {
    try {
        if (!fs.existsSync(CALLS_FILE)) {
            const dir = path.dirname(CALLS_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(CALLS_FILE, '[]');
            return [];
        }
        const data = fs.readFileSync(CALLS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading calls:', error);
        return [];
    }
};

const writeCalls = (data) => {
    try {
        fs.writeFileSync(CALLS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing calls:', error);
        return false;
    }
};

// Get messages between two users
router.get('/messages', (req, res) => {
    const { user_id, other_user_id } = req.query;

    if (!user_id || !other_user_id) {
        return res.status(400).json({ data: null, error: 'user_id and other_user_id are required' });
    }

    const messages = readMessages();
    const filtered = messages.filter(m => 
        (m.sender_id === user_id && m.receiver_id === other_user_id) ||
        (m.sender_id === other_user_id && m.receiver_id === user_id)
    ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    res.json({ data: filtered, error: null });
});

// Send a message
router.post('/messages', (req, res) => {
    const { sender_id, receiver_id, content, type } = req.body;

    if (!sender_id || !receiver_id || !content) {
        return res.status(400).json({ data: null, error: 'sender_id, receiver_id, and content are required' });
    }

    const newMessage = {
        id: Date.now().toString(),
        sender_id,
        receiver_id,
        content,
        type: type || 'text',
        read: false,
        created_at: new Date().toISOString()
    };

    const messages = readMessages();
    messages.push(newMessage);
    writeMessages(messages);

    res.json({ data: newMessage, error: null });
});

// Mark messages as read
router.put('/messages/read', (req, res) => {
    const { user_id, other_user_id } = req.body;

    if (!user_id || !other_user_id) {
        return res.status(400).json({ data: null, error: 'user_id and other_user_id are required' });
    }

    const messages = readMessages();
    const updated = messages.map(m => {
        if (m.receiver_id === user_id && m.sender_id === other_user_id && !m.read) {
            return { ...m, read: true, read_at: new Date().toISOString() };
        }
        return m;
    });

    writeMessages(updated);
    res.json({ data: { success: true }, error: null });
});

// Initiate a call
router.post('/calls', (req, res) => {
    const { caller_id, receiver_id, type } = req.body;

    if (!caller_id || !receiver_id || !type) {
        return res.status(400).json({ data: null, error: 'caller_id, receiver_id, and type are required' });
    }

    const newCall = {
        id: Date.now().toString(),
        caller_id,
        receiver_id,
        type,
        status: 'initiated',
        created_at: new Date().toISOString(),
        ended_at: null
    };

    const calls = readCalls();
    calls.push(newCall);
    writeCalls(calls);

    res.json({ data: newCall, error: null });
});

// End a call
router.put('/calls/:id/end', (req, res) => {
    const { id } = req.params;

    const calls = readCalls();
    const callIndex = calls.findIndex(c => c.id === id);

    if (callIndex === -1) {
        return res.status(404).json({ data: null, error: 'Call not found' });
    }

    calls[callIndex] = {
        ...calls[callIndex],
        status: 'ended',
        ended_at: new Date().toISOString()
    };

    writeCalls(calls);
    res.json({ data: calls[callIndex], error: null });
});

export default router;
