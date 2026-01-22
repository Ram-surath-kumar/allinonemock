import express from 'express';
import { supabaseAdmin, handleError, sendSuccess } from '../common.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data: documents, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .limit(10);
    
    if (error) throw error;
    sendSuccess(res, documents);
  } catch (error) {
    handleError(error, res, 'Failed to fetch documents');
  }
});

export default router;
