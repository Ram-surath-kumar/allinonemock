import express from 'express';
import { supabaseAdmin, handleError, sendSuccess } from '../common.js';

const router = express.Router();

// Get all recent chats for a user (Consolidated endpoint: 1:1 and Groups)
router.get('/chats', async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ data: null, error: 'user_id is required' });
    }

    try {
        // 1. Get User Settings
        let { data: settings, error: settingsError } = await supabaseAdmin
            .from('chat_settings')
            .select('*')
            .eq('user_id', user_id)
            .maybeSingle();

        if (settingsError) throw settingsError;

        const userSettings = settings || { muted_chats: [], deleted_conversations: [], cleared_at: {} };

        // 2. Get Group Conversations
        // First get groups the user is currently in (where left_at is null)
        const { data: memberOf, error: memberError } = await supabaseAdmin
            .from('group_members')
            .select('group_id')
            .eq('user_id', user_id)
            .is('left_at', null);

        if (memberError) throw memberError;
        const groupIds = memberOf.map(m => m.group_id);

        const conversations = {};

        // 3. Process Groups
        if (groupIds.length > 0) {
            const { data: groups, error: groupsError } = await supabaseAdmin
                .from('chat_groups')
                .select('*')
                .in('id', groupIds);

            if (groupsError) throw groupsError;

            for (const group of groups) {
                if (userSettings.deleted_conversations.includes(group.id)) continue;

                // Find last message for this group
                const { data: lastMsg, error: lastMsgError } = await supabaseAdmin
                    .from('chat_messages')
                    .select('*')
                    .eq('group_id', group.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (lastMsgError) throw lastMsgError;

                // Calculate unread
                const clearedTime = userSettings.cleared_at[group.id] || '1970-01-01T00:00:00Z';
                const { count: unreadCount, error: unreadError } = await supabaseAdmin
                    .from('chat_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('group_id', group.id)
                    .gt('created_at', clearedTime)
                    .neq('sender_id', user_id)
                    .not('read_by', 'cs', `{${user_id}}`); // cs = contains

                if (unreadError) throw unreadError;

                conversations[group.id] = {
                    id: group.id,
                    type: 'group',
                    name: group.name,
                    avatar: group.avatar_url,
                    unreadCount: unreadCount || 0,
                    lastMessage: lastMsg ? lastMsg.content : 'No messages yet',
                    lastMessageTime: lastMsg ? lastMsg.created_at : group.created_at,
                    muted: userSettings.muted_chats.includes(group.id)
                };
            }
        }

        // 4. Process 1:1 Messages
        // Fetch direct messages where user is sender or receiver
        const { data: directMessages, error: dmError } = await supabaseAdmin
            .from('chat_messages')
            .select('*')
            .or(`sender_id.eq.${user_id},receiver_id.eq.${user_id}`)
            .is('group_id', null)
            .order('created_at', { ascending: false });

        if (dmError) throw dmError;

        directMessages.forEach(m => {
            const otherUserId = m.sender_id === user_id ? m.receiver_id : m.sender_id;
            if (!otherUserId) return;

            const chatId = `recent-${otherUserId}`;
            if (userSettings.deleted_conversations.includes(chatId)) return;

            if (!conversations[chatId]) {
                const clearedTime = userSettings.cleared_at[chatId] || '1970-01-01T00:00:00Z';

                // If message is older than cleared time, skip it for summary
                if (new Date(m.created_at) <= new Date(clearedTime)) return;

                conversations[chatId] = {
                    id: chatId,
                    userId: otherUserId,
                    type: 'direct',
                    unreadCount: 0,
                    lastMessage: m.content,
                    lastMessageTime: m.created_at,
                    muted: userSettings.muted_chats.includes(chatId)
                };
            }

            // Unread count logic
            const clearedTime = userSettings.cleared_at[chatId] || '1970-01-01T00:00:00Z';
            if (new Date(m.created_at) > new Date(clearedTime) && m.receiver_id === user_id && !m.is_read) {
                conversations[chatId].unreadCount++;
            }
        });

        // Convert to array and sort
        const result = Object.values(conversations);
        result.sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
        });

        sendSuccess(res, result);
    } catch (error) {
        handleError(error, res, 'Failed to fetch chats');
    }
});

