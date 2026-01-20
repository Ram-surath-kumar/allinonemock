import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import route modules
import usersRouter from './routes/users.js';
import organizationsRouter from './routes/organizations.js';
import departmentsRouter from './routes/departments.js';
import teacherDepartmentsRouter from './routes/teacherDepartments.js';
import attendanceRouter from './routes/attendance.js';
import notificationsRouter from './routes/notifications.js';
import dashboardRouter from './routes/dashboard.js';
import rolesRouter from './routes/roles.js';
import activitiesRouter from './routes/activities.js';
import libraryRouter from './routes/library.js';
import hostelRouter from './routes/hostel.js';
import examRouter from './routes/exam.js';
import academicRouter from './routes/academic.js';
import misRouter from './routes/mis.js';
import financeRouter from './routes/finance.js';

import profilesRouter from './routes/SIM/profiles.js';
import admissionsRouter from './routes/SIM/admissions.js';
import simAcademicRouter from './routes/SIM/academic.js';
import communicationsRouter from './routes/SIM/communications.js';
import schedulesRouter from './routes/schedules.js';
import tasksRouter from './routes/tasks.js';
import eventsRouter from './routes/events.js';

// Import growth and finance routes (to be created)
// import growthRouter from './routes/growth.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

import { auditLogger } from './middleware/auditLogger.js';

// Middleware
// CORS configuration - allow localhost and Vercel domains
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:5173',
  'http://localhost:3000',
  // Add your Vercel domain here after deployment
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    // Also allow any localhost origin (for dynamic ports like 5174, 5175, etc.)
    const isLocalhost = origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

    if (!origin || allowedOrigins.includes(origin) || isLocalhost) {
      callback(null, true);
    } else {
      // In production, allow Vercel preview and production domains
      if (process.env.VERCEL || process.env.VERCEL_ENV) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));
app.use(express.json());

// Apply Audit Logger
app.use(auditLogger);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend API is running' });
});

// Register routes
app.use('/api/users', usersRouter);
app.use('/api/organizations', organizationsRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/teacher-departments', teacherDepartmentsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/library', libraryRouter);
app.use('/api/hostel', hostelRouter);
app.use('/api/exam', examRouter);

app.use('/api/academic', academicRouter);
app.use('/api/mis', misRouter);
app.use('/api/finance', financeRouter);

