import express from 'express';
import { supabaseAdmin } from '../common.js';
import { handleError, sendSuccess } from '../common.js';

const router = express.Router();

// Get notifications
router.get('/', async (req, res) => {
  try {
    const { user_id, read, limit } = req.query;
    let query = supabaseAdmin.from('notifications').select('*');
    
    if (user_id) query = query.eq('user_id', user_id);
    if (read !== undefined) query = query.eq('read', read === 'true');
    
    query = query.order('created_at', { ascending: false });
    if (limit) query = query.limit(parseInt(limit));
    
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to fetch notifications');
  }
});

// Create notification
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(req.body)
      .select()
      .single();
    
    if (error) throw error;
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to create notification');
  }
});

// Mark all notifications as read for a user
router.put('/read-all', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        data: null,
        error: 'User ID is required'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user_id)
      .eq('read', false)
      .select();
    
    if (error) throw error;
    sendSuccess(res, data || []);
  } catch (error) {
    handleError(error, res, 'Failed to mark all notifications as read');
  }
});

// Mark single notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to mark notification as read');
  }
});

// Update notification (generic update)
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to update notification');
  }
});

export default router;

