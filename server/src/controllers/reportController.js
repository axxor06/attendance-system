import asyncHandler from 'express-async-handler';
import { Subject, User, Class } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import {
  getSubjectRoster,
  getOverallAttendance,
  getSubjectWiseAttendance,
} from '../services/attendanceService.js';
import { buildSubjectAttendancePdf, buildStudentAttendancePdf, buildClassMonthlyPdf } from '../services/pdfReportService.js';
import { buildSubjectAttendanceExcel, buildStudentAttendanceExcel, buildClassMonthlyExcel } from '../services/excelReportService.js';
import { Attendance } from '../models/index.js';
import { PRESENT_LIKE_STATUSES } from '../config/constants.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Subject report (faculty/HOD): every student in the subject with their
 * attended/total/percentage, exported as PDF or Excel based on ?format=.
 */
export const exportSubjectReport = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const { format = 'pdf', from, to } = req.query;

  const subject = await Subject.findById(subjectId).populate('class');
  if (!subject) throw ApiError.notFound('Subject not found');

  if (req.user.role === 'faculty' && !subject.faculty.some((f) => f.toString() === req.user._id.toString())) {
    throw ApiError.forbidden('You can only export reports for subjects you teach.');
  }

  const rows = await getSubjectRoster({ subjectId, from, to });
  const generatedAt = new Date();

  if (format === 'excel' || format === 'xlsx') {
    const workbook = await buildSubjectAttendanceExcel({
      subjectName: subject.name,
      subjectCode: subject.code,
      className: subject.class?.name,
      rows,
      generatedAt,
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${subject.code}_attendance_report.xlsx"`);
    await workbook.xlsx.write(res);
    return res.end();
  }

  const buffer = await buildSubjectAttendancePdf({
    subjectName: subject.name,
    subjectCode: subject.code,
    className: subject.class?.name,
    rows,
    generatedAt,
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${subject.code}_attendance_report.pdf"`);
  return res.send(buffer);
});

/**
 * Student's own report: subject-wise breakdown, exported as PDF or Excel.
 */
export const exportStudentReport = asyncHandler(async (req, res) => {
  const { format = 'pdf' } = req.query;
  const studentId = req.params.studentId || req.user._id;

  // Non-self lookups (faculty/HOD viewing a specific student) are allowed;
  // students can only export their own report.
  if (req.user.role === 'student' && studentId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only export your own attendance report.');
  }

  const student = await User.findById(studentId);
  if (!student) throw ApiError.notFound('Student not found');

  const [overall, subjectWise] = await Promise.all([
    getOverallAttendance({ studentId }),
    getSubjectWiseAttendance({ studentId }),
  ]);

  const generatedAt = new Date();

  if (format === 'excel' || format === 'xlsx') {
    const workbook = await buildStudentAttendanceExcel({
      studentName: student.name,
      registerNumber: student.registerNumber,
      overall,
      subjectWise,
      generatedAt,
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${student.registerNumber || student.name}_attendance.xlsx"`);
    await workbook.xlsx.write(res);
    return res.end();
  }

  const buffer = await buildStudentAttendancePdf({
    studentName: student.name,
    registerNumber: student.registerNumber,
    overall,
    subjectWise,
    generatedAt,
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${student.registerNumber || student.name}_attendance.pdf"`);
  return res.send(buffer);
});

/**
 * Class-wide monthly report (HOD/faculty/class teacher): every student in
 * the class with their attendance for a given month.
 */
export const exportClassMonthlyReport = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { format = 'pdf', year, month } = req.query;

  const classDoc = await Class.findById(classId).populate('department');
  if (!classDoc) throw ApiError.notFound('Class not found');

  const now = new Date();
  const targetYear = year ? Number(year) : now.getUTCFullYear();
  const targetMonth = month ? Number(month) : now.getUTCMonth() + 1; // 1-indexed

  const from = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
  const to = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59));

  const students = await User.find({ class: classId, role: 'student' }).select('name registerNumber');

  const agg = await Attendance.aggregate([
    { $match: { class: classDoc._id, date: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: '$student',
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ['$status', PRESENT_LIKE_STATUSES] }, 1, 0] } },
      },
    },
  ]);
  const byStudent = new Map(agg.map((a) => [a._id.toString(), a]));

  const rows = students
    .map((s) => {
      const a = byStudent.get(s._id.toString());
      const total = a?.total || 0;
      const present = a?.present || 0;
      const percentage = total === 0 ? 0 : Math.round((present / total) * 10000) / 100;
      return { name: s.name, registerNumber: s.registerNumber, total, present, percentage };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const monthLabel = `${MONTH_NAMES[targetMonth - 1]} ${targetYear}`;
  const generatedAt = new Date();

  if (format === 'excel' || format === 'xlsx') {
    const workbook = await buildClassMonthlyExcel({ className: classDoc.name, monthLabel, rows, generatedAt });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${classDoc.code}_${monthLabel.replace(' ', '_')}.xlsx"`);
    await workbook.xlsx.write(res);
    return res.end();
  }

  const buffer = await buildClassMonthlyPdf({ className: classDoc.name, monthLabel, rows, generatedAt });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${classDoc.code}_${monthLabel.replace(' ', '_')}.pdf"`);
  return res.send(buffer);
});
