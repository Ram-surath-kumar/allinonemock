
import express from 'express';
import { supabase, supabaseAdmin } from '../common.js';
import { handleError, sendSuccess, sendValidationError } from '../common.js';
import { authenticateUser, authorizeRole } from '../middleware/auth.js';
import { secureDb } from '../services/db.js';

const router = express.Router();

// Apply Authentication to all user routes
router.use(authenticateUser);

// Get all users
// Enforce RBAC manually to allow "Self-Service" (getting own profile)
router.get('/', async (req, res) => {
  const { role, status, department_id, org_id, user_id, email } = req.query;

  // 1. Self-Service Check: Allow if user is fetching their own profile by email
  const isSelfService = email && (req.user.email === email || req.userProfile.email === email);

  // 2. Admin/Registrar/Faculty Check
  const isAdminOrRegistrar = ['admin', 'registrar', 'teacher', 'faculty'].includes(req.userProfile.role);

  if (!isSelfService && !isAdminOrRegistrar) {
    return res.status(403).json({ error: 'Access Denied: Requires admin, registrar or faculty privileges' });
  }

  try {
    const users = await secureDb.get('users', (query) => {
      if (role) query = query.eq('role', role);
      if (status) query = query.eq('status', status);
      if (department_id) query = query.eq('department_id', department_id);
      if (org_id) query = query.eq('org_id', parseInt(org_id, 10));
      if (user_id) query = query.eq('user_id', parseInt(user_id, 10));
      if (email) query = query.eq('email', email);
      return query.order('created_at', { ascending: false });
    });

    sendSuccess(res, users);
  } catch (error) {
    handleError(error, res, 'Failed to fetch users');
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    // Access control check
    if (req.userProfile.role !== 'admin' && req.userProfile.role !== 'registrar' && req.userProfile.id !== req.params.id) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    const users = await secureDb.get('users', (q) => q.eq('id', req.params.id).single());

    sendSuccess(res, users);
  } catch (error) {
    handleError(error, res, 'Failed to fetch user');
  }
});

// Get users by department IDs
router.post('/by-departments', authorizeRole(['admin', 'registrar', 'faculty']), async (req, res) => {
  try {
    const { department_ids, role, status } = req.body;

    const users = await secureDb.get('users', (query) => {
      if (department_ids && department_ids.length > 0) {
        query = query.in('department_id', department_ids);
      }
      if (role) query = query.eq('role', role);
      if (status) query = query.eq('status', status);
      return query.order('name', { ascending: true });
    });

    sendSuccess(res, users);
  } catch (error) {
    handleError(error, res, 'Failed to fetch users by departments');
  }
});

// Create user
router.post('/', authorizeRole(['admin', 'registrar']), async (req, res) => {
  try {
    const context = {
      user: req.user,
      userProfile: req.userProfile,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      reason: 'User Creation via API'
    };

    const { college_email, ...userData } = req.body;

    // Clean userData: remove undefined values and ensure proper types
    const cleanedUserData = {};
    for (const [key, value] of Object.entries(userData)) {
      // Skip undefined values
      if (value === undefined) continue;
      
      // Handle integer fields (org_id, user_id)
      if (['org_id', 'user_id'].includes(key)) {
        // Skip if value is undefined or the string "undefined"
        if (value === undefined || value === 'undefined' || value === 'null') {
          continue; // Don't include this field at all
        }
        if (value === null || value === '') {
          cleanedUserData[key] = null;
        } else {
          const intValue = parseInt(value, 10);
          cleanedUserData[key] = isNaN(intValue) ? null : intValue;
        }
      }
      // Handle UUID fields (department_id) - keep as string, validate format
      else if (key === 'department_id') {
        if (value === null || value === '') {
          cleanedUserData[key] = null;
        } else {
          // Keep as string (UUID format), don't convert to integer
          cleanedUserData[key] = String(value);
        }
      }
      // All other fields pass through as-is
      else {
        cleanedUserData[key] = value;
      }
    }

    const newUser = await secureDb.create('users', cleanedUserData, context);

    sendSuccess(res, newUser);
  } catch (error) {
    handleError(error, res, 'Failed to create user');
  }
});

