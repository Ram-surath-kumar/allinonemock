import express from 'express';
import { supabase, supabaseAdmin } from '../common.js';
import { handleError, sendSuccess, sendValidationError } from '../common.js';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const { role, status, department_id, org_id, user_id, email } = req.query;
    
    let query = supabase.from('users').select('*');
    
    if (role) query = query.eq('role', role);
    if (status) query = query.eq('status', status);
    if (department_id) query = query.eq('department_id', department_id);
    if (org_id) query = query.eq('org_id', org_id);
    if (user_id) query = query.eq('user_id', user_id);
    if (email) query = query.eq('email', email);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to fetch users');
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to fetch user');
  }
});

// Get users by department IDs
router.post('/by-departments', async (req, res) => {
  try {
    const { department_ids, role, status } = req.body;
    
    let query = supabase.from('users').select('*');
    
    if (department_ids && department_ids.length > 0) {
      query = query.in('department_id', department_ids);
    }
    if (role) query = query.eq('role', role);
    if (status) query = query.eq('status', status);
    
    const { data, error } = await query.order('name', { ascending: true });
    
    if (error) throw error;
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to fetch users by departments');
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(req.body)
      .select()
      .single();
    
    if (error) throw error;
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to create user');
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to update user');
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    sendSuccess(res, { success: true });
  } catch (error) {
    handleError(error, res, 'Failed to delete user');
  }
});

export default router;

