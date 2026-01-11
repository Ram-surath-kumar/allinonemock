import express from 'express';
import { supabaseAdmin } from '../common.js';
import { handleError, sendSuccess } from '../common.js';

const router = express.Router();

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
    const upcomingExams = exams?.filter(e => {
      if (!e.start_date) return false;
      const startDate = new Date(e.start_date);
      return startDate >= new Date();
    }).length || 0;
    const totalHallTickets = hallTickets?.length || 0;
    const generatedTickets = hallTickets?.filter(t => t.status === 'GENERATED').length || 0;
    const totalSeatingPlans = seatingPlans?.length || 0;
    const totalExamAttendance = examAttendance?.length || 0;
    const presentCount = examAttendance?.filter(a => a.status === 'PRESENT').length || 0;
    
    const stats = {
      totalExams,
      upcomingExams,
      totalHallTickets,
      generatedTickets,
      totalSeatingPlans,
      totalExamAttendance,
      presentCount,
      attendanceRate: totalExamAttendance > 0 ? Math.round((presentCount / totalExamAttendance) * 100) : 0
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

export default router;
