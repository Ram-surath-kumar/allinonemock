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
const GROUPS_FILE = path.join(__dirname, '../data/chat_groups.json');
const SETTINGS_FILE = path.join(__dirname, '../data/chat_settings.json');

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

const readGroups = () => {
    try {
        if (!fs.existsSync(GROUPS_FILE)) {
            const dir = path.dirname(GROUPS_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(GROUPS_FILE, '[]');
            return [];
        }
        const data = fs.readFileSync(GROUPS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading groups:', error);
        return [];
    }
};

const writeGroups = (data) => {
    try {
        fs.writeFileSync(GROUPS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing groups:', error);
        return false;
    }
};

const readSettings = () => {
    try {
        if (!fs.existsSync(SETTINGS_FILE)) {
            const dir = path.dirname(SETTINGS_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(SETTINGS_FILE, '{}');
            return {};
        }
        const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading settings:', error);
        return {};
    }
};

const writeSettings = (data) => {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing settings:', error);
        return false;
    }
};

// Get all recent chats for a user (Consolidated endpoint: 1:1 and Groups)
router.get('/chats', (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ data: null, error: 'user_id is required' });
    }

    const messages = readMessages();
    const groups = readGroups();
    const settings = readSettings();
    const userSettings = settings[user_id] || { muted: [], deleted: [], archived: [], cleared: {} };
    if (!userSettings.archived) userSettings.archived = [];

    // Group 1:1 messages by conversation
    const conversations = {};

    // 1. Process Groups
    groups.forEach(group => {
        if (group.members.includes(user_id) && !userSettings.deleted.includes(group.id)) {
            // Find last message for this group
            // In a real DB, we'd query this efficiently. Here filter all messages.
            const groupMessages = messages.filter(m => m.group_id === group.id);
            groupMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            const lastMsg = groupMessages[groupMessages.length - 1];

            // Calculate unread
            const clearedInfos = userSettings.cleared[group.id];
            const clearedTime = clearedInfos ? new Date(clearedInfos) : new Date(0);

            const unreadCount = groupMessages.filter(m =>
                new Date(m.created_at) > clearedTime &&
                m.sender_id !== user_id &&
                (!m.read_by || !m.read_by.includes(user_id))
            ).length;

            conversations[group.id] = {
                id: group.id,
                type: 'group',
                name: group.name,
                avatar: group.icon,
                unreadCount,
                lastMessage: lastMsg ? lastMsg.content : 'No messages yet',
                lastMessageTime: lastMsg ? lastMsg.created_at : group.created_at,
                muted: userSettings.muted.includes(group.id),
                isArchived: userSettings.archived.includes(group.id)
            };
        }
    });

    // 2. Process 1:1 Messages
    messages.forEach(m => {
        if ((m.sender_id === user_id || m.receiver_id === user_id) && !m.group_id) {
            const otherUserId = m.sender_id === user_id ? m.receiver_id : m.sender_id;
            const chatId = `recent-${otherUserId}`; // Virtual ID for 1:1

            if (userSettings.deleted.includes(chatId)) return;

            if (!conversations[chatId]) {
                conversations[chatId] = {
                    id: chatId,
                    userId: otherUserId, // For identifying user in frontend
                    type: 'direct',
                    messages: [],
                    unreadCount: 0,
                    lastMessage: null,
                    muted: userSettings.muted.includes(chatId),
                    isArchived: userSettings.archived.includes(chatId)
                };
            }

            conversations[chatId].messages.push(m);

            // Unread count logic
            const clearedInfos = userSettings.cleared[chatId];
            const clearedTime = clearedInfos ? new Date(clearedInfos) : new Date(0);

            if (new Date(m.created_at) > clearedTime && m.receiver_id === user_id && !m.read) {
                conversations[chatId].unreadCount++;
            }
        }
    });

    // Finalize 1:1 conversations
    Object.values(conversations).forEach(conv => {
        if (conv.type === 'direct') {
            conv.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            const lastMsg = conv.messages[conv.messages.length - 1];
            conv.lastMessage = lastMsg ? lastMsg.content : '';
            conv.lastMessageTime = lastMsg ? lastMsg.created_at : null;
            delete conv.messages; // Don't send full history in summary
            // name/avatar will be filled by frontend based on userId
        }
    });

    // Convert to array and sort
    const result = Object.values(conversations).map(c => c);

    result.sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
    });

    res.json({ data: result, error: null });
});

