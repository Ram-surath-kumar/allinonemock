import express from 'express';
import { supabase, supabaseAdmin } from '../common.js';
import { handleError, sendSuccess } from '../common.js';

const router = express.Router();

// Get teacher departments
router.get('/:teacherId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('teacher_departments')
      .select('*')
      .eq('teacher_id', req.params.teacherId);
    
    if (error) throw error;
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to fetch teacher departments');
  }
});

// Update teacher departments
router.post('/', async (req, res) => {
  try {
    const { teacher_id, department_ids } = req.body;
    
    // Use admin client for write operations to bypass RLS
    // Delete existing associations
    const { error: deleteError } = await supabaseAdmin
      .from('teacher_departments')
      .delete()
      .eq('teacher_id', teacher_id);
    
    if (deleteError) throw deleteError;
    
    // Insert new associations
    if (department_ids && department_ids.length > 0) {
      const associations = department_ids.map(deptId => ({
        teacher_id,
        department_id: deptId
      }));
      
      const { data, error: insertError } = await supabaseAdmin
        .from('teacher_departments')
        .insert(associations)
        .select();
      
      if (insertError) throw insertError;
      sendSuccess(res, data);
    } else {
      sendSuccess(res, []);
    }
  } catch (error) {
    handleError(error, res, 'Failed to update teacher departments');
  }
});

export default router;