// Create a Group
router.post('/groups', async (req, res) => {
    const { name, members, icon, created_by } = req.body;

    if (!name || !members || !created_by) {
        return res.status(400).json({ error: 'Name, members, and created_by are required' });
    }

    try {
        // 1. Insert Group
        const { data: group, error: groupError } = await supabaseAdmin
            .from('chat_groups')
            .insert({
                name,
                avatar_url: icon || null,
                created_by
            })
            .select()
            .single();

        if (groupError) throw groupError;

        // 2. Add members
        const allMembers = Array.from(new Set([...members, created_by]));
        const memberInserts = allMembers.map(uid => ({
            group_id: group.id,
            user_id: uid,
            role: uid === created_by ? 'admin' : 'member'
        }));

        const { error: membersError } = await supabaseAdmin
            .from('group_members')
            .insert(memberInserts);

        if (membersError) throw membersError;

        // Add a system message
        await supabaseAdmin.from('chat_messages').insert({
            group_id: group.id,
            sender_id: created_by,
            content: `Group "${name}" created`,
            type: 'system'
        });

        sendSuccess(res, group);
    } catch (error) {
        handleError(error, res, 'Failed to create group');
    }
});

// Update Group
router.put('/groups/:id', async (req, res) => {
    const { id } = req.params;
    const { description, name, icon } = req.body;

    try {
        const updateData = {};
        if (description !== undefined) updateData.description = description;
        if (name !== undefined) updateData.name = name;
        if (icon !== undefined) updateData.avatar_url = icon;

        const { data: group, error } = await supabaseAdmin
            .from('chat_groups')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        sendSuccess(res, group);
    } catch (error) {
        handleError(error, res, 'Failed to update group');
    }
});

// Add Member to Group
router.post('/groups/:id/members', async (req, res) => {
    const { id } = req.params;
    const { user_id, user_ids, members } = req.body;

    try {
        const providedIds = user_ids || user_id || members;
        if (!providedIds) {
            return res.status(400).json({ error: 'No user IDs provided' });
        }

        const userIdsToAdd = Array.isArray(providedIds) ? providedIds : [providedIds];
        const cleanUserIdsToAdd = userIdsToAdd.filter(uid => uid != null);

        if (cleanUserIdsToAdd.length === 0) {
            return res.status(400).json({ error: 'No valid user IDs provided' });
        }

        // Filter out existing members
        const { data: existing, error: fetchError } = await supabaseAdmin
            .from('group_members')
            .select('user_id')
            .eq('group_id', id)
            .in('user_id', cleanUserIdsToAdd)
            .is('left_at', null);

        if (fetchError) throw fetchError;
        const exitingIds = existing.map(e => e.user_id);
        const newIds = cleanUserIdsToAdd.filter(uid => !exitingIds.includes(uid));

        if (newIds.length > 0) {
            const inserts = newIds.map(uid => ({
                group_id: id,
                user_id: uid,
                role: 'member'
            }));
            const { error: insertError } = await supabaseAdmin
                .from('group_members')
                .insert(inserts);

            if (insertError) throw insertError;
        }

        res.json({ success: true, added: newIds.length });
    } catch (error) {
        handleError(error, res, 'Failed to add members');
    }
});

// Leave a Group
router.post('/groups/:id/leave', async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
    }

    try {
        const { error } = await supabaseAdmin
            .from('group_members')
            .update({ left_at: new Date().toISOString() })
            .eq('group_id', id)
            .eq('user_id', user_id);

        if (error) throw error;

        // Add a system message
        await supabaseAdmin.from('chat_messages').insert({
            group_id: id,
            sender_id: user_id,
            content: `A member has left the group`,
            type: 'system'
        });

        res.json({ success: true });
    } catch (error) {
        handleError(error, res, 'Failed to leave group');
    }
});

// Get Group Details
router.get('/groups/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Fetch group basic info
        const { data: group, error: groupError } = await supabaseAdmin
            .from('chat_groups')
            .select('*')
            .eq('id', id)
            .single();

        if (groupError) throw groupError;

        // 2. Fetch members with user info
        const { data: members, error: membersError } = await supabaseAdmin
            .from('group_members')
            .select('*, users(name, avatar, email)')
            .eq('group_id', id);

        if (membersError) {
            console.warn('Failed to fetch members with users, falling back to basic members list:', membersError);
            // Fallback: fetch members without join if join fails
            const { data: basicMembers } = await supabaseAdmin
                .from('group_members')
                .select('*')
                .eq('group_id', id);

            group.group_members = basicMembers || [];
        } else {
            group.group_members = members || [];
        }

        sendSuccess(res, group);
    } catch (error) {
        handleError(error, res, 'Failed to fetch group details');
    }
});

// Mute/Unmute Chat
router.put('/chats/:id/mute', async (req, res) => {
    const { id } = req.params;
    const { user_id, muted } = req.body;

    try {
        const { data: existing } = await supabaseAdmin
            .from('chat_settings')
            .select('muted_chats')
            .eq('user_id', user_id)
            .maybeSingle();
        let mutedChats = existing ? (existing.muted_chats || []) : [];
        if (muted) {
            if (!mutedChats.includes(id)) mutedChats.push(id);
        } else {
            mutedChats = mutedChats.filter(cid => cid !== id);
        }

        const { error } = await supabaseAdmin
            .from('chat_settings')
            .upsert({
                user_id,
                muted_chats: mutedChats
            }, { onConflict: 'user_id' });

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        handleError(error, res, 'Failed to mute chat');
    }
});