app.use('/api/sim/profiles', profilesRouter);
app.use('/api/sim/admissions', admissionsRouter);
app.use('/api/sim/academic', simAcademicRouter);
app.use('/api/sim/communications', communicationsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/events', eventsRouter);

// TODO: Register these routes once created
// app.use('/api/growth', growthRouter);


// Temporary: Keep growth and finance endpoints in index.js until route files are created
// This will be moved to route files in the next step
import { supabaseAdmin } from './common.js';
import { handleError, sendSuccess, sendValidationError } from './common.js';

// Growth endpoints (temporary - to be moved to routes/growth.js)
app.get('/api/growth', async (req, res) => {
  try {
    const { metric, period = 'month' } = req.query;

    if (!metric) {
      return sendValidationError(res, 'metric parameter is required');
    }

    // Calculate date range based on period
    const today = new Date();
    const currentPeriodStart = new Date(today);
    const previousPeriodStart = new Date(today);

    if (period === 'week') {
      currentPeriodStart.setDate(today.getDate() - 7);
      previousPeriodStart.setDate(today.getDate() - 14);
    } else if (period === 'month') {
      currentPeriodStart.setMonth(today.getMonth() - 1);
      previousPeriodStart.setMonth(today.getMonth() - 2);
    } else if (period === 'quarter') {
      currentPeriodStart.setMonth(today.getMonth() - 3);
      previousPeriodStart.setMonth(today.getMonth() - 6);
    } else if (period === 'year') {
      currentPeriodStart.setFullYear(today.getFullYear() - 1);
      previousPeriodStart.setFullYear(today.getFullYear() - 2);
    }

    let currentValue = 0;
    let previousValue = 0;
    const dataPoints = [];

    if (metric === 'students') {
      const { data: currentStudents, error: currentError } = await supabaseAdmin
        .from('users')
        .select('id, created_at')
        .eq('role', 'student')
        .gte('created_at', currentPeriodStart.toISOString())
        .lte('created_at', today.toISOString());

      const { data: previousStudents, error: previousError } = await supabaseAdmin
        .from('users')
        .select('id, created_at')
        .eq('role', 'student')
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', currentPeriodStart.toISOString());

      currentValue = currentStudents && !currentError ? currentStudents.length : 0;
      previousValue = previousStudents && !previousError ? previousStudents.length : 0;

      const days = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const { data: studentsUpToDate } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('role', 'student')
          .lte('created_at', date.toISOString());

        dataPoints.push({
          date: dateStr,
          value: studentsUpToDate ? studentsUpToDate.length : 0,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
    } else if (metric === 'staff') {
      const { data: currentStaff, error: currentError } = await supabaseAdmin
        .from('users')
        .select('id, created_at')
        .neq('role', 'student')
        .gte('created_at', currentPeriodStart.toISOString())
        .lte('created_at', today.toISOString());

      const { data: previousStaff, error: previousError } = await supabaseAdmin
        .from('users')
        .select('id, created_at')
        .neq('role', 'student')
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', currentPeriodStart.toISOString());

      currentValue = currentStaff && !currentError ? currentStaff.length : 0;
      previousValue = previousStaff && !previousError ? previousStaff.length : 0;

      const days = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const { data: staffUpToDate } = await supabaseAdmin
          .from('users')
          .select('id')
          .neq('role', 'student')
          .lte('created_at', date.toISOString());

        dataPoints.push({
          date: dateStr,
          value: staffUpToDate ? staffUpToDate.length : 0,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
    } else if (metric === 'attendance') {
      const currentPeriodStartStr = currentPeriodStart.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];

      const { data: currentAttendance, error: currentError } = await supabaseAdmin
        .from('attendance')
        .select('*')
        .gte('date', currentPeriodStartStr)
        .lte('date', todayStr);

      const previousPeriodStartStr = previousPeriodStart.toISOString().split('T')[0];
      const previousPeriodEndStr = currentPeriodStart.toISOString().split('T')[0];

      const { data: previousAttendance, error: previousError } = await supabaseAdmin
        .from('attendance')
        .select('*')
        .gte('date', previousPeriodStartStr)
        .lt('date', previousPeriodEndStr);

      if (!currentError && currentAttendance) {
        const total = currentAttendance.length;
        const present = currentAttendance.filter(r => r.status === 'present').length;
        currentValue = total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 0;
      }

      if (!previousError && previousAttendance) {
        const total = previousAttendance.length;
        const present = previousAttendance.filter(r => r.status === 'present').length;
        previousValue = total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 0;
      }

      const days = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const { data: dayAttendance } = await supabaseAdmin
          .from('attendance')
          .select('*')
          .eq('date', dateStr);

        let dayRate = 0;
        if (dayAttendance && dayAttendance.length > 0) {
          const present = dayAttendance.filter(r => r.status === 'present').length;
          dayRate = Math.round((present / dayAttendance.length) * 100 * 10) / 10;
        }

        dataPoints.push({
          date: dateStr,
          value: dayRate,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
    } else if (metric === 'fees') {
      currentValue = 0;
      previousValue = 0;
    }

    const change = currentValue - previousValue;
    const changePercent = previousValue !== 0
      ? Math.round((change / previousValue) * 100 * 10) / 10
      : (currentValue > 0 ? 100 : 0);

    const growthData = {
      currentValue,
      previousValue,
      change,
      changePercent,
      period,
      metric,
      dataPoints
    };

    sendSuccess(res, growthData);
  } catch (error) {
    handleError(error, res, 'Failed to fetch growth data');
  }
});

app.get('/api/growth/staff-by-role', async (req, res) => {
  try {
    const { role, period = 'month' } = req.query;

    if (!role) {
      return sendValidationError(res, 'role parameter is required');
    }

    const today = new Date();
    const currentPeriodStart = new Date(today);
    const previousPeriodStart = new Date(today);

    if (period === 'week') {
      currentPeriodStart.setDate(today.getDate() - 7);
      previousPeriodStart.setDate(today.getDate() - 14);
    } else if (period === 'month') {
      currentPeriodStart.setMonth(today.getMonth() - 1);
      previousPeriodStart.setMonth(today.getMonth() - 2);
    } else if (period === 'quarter') {
      currentPeriodStart.setMonth(today.getMonth() - 3);
      previousPeriodStart.setMonth(today.getMonth() - 6);
    } else if (period === 'year') {
      currentPeriodStart.setFullYear(today.getFullYear() - 1);
      previousPeriodStart.setFullYear(today.getFullYear() - 2);
    }

    const { data: currentStaff, error: currentError } = await supabaseAdmin
      .from('users')
      .select('id, created_at')
      .eq('role', role)
      .gte('created_at', currentPeriodStart.toISOString())
      .lte('created_at', today.toISOString());

    const { data: previousStaff, error: previousError } = await supabaseAdmin
      .from('users')
      .select('id, created_at')
      .eq('role', role)
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', currentPeriodStart.toISOString());

    const currentValue = currentStaff && !currentError ? currentStaff.length : 0;
    const previousValue = previousStaff && !previousError ? previousStaff.length : 0;
    const change = currentValue - previousValue;
    const changePercent = previousValue !== 0
      ? Math.round((change / previousValue) * 100 * 10) / 10
      : (currentValue > 0 ? 100 : 0);

    const dataPoints = [];
    const days = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const { data: staffUpToDate } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', role)
        .lte('created_at', date.toISOString());

      dataPoints.push({
        date: dateStr,
        value: staffUpToDate ? staffUpToDate.length : 0,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }

    const growthData = {
      currentValue,
      previousValue,
      change,
      changePercent,
      period,
      metric: 'staff',
      role,
      dataPoints
    };

    sendSuccess(res, growthData);
  } catch (error) {
    handleError(error, res, 'Failed to fetch staff growth data');
  }
});

app.get('/api/growth/staff-breakdown', async (req, res) => {
  try {
    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('role')
      .neq('role', 'student')
      .eq('status', 'active');

    if (usersError) {
      throw usersError;
    }

    const breakdown = {
      teacher: 0,
      librarian: 0,
      housekeeping: 0,
      accountant: 0,
      other: 0
    };

    if (allUsers) {
      allUsers.forEach(user => {
        const role = user.role;
        if (role === 'teacher') breakdown.teacher++;
        else if (role === 'librarian') breakdown.librarian++;
        else if (role === 'housekeeping') breakdown.housekeeping++;
        else if (role === 'accountant') breakdown.accountant++;
        else breakdown.other++;
      });
    }

    sendSuccess(res, breakdown);
  } catch (error) {
    handleError(error, res, 'Failed to fetch staff breakdown');
  }
});

// Finance endpoint (temporary - to be moved to routes/finance.js)
app.get('/api/finance', async (req, res) => {
  try {
    const { userId, role } = req.query;

    let totalIncome = 0.0;
    try {
      const { data: feesData, error: feesError } = await supabaseAdmin
        .from('fees')
        .select('amount, status');

      if (!feesError && feesData) {
        feesData.forEach(fee => {
          if (fee.status === 'paid' || fee.status === 'completed') {
            totalIncome += parseFloat(fee.amount || 0);
          }
        });
      }
    } catch (error) {
      try {
        const { data: paymentsData, error: paymentsError } = await supabaseAdmin
          .from('payments')
          .select('amount');

        if (!paymentsError && paymentsData) {
          paymentsData.forEach(payment => {
            totalIncome += parseFloat(payment.amount || 0);
          });
        }
      } catch (e) {
        // Both tables might not exist
      }
    }

    let totalSalaryPaid = 0.0;
    try {
      const { data: salariesData, error: salariesError } = await supabaseAdmin
        .from('salaries')
        .select('amount, status');

      if (!salariesError && salariesData) {
        salariesData.forEach(salary => {
          if (salary.status === 'paid' || salary.status === 'completed') {
            totalSalaryPaid += parseFloat(salary.amount || 0);
          }
        });
      }
    } catch (error) {
      // Salaries table might not exist
    }

    const careerGrowth = [];
    try {
      const { data: staffUsers, error: staffError } = await supabaseAdmin
        .from('users')
        .select('*')
        .neq('role', 'student')
        .eq('status', 'active');

      if (!staffError && staffUsers) {
        for (const user of staffUsers) {
          let currentSalary = 0.0;
          try {
            const { data: salaryData } = await supabaseAdmin
              .from('salaries')
              .select('amount')
              .eq('user_id', user.id)
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (salaryData) {
              currentSalary = parseFloat(salaryData.amount || 0);
            }
          } catch (e) {
            // Salary might not exist
          }

          let promotions = 0;
          try {
            const { data: promoData } = await supabaseAdmin
              .from('promotions')
              .select('id')
              .eq('user_id', user.id);

            if (promoData) {
              promotions = promoData.length;
            }
          } catch (e) {
            // Promotions table might not exist
          }

          let hikes = 0;
          try {
            const { data: hikeData } = await supabaseAdmin
              .from('salary_hikes')
              .select('id')
              .eq('user_id', user.id);

            if (hikeData) {
              hikes = hikeData.length;
            }
          } catch (e) {
            // Salary hikes table might not exist
          }

          careerGrowth.push({
            userId: user.id,
            name: user.name || '',
            role: user.role || '',
            currentSalary,
            joinDate: user.created_at || '',
            promotions,
            hikes
          });
        }
      }
    } catch (error) {
      // Error getting career growth data
    }

    const promotions = [];
    try {
      const { data: promoData, error: promoError } = await supabaseAdmin
        .from('promotions')
        .select('*')
        .order('promotion_date', { ascending: false });

      if (!promoError && promoData) {
        promotions.push(...promoData);
      }
    } catch (error) {
      // Promotions table might not exist
    }

    const hikeRate = {
      averageHikeRate: 0.0,
      totalHikes: 0,
      hikes: []
    };

    try {
      const { data: hikesData, error: hikesError } = await supabaseAdmin
        .from('salary_hikes')
        .select('*')
        .order('hike_date', { ascending: false });

      if (!hikesError && hikesData && hikesData.length > 0) {
        let totalHikePercent = 0.0;
        let count = 0;

        hikesData.forEach(hike => {
          if (hike.hike_percentage) {
            totalHikePercent += parseFloat(hike.hike_percentage || 0);
            count++;
          }
        });

        hikeRate.averageHikeRate = count > 0 ? totalHikePercent / count : 0.0;
        hikeRate.totalHikes = hikesData.length;
        hikeRate.hikes = hikesData;
      }
    } catch (error) {
      // Salary hikes table might not exist
    }

    const financeData = {
      totalIncome,
      totalSalaryPaid,
      netProfit: totalIncome - totalSalaryPaid,
      careerGrowth,
      promotions,
      hikeRate
    };

    sendSuccess(res, financeData);
  } catch (error) {
    handleError(error, res, 'Failed to fetch finance data');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ data: null, error: err.message || 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ data: null, error: `Route ${req.method} ${req.path} not found` });
});

// Export app for Vercel serverless functions
export default app;

// Only start the server if not running in Vercel environment
// Vercel will handle the serverless function execution
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
    console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  }).on('error', (err) => {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  });
}
