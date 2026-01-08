import express from 'express';
import { supabase, supabaseAdmin } from '../common.js';
import { handleError, sendSuccess } from '../common.js';

const router = express.Router();

// Get organizations
router.get('/', async (req, res) => {
  try {
    const { org_name, id } = req.query;
    let query = supabase.from('organizations').select('*');
    
    if (org_name) query = query.eq('org_name', org_name);
    if (id) query = query.eq('id', id);
    
    const { data, error } = await query.order('org_name', { ascending: true });
    
    if (error) throw error;
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to fetch organizations');
  }
});

// Get organization by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to fetch organization');
  }
});

// Update organization
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to update organization');
  }
});

export default router;

