import express from 'express';
import { supabaseAdmin } from '../common.js';
import { handleError, sendSuccess } from '../common.js';

const router = express.Router();

// Get dashboard data
router.get('/', async (req, res) => {
  try {
    const { userId, role } = req.query;

    const stats = {};
    const recentActivities = [];
    const students = [];
    const departments = [];
    const notifications = [];
    let userInfo = {};
    let organizationInfo = {};
    const allUsers = [];

    // Get user info
    if (userId) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!userError && userData) {
        userInfo = userData;

        // Get organization info if user has org_id
        if (userData.org_id) {
          const { data: orgData, error: orgError } = await supabaseAdmin
            .from('organizations')
            .select('*')
            .eq('id', userData.org_id)
            .single();

          if (!orgError && orgData) {
            organizationInfo = orgData;
          }
        }
      }
    }

    // Get departments
    const { data: deptsData, error: deptsError } = await supabaseAdmin
      .from('departments')
      .select('*');

    if (!deptsError && deptsData) {
      departments.push(...deptsData);
    }

    // Get all active users first (for stats calculation)
    const { data: allActiveUsers, error: allActiveUsersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('status', 'active');

    // Calculate total students and staff from all active users
    let totalStudentsCount = 0;
    let totalStaffCount = 0;
    if (!allActiveUsersError && allActiveUsers) {
      totalStudentsCount = allActiveUsers.filter(u => u.role === 'student').length;
      totalStaffCount = allActiveUsers.filter(u => u.role !== 'student').length;
    }

    // Get filtered users (for admin/vice_head) or filtered users (for teachers)
    if (role === 'teacher' && userId) {
      // Get teacher departments
      const { data: teacherDeptsData, error: teacherDeptsError } = await supabaseAdmin
        .from('teacher_departments')
        .select('department_id')
        .eq('teacher_id', userId);

      const deptIds = teacherDeptsData && !teacherDeptsError
        ? teacherDeptsData.map(td => td.department_id)
        : [];

      // Get students for teacher's departments
      if (deptIds.length > 0) {
        const { data: studentsData, error: studentsError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('role', 'student')
          .eq('status', 'active')
          .in('department_id', deptIds);

        if (!studentsError && studentsData) {
          students.push(...studentsData);
          allUsers.push(...studentsData);
        }
      }
    } else {
      // For admin/vice_head, get all active users
      if (!allActiveUsersError && allActiveUsers) {
        allUsers.push(...allActiveUsers);
        // Filter students
        students.push(...allActiveUsers.filter(u => u.role === 'student'));
      }
    }

    // Get recent activities (limit to 10, ordered by created_at desc)
    const { data: activitiesData, error: activitiesError } = await supabaseAdmin
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!activitiesError && activitiesData) {
      recentActivities.push(...activitiesData);
    }

    // Get notifications for user
    if (userId) {
      const { data: notifsData, error: notifsError } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!notifsError && notifsData) {
        notifications.push(...notifsData);
      }
    }

    // Calculate attendance rate (average for last 7 days)
    const { data: allAttendanceData, error: attendanceError } = await supabaseAdmin
      .from('attendance')
      .select('*');

    let attendanceRate = 0.0;
    if (!attendanceError && allAttendanceData && allAttendanceData.length > 0) {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];

      let totalAttendanceRecords = 0;
      let presentCount = 0;

      for (const record of allAttendanceData) {
        if (!record.date) continue;

        let recordDate = record.date;
        if (recordDate.includes('T')) {
          recordDate = recordDate.split('T')[0];
        }
        if (recordDate.includes(' ')) {
          recordDate = recordDate.split(' ')[0];
        }

        if (recordDate && recordDate >= weekAgoStr && recordDate <= todayStr) {
          totalAttendanceRecords++;
          if (record.status === 'present') {
            presentCount++;
          }
        }
      }

      if (totalAttendanceRecords > 0) {
        attendanceRate = Math.round((presentCount / totalAttendanceRecords) * 100 * 10) / 10;
      }
    }

    // Calculate stats
    stats.totalStudents = totalStudentsCount;
    stats.totalStaff = totalStaffCount;
    stats.totalDepartments = departments.length;
    stats.totalActivities = recentActivities.length;
    stats.attendanceRate = attendanceRate;
    stats.feeCollection = 0.0;
    stats.feeCollectionPercentage = 0.0;
    stats.unreadNotifications = notifications.filter(n => !n.read).length;

    // --- Governance Portal Data ---

    // 1. Placement Stats
    const { data: placementData, error: placementError } = await supabaseAdmin
      .from('placements')
      .select('package_lpa, status');

    let placementStats = { totalOffers: 0, avgPackage: 0, highestPackage: 0 };
    if (!placementError && placementData) {
      const offers = placementData.filter(p => ['Selected', 'Offer Received'].includes(p.status));
      placementStats.totalOffers = offers.length;
      if (offers.length > 0) {
        const packages = offers.map(p => parseFloat(p.package_lpa || 0));
        placementStats.avgPackage = (packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(1);
        placementStats.highestPackage = Math.max(...packages);
      }
    }

    // 2. Compliance Stats
    const { data: complianceData, error: complianceError } = await supabaseAdmin
      .from('compliance_records')
      .select('status, category');

    let complianceStats = { compliant: 0, nonCompliant: 0, pending: 0 };
    if (!complianceError && complianceData) {
      complianceStats.compliant = complianceData.filter(c => c.status === 'Compliant').length;
      complianceStats.nonCompliant = complianceData.filter(c => c.status === 'Non-Compliant').length;
      complianceStats.pending = complianceData.filter(c => ['Pending Review', 'In Progress'].includes(c.status)).length;
    }

    // 3. Pending Approvals
    const { count: pendingApprovalsCount, error: approvalError } = await supabaseAdmin
      .from('approval_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending');

    const pendingApprovals = pendingApprovalsCount || 0;

    // 4. System Update
    const { data: latestUpdate, error: updateError } = await supabaseAdmin
      .from('system_updates')
      .select('*')
      .order('release_date', { ascending: false })
      .limit(1)
      .single();

    const systemVersion = latestUpdate ? latestUpdate.version : 'v1.0.0';

    // 5. Fee Collection (Simplified for Dashboard)
    let totalFeeCollection = 0.0;
    try {
      const { data: feesData } = await supabaseAdmin
        .from('fees')
        .select('amount')
        .in('status', ['paid', 'completed']);

      if (feesData) {
        totalFeeCollection = feesData.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);
      }
    } catch (e) {
      // fees table might not exist
    }

    // Update stats object
    stats.placements = placementStats;
    stats.compliance = complianceStats;
    stats.pendingApprovals = pendingApprovals;
    stats.systemVersion = systemVersion;
    stats.feeCollection = totalFeeCollection;

    const dashboardData = {
      stats,
      recentActivities,
      students,
      departments,
      notifications,
      userInfo,
      organizationInfo,
      allUsers
    };

    sendSuccess(res, dashboardData);
  } catch (error) {
    handleError(error, res, 'Failed to fetch dashboard data');
  }
});

export default router;