// Create a Group
router.post('/groups', (req, res) => {
    const { name, members, icon, created_by } = req.body;

    if (!name || !members || !created_by) {
        return res.status(400).json({ error: 'Name, members, and created_by are required' });
    }

    const groups = readGroups();
    const newGroup = {
        id: `group-${Date.now()}`,
        name,
        members: [...members, created_by], // Ensure creator is included
        icon: icon || null,
        created_by,
        created_at: new Date().toISOString()
    };

    groups.push(newGroup);
    writeGroups(groups);
    // Create system message for group creation
    // ...
    res.json({ data: newGroup, error: null });
});

// Update Group Description
router.put('/groups/:id', (req, res) => {
    const { id } = req.params;
    const { description } = req.body;

    const groups = readGroups();
    const groupIndex = groups.findIndex(g => g.id === id);

    if (groupIndex === -1) {
        return res.status(404).json({ error: 'Group not found' });
    }

    groups[groupIndex].description = description;
    writeGroups(groups);

    res.json({ data: groups[groupIndex], error: null });
});

// Add Member to Group
router.post('/groups/:id/members', (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body; // user_id can be string or array

    const groups = readGroups();
    const groupIndex = groups.findIndex(g => g.id === id);

    if (groupIndex === -1) {
        return res.status(404).json({ error: 'Group not found' });
    }

    const group = groups[groupIndex];
    if (!group.members) group.members = [];

    const userIdsToAdd = Array.isArray(user_id) ? user_id : [user_id];
    let addedCount = 0;

    userIdsToAdd.forEach(uid => {
        if (!group.members.includes(uid)) {
            group.members.push(uid);
            addedCount++;
        }
    });

    writeGroups(groups);
    res.json({ data: group, added: addedCount, error: null });
});

// Add members to a group
router.put('/groups/:id/members', (req, res) => {
    const { id } = req.params;
    const { members } = req.body; // Array of user IDs to add

    if (!members || !Array.isArray(members)) {
        return res.status(400).json({ error: 'Members array is required' });
    }

    const groups = readGroups();
    const groupIndex = groups.findIndex(g => g.id === id);

    if (groupIndex === -1) {
        return res.status(404).json({ error: 'Group not found' });
    }

    // Add new members if not already in group
    const currentMembers = groups[groupIndex].members;
    const newMembers = members.filter(m => !currentMembers.includes(m));

    if (newMembers.length > 0) {
        groups[groupIndex].members = [...currentMembers, ...newMembers];
        writeGroups(groups);
    }

    res.json({ data: groups[groupIndex], error: null });
});

// Leave a Group
router.post('/groups/:id/leave', (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
    }

    const groups = readGroups();
    const groupIndex = groups.findIndex(g => g.id === id);

    if (groupIndex === -1) {
        return res.status(404).json({ error: 'Group not found' });
    }

    const group = groups[groupIndex];
    if (!group.members) group.members = [];

    // Remove user from members
    group.members = group.members.filter(uid => uid !== user_id);

    writeGroups(groups);

    // Add a system message about user leaving
    const messages = readMessages();
    const systemMsg = {
        id: `sys-${Date.now()}`,
        group_id: id,
        sender_id: 'system',
        content: `A member has left the group`,
        type: 'system',
        created_at: new Date().toISOString()
    };
    messages.push(systemMsg);
    writeMessages(messages);

    res.json({ success: true, data: group, error: null });
});

// Get Group Details
router.get('/groups/:id', (req, res) => {
    const { id } = req.params;
    const groups = readGroups();
    const group = groups.find(g => g.id === id);

    if (!group) {
        return res.status(404).json({ error: 'Group not found' });
    }

    // Enrich with member info if possible (mocking names for now or fetching from users if we had a readUsers here)
    // For now returning raw IDs is fine, frontend can resolve or we can do it here if we read users file.
    // Let's safe-read users to provide names
    /*
    const usersFile = path.join(__dirname, '../data/users.json');
    let users = [];
    if(fs.existsSync(usersFile)) users = JSON.parse(fs.readFileSync(usersFile));
    const enrichedMembers = group.members.map(mid => {
        const u = users.find(user => user.id === mid);
        return { id: mid, name: u ? u.name : 'Unknown User', avatar: u ? u.profile_picture : null };
    });
    */

    res.json({ data: group, error: null });
});

// Mute/Unmute Chat
router.put('/chats/:id/mute', (req, res) => {
    const { id } = req.params;
    const { user_id, muted } = req.body; // muted: true/false

    const settings = readSettings();
    if (!settings[user_id]) settings[user_id] = { muted: [], deleted: [], cleared: {} };

    if (muted) {
        if (!settings[user_id].muted.includes(id)) settings[user_id].muted.push(id);
    } else {
        settings[user_id].muted = settings[user_id].muted.filter(m => m !== id);
    }

    writeSettings(settings);
    res.json({ success: true });
});

