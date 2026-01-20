import express from 'express';
import { supabaseAdmin } from '../common.js';
import { handleError, sendSuccess, sendValidationError } from '../common.js';
import { feeService } from '../services/feeService.js';

const router = express.Router();
console.log('📝 Exam router loaded');

// Get exam dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    // Get all exams
    const { data: exams, error: examsError } = await supabaseAdmin
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });

    if (examsError) {
      throw examsError;
    }

    // Get exam timetable
    const { data: timetable, error: timetableError } = await supabaseAdmin
      .from('exam_timetable')
      .select('*')
      .order('exam_date', { ascending: true });

    if (timetableError) {
      throw timetableError;
    }

    // Get hall tickets count
    const { data: hallTickets, error: ticketsError } = await supabaseAdmin
      .from('hall_tickets')
      .select('id, status');

    if (ticketsError) {
      throw ticketsError;
    }

    // Get seating plans count
    const { data: seatingPlans, error: seatingError } = await supabaseAdmin
      .from('seating_plans')
      .select('id');

    if (seatingError) {
      throw seatingError;
    }

    // Get exam attendance
    const { data: examAttendance, error: attendanceError } = await supabaseAdmin
      .from('exam_attendance')
      .select('id, status');

    if (attendanceError) {
      throw attendanceError;
    }

    // Calculate stats
    const totalExams = exams?.length || 0;
    const activeExams = exams?.filter(e => e.status === 'PLANNED' || e.status === 'ONGOING') || [];
    const upcomingExams = exams?.filter(e => {
      if (!e.start_date) return false;
      const startDate = new Date(e.start_date);
      return startDate >= new Date();
    }) || [];

    const totalHallTickets = hallTickets?.length || 0;
    const generatedTickets = hallTickets?.filter(t => t.status === 'GENERATED').length || 0;
    const totalSeatingPlans = seatingPlans?.length || 0;
    const totalExamAttendance = examAttendance?.length || 0;
    const presentCount = examAttendance?.filter(a => a.status === 'PRESENT').length || 0;

    const stats = {
      total_exams: totalExams,
      active_exams: activeExams,
      upcoming_exams: upcomingExams.length,
      pending_results: 0, // Placeholder for now
      total_hall_tickets: totalHallTickets,
      generated_tickets: generatedTickets,
      total_seating_plans: totalSeatingPlans,
      total_exam_attendance: totalExamAttendance,
      present_count: presentCount,
      attendance_rate: totalExamAttendance > 0 ? Math.round((presentCount / totalExamAttendance) * 100) : 0
    };

    sendSuccess(res, {
      stats,
      exams: exams || [],
      timetable: timetable || [],
      recentExams: exams?.slice(0, 5) || []
    });
  } catch (error) {
    handleError(error, res, 'Failed to fetch exam dashboard data');
  }
});

// Create exam
router.post('/create', async (req, res) => {
  try {
    const { name, start_date, end_date, departments, programs, semesters, status } = req.body;

    if (!name || !start_date || !end_date) {
      return sendValidationError(res, 'Name, start date, and end date are required');
    }

    const { data, error } = await supabaseAdmin
      .from('exams')
      .insert({
        name,
        start_date,
        end_date,
        programs,
        semesters,
        status: status || 'PLANNED'
      })
      .select()
      .single();

    if (error) throw error;

    // Note: We don't have a direct mapping for 'departments' in the 'exams' table 
    // based on our previous schema check (it has programs/semesters), 
    // but the frontend sends it. We might need a junction table if multi-department,
    // or we assume it's part of the program/semester filtering.
    // For now, we inserted the primary fields.

    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to create exam');
  }
});

// Get all exams
router.get('/list', async (req, res) => {
  try {
    const { status, academic_calendar_id } = req.query;

    let query = supabaseAdmin
      .from('exams')
      .select('*');

    if (status) {
      query = query.eq('status', status);
    }
    if (academic_calendar_id) {
      query = query.eq('academic_calendar_id', academic_calendar_id);
    }

    const { data, error } = await query.order('start_date', { ascending: false });

    if (error) {
      throw error;
    }

    sendSuccess(res, data || []);
  } catch (error) {
    handleError(error, res, 'Failed to fetch exams');
  }
});

// Register student for exam
router.post('/register', async (req, res) => {
  try {
    const { student_id, exam_id } = req.body;

    if (!student_id || !exam_id) {
      return sendValidationError(res, 'student_id and exam_id are required');
    }

    // Check if exam exists
    const { data: exam, error: examError } = await supabaseAdmin
      .from('exams')
      .select('*')
      .eq('id', exam_id)
      .single();

    if (examError || !exam) {
      return res.status(404).json({ data: null, error: 'Exam not found' });
    }

    // Check if already registered (in exam_attendance)
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('exam_attendance')
      .select('id')
      .eq('student_id', student_id)
      .eq('exam_id', exam_id)
      .single();

    if (existing) {
      return res.status(400).json({ data: null, error: 'Student already registered for this exam' });
    }

    // Create registration (attendance record)
    const { data, error } = await supabaseAdmin
      .from('exam_attendance')
      .insert({
        student_id,
        exam_id,
        status: 'REGISTERED', // Initial status
        date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // AUTO-EXAM FEE ASSIGNMENT
    try {
      const context = {
        user: { id: 'system' },
        reason: 'Exam Registration'
      };
      await feeService.assignExamFee(student_id, exam_id, context);
    } catch (feeError) {
      console.error('Failed to assign exam fee:', feeError);
    }

    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to register for exam');
  }
});

export default router;