// Delete (Hide) Chat
router.delete('/chats/:id', async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;

    try {
        const { data: existing } = await supabaseAdmin
            .from('chat_settings')
            .select('deleted_conversations')
            .eq('user_id', user_id)
            .maybeSingle();

        let deletedConv = existing ? (existing.deleted_conversations || []) : [];
        if (!deletedConv.includes(id)) deletedConv.push(id);

        const { error } = await supabaseAdmin
            .from('chat_settings')
            .upsert({
                user_id,
                deleted_conversations: deletedConv
            }, { onConflict: 'user_id' });

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        handleError(error, res, 'Failed to delete chat');
    }
});

// Clear Chat History
router.post('/chats/:id/clear', async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;

    try {
        const { data: existing } = await supabaseAdmin
            .from('chat_settings')
            .select('cleared_at')
            .eq('user_id', user_id)
            .maybeSingle();

        const clearedAt = existing ? (existing.cleared_at || {}) : {};
        clearedAt[id] = new Date().toISOString();

        const { error } = await supabaseAdmin
            .from('chat_settings')
            .upsert({
                user_id,
                cleared_at: clearedAt
            }, { onConflict: 'user_id' });

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        handleError(error, res, 'Failed to clear chat');
    }
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
router.get('/messages', async (req, res) => {
    const { user_id, other_user_id, group_id } = req.query;

    try {
        const contextId = group_id || (other_user_id ? `recent-${other_user_id}` : null);
        let clearedTime = '1970-01-01T00:00:00Z';

        if (user_id && contextId) {
            const { data: settings } = await supabaseAdmin
                .from('chat_settings')
                .select('cleared_at')
                .eq('user_id', user_id)
                .maybeSingle();

            if (settings?.cleared_at?.[contextId]) {
                clearedTime = settings.cleared_at[contextId];
            }
        }

        let query = supabaseAdmin.from('chat_messages').select('*');

        if (group_id) {
            query = query.eq('group_id', group_id);
        } else if (user_id && other_user_id) {
            query = query.or(`and(sender_id.eq.${user_id},receiver_id.eq.${other_user_id}),and(sender_id.eq.${other_user_id},receiver_id.eq.${user_id})`);
            query = query.is('group_id', null);
        } else {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        query = query.gt('created_at', clearedTime)
            .not('deleted_for', 'cs', `{${user_id}}`)
            .order('created_at', { ascending: true });

        const { data: messages, error } = await query;
        if (error) throw error;

        const enriched = messages.map(m => ({
            ...m,
            starred: m.starred_by && m.starred_by.includes(user_id)
        }));

        sendSuccess(res, enriched);
    } catch (error) {
        handleError(error, res, 'Failed to fetch messages');
    }
});

// Send a message (Direct or Group)
router.post('/messages', async (req, res) => {
    const { sender_id, receiver_id, group_id, content, type, reply_to_id, file_url, file_name, file_type, file_size } = req.body;

    if (!sender_id || (!content && !file_url) || (!receiver_id && !group_id)) {
        return res.status(400).json({ data: null, error: 'Invalid message data' });
    }

    try {
        const messageData = {
            sender_id,
            receiver_id: receiver_id || null,
            group_id: group_id || null,
            content,
            type: type || 'text',
            reply_to_id: reply_to_id || null,
            file_url: file_url || null,
            file_name: file_name || null,
            file_type: file_type || null,
            file_size: file_size || null
        };

        const { data: newMessage, error } = await supabaseAdmin
            .from('chat_messages')
            .insert(messageData)
            .select()
            .single();

        if (error) throw error;
        sendSuccess(res, newMessage);
    } catch (error) {
        handleError(error, res, 'Failed to send message');
    }
});

// Pin/Unpin Message
router.put('/messages/:id/pin', async (req, res) => {
    const { id } = req.params;
    const { pinned } = req.body;

    try {
        const { data: msg, error } = await supabaseAdmin
            .from('chat_messages')
            .update({ is_pinned: pinned })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        sendSuccess(res, msg);
    } catch (error) {
        handleError(error, res, 'Failed to pin message');
    }
});

// Star/Unstar Message
router.put('/messages/:id/star', async (req, res) => {
    const { id } = req.params;
    const { user_id, starred } = req.body;

    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    try {
        const { data: existing } = await supabaseAdmin
            .from('chat_messages')
            .select('starred_by')
            .eq('id', id)
            .single();

        let starredBy = existing ? (existing.starred_by || []) : [];
        if (starred) {
            if (!starredBy.includes(user_id)) starredBy.push(user_id);
        } else {
            starredBy = starredBy.filter(uid => uid !== user_id);
        }

        const { data: msg, error } = await supabaseAdmin
            .from('chat_messages')
            .update({ starred_by: starredBy })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        const resp = { ...msg, starred: starred };
        sendSuccess(res, resp);
    } catch (error) {
        handleError(error, res, 'Failed to star message');
    }
});

// Delete Message
router.delete('/messages/:id', async (req, res) => {
    const { id } = req.params;
    const { user_id, type } = req.query; // type: 'me' or 'everyone'

    if (!user_id || !type) return res.status(400).json({ error: 'user_id and type are required' });

    try {
        if (type === 'everyone') {
            const { data: msg } = await supabaseAdmin
                .from('chat_messages')
                .select('sender_id')
                .eq('id', id)
                .single();

            if (msg.sender_id !== user_id) {
                return res.status(403).json({ error: 'Not authorized to delete for everyone' });
            }

            const { error } = await supabaseAdmin
                .from('chat_messages')
                .update({
                    content: 'This message was deleted',
                    type: 'system',
                    is_deleted: true,
                    file_url: null
                })
                .eq('id', id);

            if (error) throw error;
        } else {
            const { data: existing } = await supabaseAdmin
                .from('chat_messages')
                .select('deleted_for')
                .eq('id', id)
                .single();

            let deletedFor = existing ? (existing.deleted_for || []) : [];
            if (!deletedFor.includes(user_id)) deletedFor.push(user_id);

            const { error } = await supabaseAdmin
                .from('chat_messages')
                .update({ deleted_for: deletedFor })
                .eq('id', id);

            if (error) throw error;
        }

        res.json({ success: true, id });
    } catch (error) {
        handleError(error, res, 'Failed to delete message');
    }
});

// Add Reaction to Message
router.post('/messages/:id/reactions', async (req, res) => {
    const { id } = req.params;
    const { user_id, user_name, emoji } = req.body;

    try {
        const { data: existing } = await supabaseAdmin
            .from('chat_messages')
            .select('reactions')
            .eq('id', id)
            .single();

        const reactions = existing ? (existing.reactions || []) : [];
        const alreadySet = reactions.find(r => r.user_id === user_id && r.emoji === emoji);

        if (!alreadySet) {
            reactions.push({ user_id, user_name, emoji });
            const { data: msg, error } = await supabaseAdmin
                .from('chat_messages')
                .update({ reactions })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            sendSuccess(res, msg);
        } else {
            sendSuccess(res, existing);
        }
    } catch (error) {
        handleError(error, res, 'Failed to add reaction');
    }
});

// Remove Reaction from Message
router.delete('/messages/:id/reactions/:emoji', async (req, res) => {
    const { id, emoji } = req.params;
    const { user_id } = req.query;

    try {
        const { data: existing } = await supabaseAdmin
            .from('chat_messages')
            .select('reactions')
            .eq('id', id)
            .single();

        const reactions = existing ? (existing.reactions || []) : [];
        const filtered = reactions.filter(r => !(r.user_id === user_id && r.emoji === emoji));

        const { data: msg, error } = await supabaseAdmin
            .from('chat_messages')
            .update({ reactions: filtered })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        sendSuccess(res, msg);
    } catch (error) {
        handleError(error, res, 'Failed to remove reaction');
    }
});

// Mark messages as read
router.put('/messages/read', async (req, res) => {
    const { user_id, other_user_id, group_id } = req.body;

    try {
        if (group_id) {
            const { data: msgs } = await supabaseAdmin
                .from('chat_messages')
                .select('id, read_by')
                .eq('group_id', group_id)
                .neq('sender_id', user_id)
                .not('read_by', 'cs', `{${user_id}}`);

            if (msgs?.length > 0) {
                for (const m of msgs) {
                    const newReadBy = [...(m.read_by || []), user_id];
                    await supabaseAdmin
                        .from('chat_messages')
                        .update({ read_by: newReadBy })
                        .eq('id', m.id);
                }
            }
        } else if (other_user_id) {
            await supabaseAdmin
                .from('chat_messages')
                .update({
                    read: true
                })
                .eq('receiver_id', user_id)
                .eq('sender_id', other_user_id)
                .is('group_id', null) // Ensure we only target direct messages
                .eq('read', false);
        }
        res.json({ success: true });
    } catch (error) {
        handleError(error, res, 'Failed to mark messages as read');
    }
});

// Initiate a call
router.post('/calls', async (req, res) => {
    res.json({ data: { status: 'initiated' }, error: null });
});

// End a call
router.put('/calls/:id/end', async (req, res) => {
    res.json({ data: { status: 'ended' }, error: null });
});

export default router;