// Delete (Hide) Chat
router.delete('/chats/:id', (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body; // Need to know WHO is deleting

    const settings = readSettings();
    if (!settings[user_id]) settings[user_id] = { muted: [], deleted: [], cleared: {} };

    if (!settings[user_id].deleted.includes(id)) {
        settings[user_id].deleted.push(id);
    }

    writeSettings(settings);
    res.json({ success: true });
});

// Clear Chat History
router.post('/chats/:id/clear', (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;

    const settings = readSettings();
    if (!settings[user_id]) settings[user_id] = { muted: [], deleted: [], cleared: {} };

    settings[user_id].cleared[id] = new Date().toISOString();

    writeSettings(settings);
    res.json({ success: true });
});

// Archive/Unarchive Chat
router.put('/chats/:id/archive', (req, res) => {
    const { id } = req.params;
    const { user_id, archived } = req.body; // archived: true/false

    const settings = readSettings();
    if (!settings[user_id]) settings[user_id] = { muted: [], deleted: [], archived: [], cleared: {} };
    if (!settings[user_id].archived) settings[user_id].archived = [];

    if (archived) {
        if (!settings[user_id].archived.includes(id)) settings[user_id].archived.push(id);
    } else {
        settings[user_id].archived = settings[user_id].archived.filter(a => a !== id);
    }

    writeSettings(settings);
    res.json({ success: true });
});

