import asyncHandler from 'express-async-handler';
import { User, Subject, Attendance, ActivityLog, Class, Department } from '../models/index.js';
import sendResponse from '../utils/sendResponse.js';
import {
  getOverallAttendance,
  getSubjectWiseAttendance,
  getMonthlyAttendance,
  getLowAttendanceStudents,
} from '../services/attendanceService.js';
import { ROLES, LOW_ATTENDANCE_THRESHOLD, PRESENT_LIKE_STATUSES } from '../config/constants.js';

function todayRange() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

function monthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * HOD dashboard: institution-wide totals, today's & monthly attendance,
 * low attendance list, and recent activity feed.
 */
export const getHodDashboard = asyncHandler(async (req, res) => {
  const { start, end } = todayRange();
  const since = monthStart();

  const [totalStudents, totalFaculty, totalDepartments, totalClasses] = await Promise.all([
    User.countDocuments({ role: ROLES.STUDENT, isActive: true }),
    User.countDocuments({ role: ROLES.FACULTY, isActive: true }),
    Department.countDocuments({ isActive: true }),
    Class.countDocuments({ isActive: true }),
  ]);

  const [todayAgg] = await Attendance.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ['$status', PRESENT_LIKE_STATUSES] }, 1, 0] } },
      },
    },
  ]);

  const todayAttendance = {
    total: todayAgg?.total || 0,
    present: todayAgg?.present || 0,
    percentage: todayAgg?.total ? Math.round((todayAgg.present / todayAgg.total) * 10000) / 100 : 0,
  };

  const [monthAgg] = await Attendance.aggregate([
    { $match: { date: { $gte: since } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ['$status', PRESENT_LIKE_STATUSES] }, 1, 0] } },
      },
    },
  ]);

  const monthlyAttendance = {
    total: monthAgg?.total || 0,
    present: monthAgg?.present || 0,
    percentage: monthAgg?.total ? Math.round((monthAgg.present / monthAgg.total) * 10000) / 100 : 0,
  };

  const lowAttendanceStudents = await getLowAttendanceStudents({
    threshold: LOW_ATTENDANCE_THRESHOLD,
  });

  const recentActivity = await ActivityLog.find()
    .populate('actor', 'name role')
    .sort({ createdAt: -1 })
    .limit(15);

  // Daily attendance trend for the last 14 days, for charting.
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setUTCHours(0, 0, 0, 0);

  const trend = await Attendance.aggregate([
    { $match: { date: { $gte: fourteenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ['$status', PRESENT_LIKE_STATUSES] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        total: 1,
        present: 1,
        percentage: {
          $cond: [{ $eq: ['$total', 0] }, 0, { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 2] }],
        },
      },
    },
    { $sort: { date: 1 } },
  ]);

  return sendResponse(res, 200, 'HOD dashboard data fetched', {
    totals: { totalStudents, totalFaculty, totalDepartments, totalClasses },
    todayAttendance,
    monthlyAttendance,
    lowAttendanceStudents: lowAttendanceStudents.slice(0, 10),
    lowAttendanceCount: lowAttendanceStudents.length,
    recentActivity,
    attendanceTrend: trend,
  });
});

/**
 * Faculty dashboard: assigned subjects, today's classes, pending
 * attendance count, and recent attendance they've marked.
 */
export const getFacultyDashboard = asyncHandler(async (req, res) => {
  const facultyId = req.user._id;
  const { start, end } = todayRange();

  const subjects = await Subject.find({ faculty: facultyId, isActive: true })
    .populate('class', 'name code')
    .populate('department', 'name code');

  const recentAttendance = await Attendance.find({ faculty: facultyId })
    .populate('subject', 'name code')
    .populate('student', 'name registerNumber')
    .sort({ markedAt: -1 })
    .limit(15);

  const todayMarkedCount = await Attendance.countDocuments({
    faculty: facultyId,
    date: { $gte: start, $lte: end },
  });

  return sendResponse(res, 200, 'Faculty dashboard data fetched', {
    assignedSubjectsCount: subjects.length,
    subjects,
    todayMarkedCount,
    recentAttendance,
  });
});

/**
 * Student dashboard: overall %, subject-wise %, monthly trend, and
 * recent attendance history.
 */
export const getStudentDashboard = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const [overall, subjectWise, monthly, recent] = await Promise.all([
    getOverallAttendance({ studentId }),
    getSubjectWiseAttendance({ studentId }),
    getMonthlyAttendance({ studentId }),
    Attendance.find({ student: studentId })
      .populate('subject', 'name code')
      .sort({ date: -1, periodOrder: 1 })
      .limit(10),
  ]);

  return sendResponse(res, 200, 'Student dashboard data fetched', {
    overall,
    subjectWise,
    monthly,
    recentHistory: recent,
    lowAttendanceWarning: overall.total >= 5 && overall.percentage < LOW_ATTENDANCE_THRESHOLD,
  });
});
