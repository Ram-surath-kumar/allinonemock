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
    
    // Get user info before deletion (for auth user deletion)
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('email, loopid')
      .eq('id', userId)
      .single();
    
    // Delete related records first to avoid foreign key constraint violations
    // Order matters: delete child records before parent
    
    // 1. Delete notifications
    await supabaseAdmin.from('notifications').delete().eq('user_id', userId);
    
    // 2. Delete hall_tickets
    await supabaseAdmin.from('hall_tickets').delete().eq('student_id', userId);
    
    // 3. Delete attendance records (both as student and as marker)
    await supabaseAdmin.from('attendance').delete().eq('student_id', userId);
    await supabaseAdmin.from('attendance').delete().eq('marked_by', userId);
    
    // 4. Delete exam attendance (both as student and as marker)
    await supabaseAdmin.from('exam_attendance').delete().eq('student_id', userId);
    await supabaseAdmin.from('exam_attendance').delete().eq('marked_by', userId);
    
    // 5. Delete seating plans
    await supabaseAdmin.from('seating_plans').delete().eq('student_id', userId);
    
    // 6. Delete exam logs
    await supabaseAdmin.from('exam_logs').delete().eq('logged_by', userId);
    
    // 7. Delete marks entries (both as student and as evaluator)
    await supabaseAdmin.from('marks_entries').delete().eq('student_id', userId);
    await supabaseAdmin.from('marks_entries').delete().eq('evaluated_by', userId);
    
    // 8. Delete student results
    await supabaseAdmin.from('student_results').delete().eq('student_id', userId);
    
    // 9. Delete student fees
    await supabaseAdmin.from('student_fees').delete().eq('student_id', userId);
    
    // 10. Delete payments (both as student and as creator)
    await supabaseAdmin.from('payments').delete().eq('student_id', userId);
    await supabaseAdmin.from('payments').delete().eq('created_by', userId);
    
    // 11. Delete refund requests (as student, requester, or approver)
    await supabaseAdmin.from('refund_requests').delete().eq('student_id', userId);
    await supabaseAdmin.from('refund_requests').delete().eq('requested_by', userId);
    await supabaseAdmin.from('refund_requests').delete().eq('approved_by', userId);
    
    // 12. Delete fees (old table)
    await supabaseAdmin.from('fees').delete().eq('student_id', userId);
    
    // 13. Delete salaries (if user is staff)
    await supabaseAdmin.from('salaries').delete().eq('user_id', userId);
    
    // 14. Delete promotions (as user or creator)
    await supabaseAdmin.from('promotions').delete().eq('user_id', userId);
    await supabaseAdmin.from('promotions').delete().eq('created_by', userId);
    
    // 15. Delete salary_hikes (as user or approver)
    await supabaseAdmin.from('salary_hikes').delete().eq('user_id', userId);
    await supabaseAdmin.from('salary_hikes').delete().eq('approved_by', userId);
    
    // 16. Delete teacher_departments (if user is a teacher)
    await supabaseAdmin.from('teacher_departments').delete().eq('teacher_id', userId);
    
    // 17. Delete invigilation duties
    await supabaseAdmin.from('invigilation_duties').delete().eq('faculty_id', userId);
    
    // 18. Delete library members (this will cascade to book_issues via member_id)
    await supabaseAdmin.from('library_members').delete().eq('user_id', userId);
    
    // 19. Delete book_issues where user issued the book
    await supabaseAdmin.from('book_issues').delete().eq('issued_by', userId);
    
    // 20. Delete hostel allocations (both old and new tables)
    await supabaseAdmin.from('hostel_allocations').delete().eq('student_id', userId);
    await supabaseAdmin.from('hostel_allocations_api').delete().eq('user_id', userId);
    await supabaseAdmin.from('hostel_allocations_api').delete().eq('allocated_by', userId);
    
    // 21. Delete hostel applications
    await supabaseAdmin.from('hostel_applications').delete().eq('student_id', userId);
    
    // 22. Delete visitor logs (as student or approver)
    await supabaseAdmin.from('visitor_logs').delete().eq('student_id', userId);
    await supabaseAdmin.from('visitor_logs').delete().eq('approved_by', userId);
    
    // 23. Delete hostel fees
    await supabaseAdmin.from('hostel_fees').delete().eq('student_id', userId);
    
    // 24. Delete mess attendance
    await supabaseAdmin.from('mess_attendance').delete().eq('student_id', userId);
    
    // 25. Delete hostel complaints (as reporter or against)
    await supabaseAdmin.from('hostel_complaints').delete().eq('reporter_id', userId);
    await supabaseAdmin.from('hostel_complaints').delete().eq('against_id', userId);
    
    // 26. Delete disciplinary actions (as student or approver)
    await supabaseAdmin.from('disciplinary_actions').delete().eq('student_id', userId);
    await supabaseAdmin.from('disciplinary_actions').delete().eq('approved_by', userId);
    
    // 27. Delete journal entries
    await supabaseAdmin.from('journal_entries').delete().eq('created_by', userId);
    
    // 28. Delete tax filings
    await supabaseAdmin.from('tax_filings').delete().eq('created_by', userId);
    
    // 29. Set departments.created_by to NULL (don't delete departments)
    await supabaseAdmin
      .from('departments')
      .update({ created_by: null })
      .eq('created_by', userId);
    
    // 30. Delete from Supabase Auth (if email exists)
    if (userData?.email) {
      try {
        // Use Management API to delete auth user
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (supabaseUrl && supabaseServiceKey) {
          // List users to find auth user ID
          const listResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Content-Type': 'application/json'
            }
          });
          
          if (listResponse.ok) {
            const users = await listResponse.json();
            const authUser = users.users?.find(u => u.email === userData.email);
            
            if (authUser) {
              // Delete auth user
              const deleteResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${authUser.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'apikey': supabaseServiceKey,
                  'Content-Type': 'application/json'
                }
              });
              
              if (deleteResponse.ok) {
                console.log('✅ Auth user deleted successfully');
              } else {
                console.warn('⚠️  Could not delete auth user:', await deleteResponse.text());
              }
            }
          }
        }
      } catch (authError) {
        console.warn('⚠️  Error deleting auth user (non-critical):', authError.message);
        // Continue with user deletion even if auth user deletion fails
      }
    }
    
    // Finally, delete the user from public.users
    const { error: userError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (userError) throw userError;
    
    sendSuccess(res, { 
      success: true, 
      message: 'User and all associated data deleted successfully from all tables and Supabase Auth' 
    });
  } catch (error) {
    handleError(error, res, 'Failed to delete user');
  }
});

