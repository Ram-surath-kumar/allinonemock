import express from 'express';
import { supabaseAdmin } from '../common.js';
import { handleError, sendSuccess, sendValidationError } from '../common.js';

const router = express.Router();

// Get all custom roles
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('custom_roles')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      // If table doesn't exist, return empty array instead of error
      if (error.message && (error.message.includes('PGRST205') || error.message.includes('custom_roles') || error.message.includes('schema cache'))) {
        console.warn('⚠️  Custom roles table not found. Returning empty array.');
        return sendSuccess(res, []);
      }
      throw error;
    }
    
    sendSuccess(res, data || []);
  } catch (error) {
    handleError(error, res, 'Failed to fetch custom roles');
  }
});

// Get custom role by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('custom_roles')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) {
      // If table doesn't exist, return null
      if (error.message && (error.message.includes('PGRST205') || error.message.includes('custom_roles') || error.message.includes('schema cache'))) {
        return sendSuccess(res, null);
      }
      throw error;
    }
    
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to fetch custom role');
  }
});

// Create custom role
router.post('/', async (req, res) => {
  try {
    const { name, permissions, description } = req.body;
    
    if (!name) {
      return sendValidationError(res, 'Role name is required');
    }
    
    if (!permissions || !Array.isArray(permissions)) {
      return sendValidationError(res, 'Permissions array is required');
    }
    
    const { data, error } = await supabaseAdmin
      .from('custom_roles')
      .insert({
        name,
        permissions,
        description: description || null
      })
      .select()
      .single();
    
    if (error) {
      // If table doesn't exist, provide helpful error
      if (error.message && (error.message.includes('PGRST205') || error.message.includes('custom_roles') || error.message.includes('schema cache'))) {
        return res.status(500).json({
          data: null,
          error: 'Custom roles table not found. Please create the custom_roles table in Supabase.'
        });
      }
      throw error;
    }
    
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to create custom role');
  }
});

// Update custom role
router.put('/:id', async (req, res) => {
  try {
    const { name, permissions, description } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (permissions !== undefined) {
      if (!Array.isArray(permissions)) {
        return sendValidationError(res, 'Permissions must be an array');
      }
      updateData.permissions = permissions;
    }
    if (description !== undefined) updateData.description = description;
    
    const { data, error } = await supabaseAdmin
      .from('custom_roles')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) {
      // If table doesn't exist, provide helpful error
      if (error.message && (error.message.includes('PGRST205') || error.message.includes('custom_roles') || error.message.includes('schema cache'))) {
        return res.status(500).json({
          data: null,
          error: 'Custom roles table not found. Please create the custom_roles table in Supabase.'
        });
      }
      throw error;
    }
    
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to update custom role');
  }
});

// Delete custom role
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('custom_roles')
      .delete()
      .eq('id', req.params.id);
    
    if (error) {
      // If table doesn't exist, provide helpful error
      if (error.message && (error.message.includes('PGRST205') || error.message.includes('custom_roles') || error.message.includes('schema cache'))) {
        return res.status(500).json({
          data: null,
          error: 'Custom roles table not found. Please create the custom_roles table in Supabase.'
        });
      }
      throw error;
    }
    
    sendSuccess(res, { success: true });
  } catch (error) {
    handleError(error, res, 'Failed to delete custom role');
  }
});

export default router;

