import express from 'express';
import { supabase, supabaseAdmin } from '../common.js';
import { handleError, sendSuccess } from '../common.js';

const router = express.Router();

// Get departments
router.get('/', async (req, res) => {
  try {
    const { id, ids } = req.query;
    let query = supabase.from('departments').select('*');
    
    if (id) query = query.eq('id', id);
    if (ids) {
      const idArray = Array.isArray(ids) ? ids : ids.split(',');
      query = query.in('id', idArray);
    }
    
    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to fetch departments');
  }
});

// Create department
router.post('/', async (req, res) => {
  try {
    // Try with service role key first (bypasses RLS)
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('departments')
        .insert(req.body)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Department creation error:', error);
        throw error;
      }
      
      console.log('✅ Department created successfully:', data);
      return sendSuccess(res, data);
    }
    
    // Fallback: Try with anon key (may fail due to RLS, but worth trying)
    console.warn('⚠️  Attempting department creation with anon key (may fail due to RLS)...');
    const { data, error } = await supabase
      .from('departments')
      .insert(req.body)
      .select()
      .single();
    
    if (error) {
      // If RLS error, provide helpful message with SQL solution
      if (error.message && error.message.includes('row-level security')) {
        console.error('❌ RLS policy violation. Service role key required or RLS must be disabled.');
        return res.status(500).json({ 
          data: null, 
          error: `Row Level Security (RLS) is blocking department creation. To fix this:\n\nOPTION 1 (Recommended): Add Service Role Key\n1. Go to: https://supabase.com/dashboard/project/vzkbyzpqnojhlazwopvz/settings/api\n2. Copy the "service_role" key\n3. Add to server/.env: SUPABASE_SERVICE_ROLE_KEY=your_key\n4. Restart server\n\nOPTION 2: Disable RLS temporarily\nRun this SQL in Supabase SQL Editor:\nALTER TABLE departments DISABLE ROW LEVEL SECURITY;\n\nThen restart the server.` 
        });
      }
      throw error;
    }
    
    console.log('✅ Department created successfully (with anon key):', data);
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to create department');
  }
});

// Update department
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('departments')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to update department');
  }
});

// Delete department
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('departments')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    sendSuccess(res, { success: true });
  } catch (error) {
    handleError(error, res, 'Failed to delete department');
  }
});

export default router;

