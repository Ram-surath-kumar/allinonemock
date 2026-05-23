import express from 'express';
import { supabaseAdmin } from '../common.js';
import { handleError, sendSuccess, sendValidationError } from '../common.js';
import { feeService } from '../services/feeService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
console.log('📝 Exam router loaded');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/pyqps.json');

// Helper to read data
const readPYQPData = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const dir = path.dirname(DATA_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(DATA_FILE, '[]');
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading pyqps:', error);
        return [];
    }
};

// Helper to write data
const writePYQPData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing pyqps:', error);
        return false;
    }
};

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

// Bulk register/assign students to exam
router.post('/assign-bulk', async (req, res) => {
  try {
    const { exam_id, student_ids, skip_fee } = req.body;

    if (!exam_id || !student_ids || !Array.isArray(student_ids)) {
      return sendValidationError(res, 'exam_id and student_ids (array) are required');
    }

    const { data: exam, error: examError } = await supabaseAdmin
      .from('exams')
      .select('*')
      .eq('id', exam_id)
      .single();

    if (examError || !exam) {
      return res.status(404).json({ data: null, error: 'Exam not found' });
    }

    const results = [];
    const errors = [];

    for (const student_id of student_ids) {
      try {
        // Check if already registered
        const { data: existing } = await supabaseAdmin
          .from('exam_attendance')
          .select('id')
          .eq('student_id', student_id)
          .eq('exam_id', exam_id)
          .single();

        if (existing) {
          results.push({ student_id, status: 'ALREADY_REGISTERED' });
          continue;
        }

        // Create registration
        const { data, error } = await supabaseAdmin
          .from('exam_attendance')
          .insert({
            student_id,
            exam_id,
            status: 'REGISTERED',
            date: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (error) throw error;

        // Conditionally assign fees
        if (!skip_fee) {
          try {
            const context = {
              user: { id: 'system' },
              reason: 'Bulk Exam Registration'
            };
            await feeService.assignExamFee(student_id, exam_id, context);
          } catch (feeError) {
            console.error(`Failed to assign exam fee for ${student_id}:`, feeError);
          }
        }

        results.push({ student_id, status: 'SUCCESS', data });
      } catch (err) {
        errors.push({ student_id, error: err.message });
      }
    }

    sendSuccess(res, { results, errors });
  } catch (error) {
    handleError(error, res, 'Failed to bulk assign exam');
  }
});

// Register student for exam
router.post('/register', async (req, res) => {
  try {
    const { student_id, exam_id, skip_fee } = req.body;

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
    if (!skip_fee) {
      try {
        const context = {
          user: { id: 'system' },
          reason: 'Exam Registration'
        };
        await feeService.assignExamFee(student_id, exam_id, context);
      } catch (feeError) {
        console.error('Failed to assign exam fee:', feeError);
      }
    }

    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to register for exam');
  }
});


// ==========================================
// SEATING PLAN & HALL TICKET ENDPOINTS
// ==========================================

// ==========================================
// SEATING PLAN & HALL TICKET ENDPOINTS
// ==========================================

// Generate seating plan
router.post('/seating/generate', async (req, res) => {
  try {
    const { exam_id, center_id, room_capacity, rooms } = req.body;

    if (!exam_id) {
      return sendValidationError(res, 'Exam ID is required');
    }

    // Default rooms if not provided (simple allocation)
    // If rooms array is provided [{room: "101", capacity: 30}, ...] used that.
    // Otherwise use generic room "Hall A" etc.

    // 1. Get registered students
    const { data: registrations, error: regError } = await supabaseAdmin
      .from('exam_attendance')
      .select('student_id')
      .eq('exam_id', exam_id)
      .eq('status', 'REGISTERED');

    if (regError) throw regError;

    if (!registrations || registrations.length === 0) {
      return res.status(400).json({ error: 'No registered students found for this exam' });
    }

    // 2. Clear existing seating for this exam (optional: or upsert?)
    // Let's clear to regenerate
    await supabaseAdmin
      .from('seating_plans')
      .delete()
      .eq('exam_id', exam_id);

    // 3. Allocate seats
    const seatings = [];
    const capacityPerRoom = room_capacity || 30;

    // Simple allocation logic: Fill rooms sequentially
    // In a real app, 'rooms' param would dictate available rooms

    let currentRoomIndex = 0;
    let currentSeat = 1;
    let roomsUsed = new Set();

    // Use user provided rooms or defaults
    const availableRooms = rooms && rooms.length > 0
      ? rooms
      : Array.from({ length: Math.ceil(registrations.length / capacityPerRoom) }, (_, i) => ({
        name: `Room ${i + 1}`,
        capacity: capacityPerRoom
      }));

    let studentIndex = 0;

    for (const room of availableRooms) {
      const roomName = room.name || room.room_number || `Room ${currentRoomIndex + 1}`;
      const cap = room.capacity || capacityPerRoom;

      for (let s = 1; s <= cap; s++) {
        if (studentIndex >= registrations.length) break;

        const student = registrations[studentIndex];

        seatings.push({
          exam_id,
          student_id: student.student_id,
          center_id: center_id || 'Main Center', // Default center
          room_number: roomName,
          seat_number: `S-${s}`, // e.g. S-1, S-2
          created_at: new Date().toISOString()
        });

        roomsUsed.add(roomName);
        studentIndex++;
      }
      currentRoomIndex++;
    }

    // 4. Save to DB
    if (seatings.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('seating_plans')
        .insert(seatings);

      if (insertError) throw insertError;
    }

    sendSuccess(res, {
      message: 'Seating plan generated successfully',
      allocated_seats: seatings.length,
      rooms_used: roomsUsed.size
    });
  } catch (error) {
    handleError(error, res, 'Failed to generate seating plan');
  }
});

// Get seating plan
router.get('/seating/:examId', async (req, res) => {
  try {
    const { examId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('seating_plans')
      .select('*')
      .eq('exam_id', examId)
      .order('room_number', { ascending: true })
      .order('seat_number', { ascending: true });

    if (error) throw error;

    sendSuccess(res, {
      exam_id: examId,
      plans: data || []
    });
  } catch (error) {
    handleError(error, res, 'Failed to fetch seating plan');
  }
});

// Generate hall tickets
router.post('/hall-tickets/generate/:examId', async (req, res) => {
  try {
    const { examId } = req.params;

    // 1. Get registered students
    const { data: registrations, error: regError } = await supabaseAdmin
      .from('exam_attendance')
      .select('student_id')
      .eq('exam_id', examId)
      .eq('status', 'REGISTERED'); // Or ALL present

    if (regError) throw regError;

    if (!registrations || registrations.length === 0) {
      return res.status(400).json({ error: 'No students found to generate tickets for' });
    }

    // 2. Clear existing (or upsert)
    // We'll use upsert to avoid duplicate key errors, keeping existing status if any

    const tickets = registrations.map(reg => ({
      exam_id: examId,
      student_id: reg.student_id,
      status: 'GENERATED',
      generated_at: new Date().toISOString()
      // file_url: null 
    }));

    const { data, error } = await supabaseAdmin
      .from('hall_tickets')
      .upsert(tickets, { onConflict: 'exam_id,student_id' })
      .select();

    if (error) throw error;

    sendSuccess(res, {
      message: 'Hall tickets generated',
      count: data.length
    });
  } catch (error) {
    handleError(error, res, 'Failed to generate hall tickets');
  }
});

// Get hall tickets
router.get('/hall-tickets/:examId', async (req, res) => {
  try {
    const { examId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('hall_tickets')
      .select('*')
      .eq('exam_id', examId);

    if (error) throw error;

    sendSuccess(res, data || []);
  } catch (error) {
    handleError(error, res, 'Failed to fetch hall tickets');
  }
});

// Get timetable
router.get('/timetable/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('exam_timetable')
      .select('*')
      .eq('exam_id', examId);

    if (error) throw error;
    sendSuccess(res, data || []);
  } catch (error) {
    handleError(error, res, 'Failed to fetch timetable');
  }
});

// Create timetable entry
router.post('/timetable', async (req, res) => {
  try {
    const { exam_id, subject_id, exam_date, start_time, end_time, room_no } = req.body;

    // Calculate duration in minutes
    let duration_minutes = 60; // Default
    if (start_time && end_time) {
      const [startH, startM] = start_time.split(':').map(Number);
      const [endH, endM] = end_time.split(':').map(Number);
      const calculated = (endH * 60 + endM) - (startH * 60 + startM);
      if (calculated > 0) duration_minutes = calculated;
    }

    const { data, error } = await supabaseAdmin
      .from('exam_timetable')
      .insert({
        exam_id,
        subject_id,
        course_id: subject_id, // Satisfy NOT NULL constraint using subject_id
        exam_date,
        start_time,
        end_time,
        duration_minutes,
        room_no
      })
      .select()
      .single();

    if (error) throw error;
    sendSuccess(res, data);
  } catch (error) {
    handleError(error, res, 'Failed to create timetable entry');
  }
});

// Get evaluation data (students + marks) for an exam
router.get('/evaluation/:examId', async (req, res) => {
  try {
    const { examId } = req.params;

    // 1. Get all registered students for this exam
    const { data: attendance, error: attError } = await supabaseAdmin
      .from('exam_attendance')
      .select('student_id')
      .eq('exam_id', examId)
      .in('status', ['REGISTERED', 'PRESENT']);

    if (attError) throw attError;

    if (!attendance || attendance.length === 0) {
      return sendSuccess(res, []);
    }

    const studentIds = attendance.map(a => a.student_id);

    // 2. Get student details
    const { data: students, error: studentError } = await supabaseAdmin
      .from('users')
      .select('id, name') // removed loopid, section which likely don't exist
      .in('id', studentIds);

    if (studentError) throw studentError;

    // 3. Get existing marks
    const { data: marks, error: marksError } = await supabaseAdmin
      .from('exam_marks')
      .select('student_id, score, remarks')
      .eq('exam_id', examId);

    if (marksError) throw marksError;

    // 4. Merge data
    const result = students.map(student => {
      const markEntry = marks?.find(m => m.student_id === student.id);
      return {
        id: student.id,
        name: student.name,
        loopid: student.loopid,
        section: student.section,
        score: markEntry ? markEntry.score : '', // Empty string for UI input
        remarks: markEntry ? markEntry.remarks : ''
      };
    });

    sendSuccess(res, result);
  } catch (error) {
    handleError(error, res, 'Failed to fetch evaluation data');
  }
});

// Submit marks
router.post('/marks/submit', async (req, res) => {
  try {
    const { exam_id, marks } = req.body;

    if (!exam_id || !marks || !Array.isArray(marks)) {
      return sendValidationError(res, 'Invalid data format');
    }

    // Prepare upsert data
    const upsertData = marks.map(({ student_id, score, remarks }) => ({
      exam_id,
      student_id,
      score,
      remarks: remarks || null,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabaseAdmin
      .from('exam_marks')
      .upsert(upsertData, { onConflict: 'exam_id,student_id' })
      .select();

    if (error) throw error;

    sendSuccess(res, { message: 'Marks submitted successfully', count: data.length });
  } catch (error) {
    handleError(error, res, 'Failed to submit marks');
  }
});

// Get student marks
router.get('/marks/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    // Fetch marks with Exam details
    const { data, error } = await supabaseAdmin
      .from('exam_marks')
      .select(`
        score,
        remarks,
        exam_id,
        updated_at,
        exams:exam_id (
          id,
          name,
          start_date,
          status
        )
      `)
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    sendSuccess(res, data || []);
  } catch (error) {
    handleError(error, res, 'Failed to fetch student marks');
  }
});

// ==========================================
// PYQP (PREVIOUS YEAR QUESTION PAPERS) ENDPOINTS
// ==========================================

// Get list of uploaded PYQPs
router.get('/pyqp/list', async (req, res) => {
  try {
    const data = readPYQPData();
    sendSuccess(res, data || []);
  } catch (error) {
    handleError(error, res, 'Failed to fetch PYQPs');
  }
});

// Upload new PYQP
router.post('/pyqp/upload', async (req, res) => {
  try {
    const { title, examCode, year, questionsCount, duration, category, difficulty, questions, pdf_url } = req.body;

    if (!title || !examCode || !questions || !Array.isArray(questions)) {
      return sendValidationError(res, 'Title, exam code, and questions array are required');
    }

    const newPYQP = {
      id: `pyqp-${Date.now()}`,
      title,
      name: title, // for compatibility
      examCode,
      year: year || new Date().getFullYear(),
      questionsCount: questionsCount || questions.length,
      duration: duration || 120,
      category: category || 'General',
      difficulty: difficulty || 'Medium',
      questions,
      pdf_url: pdf_url || '',
      created_at: new Date().toISOString()
    };

    const pyqps = readPYQPData();
    pyqps.push(newPYQP);
    writePYQPData(pyqps);

    // Also attempt Supabase insert in mock_tests as fallback/sync
    try {
      const dbRecord = {
        id: newPYQP.id,
        title: newPYQP.title,
        exam_type: newPYQP.category,
        price: 0.00,
        is_free_pyqp: true,
        pdf_source_url: newPYQP.pdf_url || 'https://schoolsphere-assets.s3.amazonaws.com/mocks/default.pdf',
        configuration: {
          totalDurationMinutes: newPYQP.duration,
          markingScheme: { correct: 4.0, incorrect: -1.0 },
          sections: [
            {
              sectionName: "General Aptitude",
              allowedTimeMinutes: newPYQP.duration,
              questionRange: { start: 1, end: newPYQP.questions.length }
            }
          ]
        },
        answer_key: newPYQP.questions.map((q, idx) => ({
          questionNumber: idx + 1,
          correctOption: q.correct || 'A',
          cognitiveTag: q.concept || 'General Concept'
        }))
      };
      await supabaseAdmin.from('mock_tests').insert([dbRecord]);
    } catch (dbErr) {
      console.warn('Supabase mock_tests sync bypassed/failed:', dbErr.message);
    }

    sendSuccess(res, newPYQP);
  } catch (error) {
    handleError(error, res, 'Failed to upload PYQP');
  }
});

// Delete a PYQP
router.delete('/pyqp/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pyqps = readPYQPData();
    const filtered = pyqps.filter(p => p.id !== id);

    if (pyqps.length === filtered.length) {
      return res.status(404).json({ data: null, error: 'PYQP not found' });
    }

    writePYQPData(filtered);

    // Also attempt Supabase delete as fallback/sync
    try {
      await supabaseAdmin.from('mock_tests').delete().eq('id', id);
    } catch (dbErr) {
      console.warn('Supabase mock_tests delete sync bypassed/failed:', dbErr.message);
    }

    sendSuccess(res, { success: true });
  } catch (error) {
    handleError(error, res, 'Failed to delete PYQP');
  }
});

export default router;

