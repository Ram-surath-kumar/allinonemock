import express from 'express';
import { supabaseAdmin } from '../common.js';
import { handleError, sendSuccess, sendValidationError } from '../common.js';

const router = express.Router();

// Get all books
router.get('/books', async (req, res) => {
  try {
    const filters = req.query;
    
    let query = supabaseAdmin
      .from('books')
      .select('*');
    
    // Apply filters if provided
    if (filters.title) {
      query = query.ilike('title', `%${filters.title}%`);
    }
    if (filters.author) {
      query = query.ilike('author', `%${filters.author}%`);
    }
    if (filters.isbn) {
      query = query.eq('isbn', filters.isbn);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    sendSuccess(res, data || []);
  } catch (error) {
    handleError(error, res, 'Failed to fetch books');
  }
});

// Get library member by ID
router.get('/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('library_members')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ data: null, error: 'Member not found' });
      }
      throw error;
    }
    
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to fetch library member');
  }
});

// Issue a book
router.post('/issue', async (req, res) => {
  try {
    const { member_id, copy_id } = req.body;
    
    if (!member_id || !copy_id) {
      return sendValidationError(res, 'member_id and copy_id are required');
    }
    
    // Check if copy is available
    const { data: copy, error: copyError } = await supabaseAdmin
      .from('book_copies')
      .select('*')
      .eq('id', copy_id)
      .single();
    
    if (copyError || !copy) {
      return res.status(404).json({ data: null, error: 'Book copy not found' });
    }
    
    if (copy.status !== 'available') {
      return res.status(400).json({ data: null, error: 'Book copy is not available' });
    }
    
    // Create issue record
    const issueData = {
      member_id,
      copy_id,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
      status: 'issued'
    };
    
    const { data: issue, error: issueError } = await supabaseAdmin
      .from('book_issues')
      .insert(issueData)
      .select()
      .single();
    
    if (issueError) {
      throw issueError;
    }
    
    // Update copy status
    await supabaseAdmin
      .from('book_copies')
      .update({ status: 'issued' })
      .eq('id', copy_id);
    
    sendSuccess(res, issue);
  } catch (error) {
    handleError(error, res, 'Failed to issue book');
  }
});

// Return a book
router.post('/return', async (req, res) => {
  try {
    const { copy_id } = req.body;
    
    if (!copy_id) {
      return sendValidationError(res, 'copy_id is required');
    }
    
    // Find the active issue for this copy
    const { data: issue, error: issueError } = await supabaseAdmin
      .from('book_issues')
      .select('*')
      .eq('copy_id', copy_id)
      .eq('status', 'issued')
      .order('issue_date', { ascending: false })
      .limit(1)
      .single();
    
    if (issueError || !issue) {
      return res.status(404).json({ data: null, error: 'No active issue found for this copy' });
    }
    
    // Update issue record
    const { data: updatedIssue, error: updateError } = await supabaseAdmin
      .from('book_issues')
      .update({
        status: 'returned',
        returned_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', issue.id)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    // Update copy status
    await supabaseAdmin
      .from('book_copies')
      .update({ status: 'available' })
      .eq('id', copy_id);
    
    sendSuccess(res, updatedIssue);
  } catch (error) {
    handleError(error, res, 'Failed to return book');
  }
});

export default router;

