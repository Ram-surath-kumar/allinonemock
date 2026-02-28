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
    const updateData = { ...req.body };

    // Validate allowed_tabs if provided
    if (updateData.allowed_tabs) {
      if (!Array.isArray(updateData.allowed_tabs)) {
        return res.status(400).json({ error: 'allowed_tabs must be an array' });
      }

      const validTabs = [
        'dashboard', 'chat', 'users', 'students', 'attendance',
        'academic_gov', 'mis_reports', 'finance', 'facilities',
        'hostel', 'library', 'transport', 'exam', 'tools', 'settings'
      ];

      const invalidTabs = updateData.allowed_tabs.filter(tab => !validTabs.includes(tab));
      if (invalidTabs.length > 0) {
        return res.status(400).json({
          error: `Invalid tabs: ${invalidTabs.join(', ')}. Valid tabs are: ${validTabs.join(', ')}`
        });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update(updateData)
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

