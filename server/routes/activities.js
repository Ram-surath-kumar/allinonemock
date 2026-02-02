import express from 'express';
import { supabaseAdmin } from '../common.js';
import { handleError, sendSuccess } from '../common.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Get activities
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { limit } = req.query;
    let query = supabaseAdmin.from('activities').select('*');
    
    query = query.order('created_at', { ascending: false });
    if (limit) query = query.limit(parseInt(limit));
    
    const { data, error } = await query;
    
    if (error) {
      // If table doesn't exist, return empty array instead of error
      if (error.message && (error.message.includes('PGRST205') || error.message.includes('activities') || error.message.includes('schema cache'))) {
        console.warn('⚠️  Activities table not found. Returning empty array.');
        return sendSuccess(res, []);
      }
      console.error('Error fetching activities:', error);
      throw error;
    }
    
    sendSuccess(res, data || []);
  } catch (error) {
    handleError(error, res, 'Failed to fetch activities');
  }
});

// Create activity/activities
router.post('/', authenticateUser, async (req, res) => {
  try {
    // Support both single object and array of objects for bulk insert
    const isArray = Array.isArray(req.body);
    
    const { data, error } = await supabaseAdmin
      .from('activities')
      .insert(req.body)
      .select();
    
    if (error) {
      // If table doesn't exist, provide helpful error
      if (error.message && (error.message.includes('PGRST205') || error.message.includes('activities') || error.message.includes('schema cache'))) {
        return res.status(500).json({
          data: null,
          error: 'Activities table not found. Please create the activities table in Supabase.'
        });
      }
      throw error;
    }
    
    // If single object was sent, return single object; otherwise return array
    sendSuccess(res, isArray ? data : (data && data[0] || null));
  } catch (error) {
    handleError(error, res, 'Failed to create activity');
  }
});

export default router;

