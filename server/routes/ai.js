import express from 'express';
import { supabaseAdmin, handleError, sendSuccess, sendValidationError } from '../common.js';

const router = express.Router();

// Get chat history for a user
router.get('/history', async (req, res) => {
    try {
        const { userId, limit = 50 } = req.query;

        if (!userId) {
            return sendValidationError(res, 'userId is required');
        }

        const { data, error } = await supabaseAdmin
            .from('chat_history')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: true }) // Get oldest first to reconstruct conversation
            .limit(parseInt(limit));

        if (error) throw error;

        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch chat history');
    }
});

// Save a chat message
router.post('/history', async (req, res) => {
    try {
        const { userId, role, content, metadata } = req.body;

        if (!userId || !role || !content) {
            return sendValidationError(res, 'userId, role, and content are required');
        }

        const { data, error } = await supabaseAdmin
            .from('chat_history')
            .insert([
                {
                    user_id: userId,
                    role,
                    content,
                    metadata: metadata || {},
                    timestamp: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) throw error;

        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to save chat message');
    }
});

export default router;