// Send welcome email
router.post('/send-welcome-email', async (req, res) => {
  try {
    const { college_email, loop_email, loopid, user_name, user_id } = req.body;
    
    if (!college_email || !loop_email) {
      return sendValidationError(res, 'College email and loop email are required');
    }
    
    const { sendWelcomeEmail, generatePassword } = await import('../services/email.js');
    const password = generatePassword();
    
    // Create or update auth user with the password
    // IMPORTANT: This must succeed before sending the email to ensure password matches
    let authUserCreated = false;
    try {
      // First, try to create the user
      const userMetadata = {
        name: user_name,
        loopid: loopid || ''
      };
      
      // Only include user_id if it's provided
      if (user_id) {
        userMetadata.user_id = user_id;
      }
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: loop_email,
        password: password,
        email_confirm: true,
        user_metadata: userMetadata
      });
      
      if (createError) {
        // If user already exists, try to find and update them
        if (createError.message && (createError.message.includes('already registered') || createError.message.includes('already exists') || createError.message.includes('User already registered'))) {
          console.log('⚠️  Auth user already exists, attempting to find and update...');
          
          // Use Management API to list users and find by email
          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          
          if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase configuration missing');
          }
          
          // List users and find by email
          const listResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Content-Type': 'application/json'
            }
          });
          
          if (!listResponse.ok) {
            const errorText = await listResponse.text();
            throw new Error(`Failed to list users: ${listResponse.statusText} - ${errorText}`);
          }
          
          const users = await listResponse.json();
          const existingUser = users.users?.find(u => u.email === loop_email);
          
          if (existingUser) {
            console.log(`✅ Found existing auth user: ${existingUser.id}`);
            // Update existing user's password
            const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${existingUser.id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                password: password,
                email_confirm: true,
                user_metadata: userMetadata
              })
            });
            
            if (!updateResponse.ok) {
              const errorData = await updateResponse.json();
              const errorText = await updateResponse.text();
              console.error('❌ Failed to update auth user:', errorData || errorText);
              throw new Error(`Failed to update user password: ${JSON.stringify(errorData || errorText)}`);
            }
            
            const updatedData = await updateResponse.json();
            console.log('✅ Auth user password updated successfully');
            console.log(`📧 Email: ${loop_email}, 🔑 Password: ${password}`);
            
            // Verify the password was set correctly by testing login
            try {
              const testClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || '');
              const { error: testError } = await testClient.auth.signInWithPassword({
                email: loop_email,
                password: password
              });
              
              if (testError) {
                console.warn('⚠️  WARNING: Password updated but login test failed:', testError.message);
                console.warn('⚠️  This might indicate a password format issue');
              } else {
                console.log('✅ Password verification: Login test successful');
                await testClient.auth.signOut();
              }
            } catch (testErr) {
              console.warn('⚠️  Could not verify password (non-critical):', testErr.message);
            }
            
            authUserCreated = true;
          } else {
            throw new Error(`User already exists but could not be found in auth.users. Email: ${loop_email}`);
          }
        } else {
          // Some other error occurred
          console.error('❌ Error creating auth user:', createError);
          throw createError;
        }
      } else {
        // User created successfully
        authUserCreated = true;
        console.log('✅ Auth user created successfully');
        console.log(`📧 Email: ${loop_email}, 🔑 Password: ${password}`);
        
        // Verify the password was set correctly by testing login
        try {
          const supabaseUrl = process.env.SUPABASE_URL;
          const testClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || '');
          const { error: testError } = await testClient.auth.signInWithPassword({
            email: loop_email,
            password: password
          });
          
          if (testError) {
            console.warn('⚠️  WARNING: User created but login test failed:', testError.message);
          } else {
            console.log('✅ Password verification: Login test successful');
            await testClient.auth.signOut();
          }
        } catch (testErr) {
          console.warn('⚠️  Could not verify password (non-critical):', testErr.message);
        }
      }
    } catch (authError) {
      console.error('❌ CRITICAL: Error creating/updating auth user:', authError);
      // DO NOT send email if auth user creation fails - passwords won't match!
      return handleError(authError, res, 'Failed to create/update auth user. Email not sent to prevent password mismatch.');
    }
    
    // Only send email if auth user was successfully created/updated
    if (!authUserCreated) {
      return handleError(new Error('Auth user creation failed'), res, 'Failed to create auth user. Email not sent.');
    }
    
    // Send welcome email
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

