import express from 'express';
import { supabase, supabaseAdmin } from '../common.js';
import { handleError, sendSuccess, sendValidationError } from '../common.js';

const router = express.Router();

// Get all attendance page data in a single API call
// Combines: students, departments, attendance records, teacher departments, user info
router.get('/page-data', async (req, res) => {
  try {
    const { userId, role, date } = req.query;

    const students = [];
    const departments = [];
    const attendanceRecords = [];
    const teacherDepartmentIds = [];
    let userInfo = {};

    // Get user info
    if (userId) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!userError && userData) {
        userInfo = userData;
      }
    }

    // Get departments
    const { data: deptsData, error: deptsError } = await supabaseAdmin
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (!deptsError && deptsData) {
      departments.push(...deptsData);
    }

    // Get teacher departments if teacher
    if (role === 'teacher' && userId) {
      const { data: teacherDeptsData, error: teacherDeptsError } = await supabaseAdmin
        .from('teacher_departments')
        .select('department_id')
        .eq('teacher_id', userId);

      if (!teacherDeptsError && teacherDeptsData) {
        teacherDepartmentIds.push(...teacherDeptsData.map(td => td.department_id));
      }
    }

    // Get students based on role
    if (role === 'teacher' && teacherDepartmentIds.length > 0) {
      // Get students for teacher's departments
      const { data: studentsData, error: studentsError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('role', 'student')
        .eq('status', 'active')
        .in('department_id', teacherDepartmentIds);

      if (!studentsError && studentsData) {
        students.push(...studentsData);
      }
    } else {
      // For admin/vice_head, get all active students
      const { data: studentsData, error: studentsError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('role', 'student')
        .eq('status', 'active');

      if (!studentsError && studentsData) {
        students.push(...studentsData);
      }
    }

    // Get attendance records for date
    if (date) {
      const { data: attendanceData, error: attendanceError } = await supabaseAdmin
        .from('attendance')
        .select('*')
        .eq('date', date);

      if (!attendanceError && attendanceData) {
        attendanceRecords.push(...attendanceData);
      }
    }

    const pageData = {
      students,
      departments,
      attendanceRecords,
      teacherDepartmentIds,
      userInfo
    };

    sendSuccess(res, pageData);
  } catch (error) {
    handleError(error, res, 'Failed to fetch attendance page data');
  }
});

// Get attendance records
router.get('/', async (req, res) => {
  try {
    const { date, student_id, student_ids, start_date, end_date } = req.query;
    let query = supabase.from('attendance').select('*');

    if (date) query = query.eq('date', date);
    if (student_id) query = query.eq('student_id', student_id);
    if (student_ids) {
      const idArray = Array.isArray(student_ids) ? student_ids : student_ids.split(',');
      query = query.in('student_id', idArray);
    }
    if (start_date) query = query.gte('date', start_date);
    if (end_date) query = query.lte('date', end_date);

    const { data, error } = await query.order('date', { ascending: true });
    if (error) throw error;
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to fetch attendance records');
  }
});

// Create/update attendance records
router.post('/', async (req, res) => {
  try {
    const records = Array.isArray(req.body) ? req.body : [req.body];
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .upsert(records, { onConflict: 'student_id,date' })
      .select();

    if (error) throw error;
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to save attendance records');
  }
});

// Mark attendance with validation (consolidated endpoint)
router.post('/mark', async (req, res) => {
  try {
    const { records } = req.body;

    // Validate records array
    if (!records || !Array.isArray(records) || records.length === 0) {
      return sendValidationError(res, 'Records are required');
    }

    // Validate each record
    const validStatuses = ['present', 'absent', 'late', 'excused'];
    for (const record of records) {
      if (!record.student_id) {
        return sendValidationError(res, 'student_id is required for each record');
      }
      if (!record.date) {
        return sendValidationError(res, 'date is required for each record');
      }
      if (!record.status) {
        return sendValidationError(res, 'status is required for each record');
      }
      if (!validStatuses.includes(record.status)) {
        return sendValidationError(res, `Invalid status: ${record.status}. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Upsert attendance records using admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .upsert(records, { onConflict: 'student_id,date' })
      .select();

    if (error) {
      console.error('Attendance mark error:', error);
      throw error;
    }

    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to mark attendance');
  }
});

export default router;

