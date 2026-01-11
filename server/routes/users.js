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
    const { college_email, ...userData } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Note: Email sending is handled by the frontend after the final email and loopid are set
    // This prevents sending emails with temp- prefix
    
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
    const userId = req.params.id;
    
    // Delete related records first to avoid foreign key constraint violations
    // Order matters: delete child records before parent
    
    // 1. Delete hall_tickets
    const { error: hallTicketsError } = await supabaseAdmin
      .from('hall_tickets')
      .delete()
      .eq('student_id', userId);
    
    if (hallTicketsError) {
      console.error('Error deleting hall tickets:', hallTicketsError);
      // Continue even if this fails - might not exist
    }
    
    // 2. Delete attendance records
    const { error: attendanceError } = await supabaseAdmin
      .from('attendance')
      .delete()
      .eq('student_id', userId);
    
    if (attendanceError) {
      console.error('Error deleting attendance:', attendanceError);
      // Continue even if this fails - might not exist
    }
    
    // 3. Delete fees/payments
    const { error: feesError } = await supabaseAdmin
      .from('fees')
      .delete()
      .eq('student_id', userId);
    
    if (feesError) {
      console.error('Error deleting fees:', feesError);
      // Continue even if this fails - might not exist
    }
    
    // 4. Delete salaries (if user is staff)
    const { error: salariesError } = await supabaseAdmin
      .from('salaries')
      .delete()
      .eq('user_id', userId);
    
    if (salariesError) {
      console.error('Error deleting salaries:', salariesError);
      // Continue even if this fails - might not exist
    }
    
    // 5. Delete promotions
    const { error: promotionsError } = await supabaseAdmin
      .from('promotions')
      .delete()
      .or(`user_id.eq.${userId},created_by.eq.${userId}`);
    
    if (promotionsError) {
      console.error('Error deleting promotions:', promotionsError);
      // Continue even if this fails - might not exist
    }
    
    // 6. Delete salary_hikes
    const { error: salaryHikesError } = await supabaseAdmin
      .from('salary_hikes')
      .delete()
      .or(`user_id.eq.${userId},approved_by.eq.${userId}`);
    
    if (salaryHikesError) {
      console.error('Error deleting salary hikes:', salaryHikesError);
      // Continue even if this fails - might not exist
    }
    
    // 7. Delete teacher_departments (if user is a teacher)
    const { error: teacherDeptsError } = await supabaseAdmin
      .from('teacher_departments')
      .delete()
      .eq('teacher_id', userId);
    
    if (teacherDeptsError) {
      console.error('Error deleting teacher departments:', teacherDeptsError);
      // Continue even if this fails - might not exist
    }
    
    // 8. Delete book_issues (library)
    const { error: bookIssuesError } = await supabaseAdmin
      .from('book_issues')
      .delete()
      .eq('member_id', userId);
    
    if (bookIssuesError) {
      console.error('Error deleting book issues:', bookIssuesError);
      // Continue even if this fails - might not exist
    }
    
    // 9. Delete hostel allocations
    const { error: hostelAllocationsError } = await supabaseAdmin
      .from('hostel_allocations')
      .delete()
      .eq('student_id', userId);
    
    if (hostelAllocationsError) {
      console.error('Error deleting hostel allocations:', hostelAllocationsError);
      // Continue even if this fails - might not exist
    }
    
    // 10. Delete library members
    const { error: libraryMembersError } = await supabaseAdmin
      .from('library_members')
      .delete()
      .eq('user_id', userId);
    
    if (libraryMembersError) {
      console.error('Error deleting library members:', libraryMembersError);
      // Continue even if this fails - might not exist
    }
    
    // Finally, delete the user
    const { error: userError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (userError) throw userError;
    
    sendSuccess(res, { success: true, message: 'User and all related records deleted successfully' });
  } catch (error) {
    handleError(error, res, 'Failed to delete user');
  }
});

// Send welcome email
router.post('/send-welcome-email', async (req, res) => {
  try {
    const { college_email, loop_email, loopid, user_name } = req.body;
    
    if (!college_email) {
      return sendValidationError(res, 'College email is required');
    }
    
    const { sendWelcomeEmail, generatePassword } = await import('../services/email.js');
    const password = generatePassword();
    
    await sendWelcomeEmail(
      college_email,
      loop_email || '',
      loopid || '',
      password,
      user_name || 'User'
    );
    
    sendSuccess(res, { success: true, message: 'Welcome email sent successfully' });
  } catch (error) {
    handleError(error, res, 'Failed to send welcome email');
  }
});

export default router;