// Get messages (supports Group and Direct)
router.get('/messages', (req, res) => {
    const { user_id, other_user_id, group_id } = req.query;

    const messages = readMessages();
    const settings = readSettings();

    const userSettings = settings[user_id] || { cleared: {} };
    // Determine context ID for clearing check
    const contextId = group_id ? group_id : (other_user_id ? `recent-${other_user_id}` : null);
    const clearedTime = (contextId && userSettings.cleared[contextId]) ? new Date(userSettings.cleared[contextId]) : new Date(0);

    let filtered = [];

    if (group_id) {
        filtered = messages.filter(m => m.group_id === group_id && new Date(m.created_at) > clearedTime);
    } else if (user_id && other_user_id) {
        filtered = messages.filter(m =>
            ((m.sender_id === user_id && m.receiver_id === other_user_id) ||
                (m.sender_id === other_user_id && m.receiver_id === user_id)) &&
            new Date(m.created_at) > clearedTime
        );
    } else {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    // Filter out messages deleted for this user
    filtered = filtered.filter(m => !m.deleted_for || !m.deleted_for.includes(user_id));

    // Add 'starred' property for this user
    filtered = filtered.map(m => ({
        ...m,
        starred: m.starred_by && m.starred_by.includes(user_id)
    }));

    filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    res.json({ data: filtered, error: null });
});

// Send a message (Direct or Group)
router.post('/messages', (req, res) => {
    const { sender_id, receiver_id, group_id, content, type, reply_to_id, file_url, file_name, file_type, file_size } = req.body;

    if (!sender_id || !content || (!receiver_id && !group_id)) {
        return res.status(400).json({ data: null, error: 'Invalid message data' });
    }

    // Resolve reply_to object if reply_to_id is present
    let reply_to = null;
    const messages = readMessages();

    if (reply_to_id) {
        const parentMsg = messages.find(m => m.id === reply_to_id);
        if (parentMsg) {
            reply_to = {
                id: parentMsg.id,
                sender_id: parentMsg.sender_id,
                content: parentMsg.content,
                type: parentMsg.type,
                file_name: parentMsg.file_name
            };
        }
    }

    const newMessage = {
        id: Date.now().toString(),
        sender_id,
        receiver_id: receiver_id || null,
        group_id: group_id || null,
        content,
        type: type || 'text',
        read: false,
        read_by: [], // For groups
        created_at: new Date().toISOString(),
        reply_to_id: reply_to_id || null,
        reply_to: reply_to || null,
        pinned: false,
        starred_by: [], // Array of user_ids who starred this message
        file_url: file_url || null,
        file_name: file_name || null,
        file_type: file_type || null,
        file_size: file_size || null
    };

    messages.push(newMessage);
    writeMessages(messages);

    // Auto-undelete for receiver(s) if they had deleted the chat
    // Complex logic omitted for simplicity, but in real app we'd 'revive' the chat for them.

    res.json({ data: newMessage, error: null });
});

// Pin/Unpin Message
router.put('/messages/:id/pin', (req, res) => {
    const { id } = req.params;
    const { pinned } = req.body; // true/false

    const messages = readMessages();
    const msgIndex = messages.findIndex(m => m.id === id);

    if (msgIndex === -1) {
        return res.status(404).json({ error: 'Message not found' });
    }

    messages[msgIndex].pinned = pinned;
    writeMessages(messages);

    res.json({ data: messages[msgIndex], error: null });
});

// Star/Unstar Message
router.put('/messages/:id/star', (req, res) => {
    const { id } = req.params;
    const { user_id, starred } = req.body;

    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const messages = readMessages();
    const msgIndex = messages.findIndex(m => m.id === id);

    if (msgIndex === -1) {
        return res.status(404).json({ error: 'Message not found' });
    }

    const msg = messages[msgIndex];
    if (!msg.starred_by) msg.starred_by = [];

    if (starred) {
        if (!msg.starred_by.includes(user_id)) msg.starred_by.push(user_id);
    } else {
        msg.starred_by = msg.starred_by.filter(uid => uid !== user_id);
    }

    // Decorate response for the user
    const responseMsg = { ...msg, starred: starred };
    writeMessages(messages);

    res.json({ data: responseMsg, error: null });
});

// Delete Message
router.delete('/messages/:id', (req, res) => {
    const { id } = req.params;
    const { user_id, type } = req.query; // type: 'me' or 'everyone'

    if (!user_id || !type) return res.status(400).json({ error: 'user_id and type are required' });

    const messages = readMessages();
    const msgIndex = messages.findIndex(m => m.id === id);

    if (msgIndex === -1) {
        return res.status(404).json({ error: 'Message not found' });
    }

    const msg = messages[msgIndex];

    if (type === 'everyone') {
        // Validation: Only sender or admin can delete for everyone
        if (msg.sender_id !== user_id) { // Add admin check if needed
            return res.status(403).json({ error: 'Not authorized to delete for everyone' });
        }

        // Hard delete or Soft delete content?
        // WhatsApp style: "This message was deleted"
        msg.content = "This message was deleted";
        msg.type = "system"; // or keep text but mark deleted
        msg.is_deleted = true;
        msg.deleted_for_everyone = true;
        msg.file_url = null; // Remove attachments
    } else {
        // Delete for me
        if (!msg.deleted_for) msg.deleted_for = [];
        if (!msg.deleted_for.includes(user_id)) msg.deleted_for.push(user_id);
    }

    writeMessages(messages);
    res.json({ success: true, id });
});

// Add Reaction to Message
router.post('/messages/:id/reactions', (req, res) => {
    const { id } = req.params;
    const { user_id, user_name, emoji } = req.body;

    if (!user_id || !emoji) {
        return res.status(400).json({ error: 'user_id and emoji are required' });
    }

    const messages = readMessages();
    const msgIndex = messages.findIndex(m => m.id === id);

    if (msgIndex === -1) {
        return res.status(404).json({ error: 'Message not found' });
    }

    const msg = messages[msgIndex];
    if (!msg.reactions) msg.reactions = [];

    // Check if user already reacted with this emoji
    const existing = msg.reactions.find(r => r.user_id === user_id && r.emoji === emoji);
    if (!existing) {
        msg.reactions.push({ user_id, user_name, emoji });
        writeMessages(messages);
    }

    res.json({ data: msg, error: null });
});

// Remove Reaction from Message
router.delete('/messages/:id/reactions/:emoji', (req, res) => {
    const { id, emoji } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
    }

    const messages = readMessages();
    const msgIndex = messages.findIndex(m => m.id === id);

    if (msgIndex === -1) {
        return res.status(404).json({ error: 'Message not found' });
    }

    const msg = messages[msgIndex];
    if (msg.reactions) {
        msg.reactions = msg.reactions.filter(r => !(r.user_id === user_id && r.emoji === emoji));
        writeMessages(messages);
    }

    res.json({ data: msg, error: null });
});

// Mark messages as read
router.put('/messages/read', (req, res) => {
    const { user_id, other_user_id, group_id } = req.body;

    const messages = readMessages();
    let updatedCount = 0;

    const updated = messages.map(m => {
        if (group_id) {
            if (m.group_id === group_id && m.sender_id !== user_id && (!m.read_by || !m.read_by.includes(user_id))) {
                const readBy = m.read_by || [];
                return { ...m, read_by: [...readBy, user_id] };
            }
        } else if (other_user_id) {
            if (m.receiver_id === user_id && m.sender_id === other_user_id && !m.read) {
                return { ...m, read: true, read_at: new Date().toISOString() };
            }
        }
        return m;
    });

    writeMessages(updated);
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