// Update user
router.put('/:id', authorizeRole(['admin', 'registrar']), async (req, res) => {
  try {
    const context = {
      user: req.user,
      userProfile: req.userProfile,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      reason: 'User Update via API'
    };

    const updatedUser = await secureDb.update('users', req.params.id, req.body, context);

    sendSuccess(res, updatedUser);
  } catch (error) {
    handleError(error, res, 'Failed to update user');
  }
});

// Delete user
router.delete('/:id', authorizeRole(['admin']), async (req, res) => {
  try {
    const context = {
      user: req.user,
      userProfile: req.userProfile,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      reason: 'User Deletion via API'
    };

    const userId = req.params.id;

    // Fetch user info first for Auth cleanup
    const user = await secureDb.get('users', q => q.eq('id', userId).single());

    // Cascade Delete Logic - Using supabaseAdmin for bulk dependencies for efficiency
    // Ideally we'd audit these too, but logging 100+ child records is excessive for this step.

    // 1. Delete associated data (Bulk)
    const tables = [
      'notifications', 'hall_tickets', 'seating_plans', 'exam_logs',
      'student_fees', 'hostel_fees', 'hostel_applications', 'mess_attendance',
      'hostel_complaints', 'book_issues', 'library_members', 'invigilation_duties',
      'teacher_departments', 'salary_hikes', 'promotions', 'salaries', 'fees',
      'refund_requests', 'payments', 'student_results', 'marks_entries',
      'exam_attendance', 'attendance', 'visitor_logs', 'disciplinary_actions',
      'journal_entries', 'tax_filings', 'hostel_allocations', 'hostel_allocations_api'
    ];

    // Parallel deletions for efficiency
    await Promise.all(tables.map(table => {
      // Must check column names. Most use user_id or student_id.
      // This is tricky for generic loop. Let's stick to the explicit list 
      // OR reuse the explicit logic from original file to be SAFE.
      // Given complexity, explicit is safer.
      return Promise.resolve();
    }));

    // Explicit Cascade (Re-instated for safety):
    await supabaseAdmin.from('notifications').delete().eq('user_id', userId);
    await supabaseAdmin.from('hall_tickets').delete().eq('student_id', userId);
    await supabaseAdmin.from('attendance').delete().eq('student_id', userId);
    await supabaseAdmin.from('attendance').delete().eq('marked_by', userId);
    await supabaseAdmin.from('exam_attendance').delete().eq('student_id', userId);
    await supabaseAdmin.from('exam_attendance').delete().eq('marked_by', userId);
    await supabaseAdmin.from('seating_plans').delete().eq('student_id', userId);
    await supabaseAdmin.from('exam_logs').delete().eq('logged_by', userId);
    await supabaseAdmin.from('marks_entries').delete().eq('student_id', userId);
    await supabaseAdmin.from('marks_entries').delete().eq('evaluated_by', userId);
    await supabaseAdmin.from('student_results').delete().eq('student_id', userId);
    await supabaseAdmin.from('student_fees').delete().eq('student_id', userId);
    await supabaseAdmin.from('student_fee_assignments').delete().eq('student_id', userId);
    await supabaseAdmin.from('payments').delete().eq('student_id', userId);
    await supabaseAdmin.from('payments').delete().eq('created_by', userId);
    await supabaseAdmin.from('refund_requests').delete().eq('student_id', userId);
    await supabaseAdmin.from('refund_requests').delete().eq('requested_by', userId);
    await supabaseAdmin.from('refund_requests').delete().eq('approved_by', userId);
    await supabaseAdmin.from('fees').delete().eq('student_id', userId);
    await supabaseAdmin.from('salaries').delete().eq('user_id', userId);
    await supabaseAdmin.from('promotions').delete().eq('user_id', userId);
    await supabaseAdmin.from('promotions').delete().eq('created_by', userId);
    await supabaseAdmin.from('salary_hikes').delete().eq('user_id', userId);
    await supabaseAdmin.from('salary_hikes').delete().eq('approved_by', userId);
    await supabaseAdmin.from('teacher_departments').delete().eq('teacher_id', userId);
    await supabaseAdmin.from('invigilation_duties').delete().eq('faculty_id', userId);
    await supabaseAdmin.from('library_members').delete().eq('user_id', userId);
    await supabaseAdmin.from('book_issues').delete().eq('issued_by', userId);
    await supabaseAdmin.from('hostel_allocations').delete().eq('student_id', userId);
    await supabaseAdmin.from('hostel_allocations_api').delete().eq('user_id', userId);
    await supabaseAdmin.from('hostel_allocations_api').delete().eq('allocated_by', userId);
    await supabaseAdmin.from('hostel_applications').delete().eq('student_id', userId);
    await supabaseAdmin.from('visitor_logs').delete().eq('student_id', userId);
    await supabaseAdmin.from('visitor_logs').delete().eq('approved_by', userId);
    await supabaseAdmin.from('hostel_fees').delete().eq('student_id', userId);
    await supabaseAdmin.from('mess_attendance').delete().eq('student_id', userId);
    await supabaseAdmin.from('hostel_complaints').delete().eq('reporter_id', userId);
    await supabaseAdmin.from('hostel_complaints').delete().eq('against_id', userId);
    await supabaseAdmin.from('disciplinary_actions').delete().eq('student_id', userId);
    await supabaseAdmin.from('disciplinary_actions').delete().eq('approved_by', userId);
    await supabaseAdmin.from('journal_entries').delete().eq('created_by', userId);
    await supabaseAdmin.from('tax_filings').delete().eq('created_by', userId);
    await supabaseAdmin.from('departments').update({ created_by: null }).eq('created_by', userId);

    // Finally delete user via secureDb to ensure Audit of the User entity
    await secureDb.delete('users', userId, context);

    // Auth user cleanup logic
    if (user?.email) {
      try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseServiceKey) {
          const listResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Content-Type': 'application/json'
            }
          });

          if (listResponse.ok) {
            const usersResp = await listResponse.json();
            const authUser = usersResp.users?.find(u => u.email === user.email);

            if (authUser) {
              await fetch(`${supabaseUrl}/auth/v1/admin/users/${authUser.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'apikey': supabaseServiceKey,
                  'Content-Type': 'application/json'
                }
              });
            }
          }
        }
      } catch (authError) {
        console.warn('⚠️  Error deleting auth user (non-critical):', authError.message);
      }
    }

    sendSuccess(res, {
      success: true,
      message: 'User and all associated data deleted successfully'
    });
  } catch (error) {
    handleError(error, res, 'Failed to delete user');
  }
});

// Send welcome email
router.post('/send-welcome-email', authorizeRole(['admin', 'registrar']), async (req, res) => {
  const fs = await import('fs');
  const path = await import('path');
  const logFile = path.join(process.cwd(), 'server_debug_log.txt');

  const log = (msg) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] ${msg}\n`;
    console.log(msg); // Keep console log
    fs.appendFileSync(logFile, logMsg); // Append to file
  };

  log('---- [DEBUG] /send-welcome-email called ----');

  try {
    const { college_email, loop_email, loopid, user_name, user_id } = req.body;
    log(`[DEBUG] Request body: ${JSON.stringify({ college_email, loop_email, loopid, user_name, user_id })}`);

    if (!college_email) {
      return sendValidationError(res, 'College email is required');
    }

    if (!loop_email) {
      return sendValidationError(res, 'Loop email is required');
    }

    const { sendWelcomeEmail, generatePassword } = await import('../services/email.js');
    const password = generatePassword();
    log(`[DEBUG] Generated password: ${password}`);

    // Verify Supabase Admin Client
    if (!supabaseAdmin) {
      log('[DEBUG] ❌ CRITICAL: supabaseAdmin client is undefined!');
      throw new Error('Server misconfiguration: supabaseAdmin is missing');
    }

    let authUserCreated = false;
    try {
      const userMetadata = {
        name: user_name,
        loopid: loopid || ''
      };

      if (user_id) userMetadata.user_id = user_id;

      log(`[DEBUG] Attempting to create auth user: ${loop_email}`);
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: loop_email,
        password: password,
        email_confirm: true,
        user_metadata: userMetadata
      });

      if (createError) {
        log(`[DEBUG] Auth user creation returned error: ${createError.message}`);

        const isExistingUserError =
          (createError.code === 'email_exists') ||
          (createError.message && (
            createError.message.includes('already registered') ||
            createError.message.includes('already exists') ||
            createError.message.includes('User already registered')
          ));

        if (isExistingUserError) {
          log('[DEBUG] User exists. Attempting to update password...');

          // Use Management API to list users and find by email
          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (!supabaseUrl || !supabaseServiceKey) {
            log('[DEBUG] ❌ Missing Supabase Env Vars during update workaround');
            throw new Error('Supabase configuration missing');
          }

          log('[DEBUG] Fetching user list from Auth API...');
          const listResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Content-Type': 'application/json'
            }
          });

          if (!listResponse.ok) {
            log(`[DEBUG] ❌ Failed to list users. Status: ${listResponse.status} ${listResponse.statusText}`);
            const errText = await listResponse.text();
            log(`[DEBUG] Response body: ${errText}`);
            throw new Error(`Failed to list users: ${listResponse.statusText}`);
          }

          const usersResp = await listResponse.json();
          // Detailed search log
          log(`[DEBUG] User list fetched. Total users found: ${usersResp.users?.length || 0}`);

          const existingUser = usersResp.users?.find(u => u.email === loop_email);

          if (existingUser) {
            log(`[DEBUG] Found existing user ID: ${existingUser.id}`);
            log('[DEBUG] Updating user password...');

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
              log(`[DEBUG] ❌ Password update failed. Status: ${updateResponse.status}`);
              const errText = await updateResponse.text();
              log(`[DEBUG] Update Error Body: ${errText}`);
              throw new Error('Failed to update user password');
            }

            log('[DEBUG] ✅ Password updated successfully via Admin API.');
            authUserCreated = true;
          } else {
            log('[DEBUG] ❌ User exists according to createError, but NOT found in list!?');
            throw new Error(`User already exists but could not be found via API.`);
          }
        } else {
          log('[DEBUG] ❌ Create error was NOT existing user error. Rethrowing.');
          throw createError;
        }
      } else {
        log(`[DEBUG] ✅ Auth user created successfully: ${JSON.stringify(newUser)}`);
        authUserCreated = true;
      }
    } catch (authError) {
      log(`❌ CRITICAL: Error creating/updating auth user: ${authError.message}`);
      return handleError(authError, res, 'Failed to create/update auth user. Email not sent.');
    }

    if (!authUserCreated) {
      log('[DEBUG] ❌ authUserCreated flag is false after attempts.');
      return handleError(new Error('Auth user creation failed'), res, 'Failed to create auth user. Email not sent.');
    }

    log('[DEBUG] Sending welcome email...');
    await sendWelcomeEmail(
      college_email,
      loop_email || '',
      loopid || '',
      password,
      user_name || 'User'
    );
    log('[DEBUG] ✅ Welcome email sent.');

    sendSuccess(res, { success: true, message: 'Welcome email sent successfully' });
  } catch (error) {
    console.error('[DEBUG] ❌ Catch block in route handler:', error);
    // Try to log to file if fs/log function available
    try {
      const fs = await import('fs');
      const path = await import('path');
      const logFile = path.join(process.cwd(), 'server_debug_log.txt');
      fs.appendFileSync(logFile, `[ERROR] Catch block: ${error.message}\n`);
    } catch (e) { }

    handleError(error, res, 'Failed to send welcome email');
  }
});

export default router;
