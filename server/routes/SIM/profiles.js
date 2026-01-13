import express from 'express';
import { supabase, supabaseAdmin } from '../../common.js';
import { handleError, sendSuccess, sendValidationError } from '../../common.js';

const router = express.Router();

// Get profile by user_id
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found"

    sendSuccess(res, data || {}); // Return empty object if no profile exists yet
  } catch (error) {
    handleError(error, res, 'Failed to fetch student profile');
  }
});

// Create or Update profile
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;

    // Ensure user_id is set
    profileData.user_id = userId;

    const { data, error } = await supabaseAdmin
      .from('student_profiles')
      .upsert(profileData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    res.json({ status: 'success', data, error: null });
  } catch (error) {
    handleError(error, res, 'Failed to update student profile');
  }
});

export default router;
