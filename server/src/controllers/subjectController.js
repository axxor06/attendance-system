import asyncHandler from 'express-async-handler';
import { Subject, Attendance } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import sendResponse from '../utils/sendResponse.js';
import { logActivity } from '../services/activityLogService.js';
import { ACTIVITY_ACTION } from '../config/constants.js';

export const createSubject = asyncHandler(async (req, res) => {
  const { name, code, department, semester, classId, faculty, students, isElective } = req.body;

  const exists = await Subject.findOne({ code: code.toUpperCase(), class: classId });
  if (exists) {
    throw ApiError.conflict('A subject with this code already exists for this class.');
  }

  const subject = await Subject.create({
    name,
    code,
    department,
    semester,
    class: classId,
    faculty: faculty || [],
    students: students || [],
    isElective: !!isElective,
    createdBy: req.user._id,
  });

  await logActivity({
    actorId: req.user._id,
    action: ACTIVITY_ACTION.CREATE,
    targetType: 'Subject',
    targetId: subject._id,
    description: `Created subject ${subject.name}`,
  });

  return sendResponse(res, 201, 'Subject created successfully', { subject });
});

export const getSubjects = asyncHandler(async (req, res) => {
  const { department, semester, classId, facultyId } = req.query;

  const filter = {};
  if (department) filter.department = department;
  if (semester) filter.semester = semester;
  if (classId) filter.class = classId;
  if (facultyId) filter.faculty = facultyId;

  const subjects = await Subject.find(filter)
    .populate('department', 'name code')
    .populate('semester', 'number label')
    .populate('class', 'name code')
    .populate('faculty', 'name email employeeId')
    .sort({ name: 1 });

  return sendResponse(res, 200, 'Subjects fetched', { subjects });
});

export const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id)
    .populate('department', 'name code')
    .populate('semester', 'number label')
    .populate('class', 'name code')
    .populate('faculty', 'name email employeeId')
    .populate('students', 'name registerNumber email');

  if (!subject) throw ApiError.notFound('Subject not found');

  return sendResponse(res, 200, 'Subject fetched', { subject });
});

/**
 * Returns subjects assigned to the currently authenticated faculty member.
 */
export const getMySubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ faculty: req.user._id, isActive: true })
    .populate('department', 'name code')
    .populate('semester', 'number label')
    .populate('class', 'name code')
    .sort({ name: 1 });

  return sendResponse(res, 200, 'Your subjects fetched', { subjects });
});

export const updateSubject = asyncHandler(async (req, res) => {
  const { name, code, faculty, students, isElective, isActive } = req.body;

  const subject = await Subject.findById(req.params.id);
  if (!subject) throw ApiError.notFound('Subject not found');

  if (name !== undefined) subject.name = name;
  if (code !== undefined) subject.code = code;
  if (faculty !== undefined) subject.faculty = faculty;
  if (students !== undefined) subject.students = students;
  if (isElective !== undefined) subject.isElective = isElective;
  if (isActive !== undefined) subject.isActive = isActive;

  await subject.save();

  await logActivity({
    actorId: req.user._id,
    action: ACTIVITY_ACTION.UPDATE,
    targetType: 'Subject',
    targetId: subject._id,
    description: `Updated subject ${subject.name}`,
  });

  return sendResponse(res, 200, 'Subject updated successfully', { subject });
});

export const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw ApiError.notFound('Subject not found');

  const attendanceCount = await Attendance.countDocuments({ subject: subject._id });
  if (attendanceCount > 0) {
    throw ApiError.conflict(
      'Cannot delete a subject that already has attendance records. Deactivate it instead.'
    );
  }

  await subject.deleteOne();

  await logActivity({
    actorId: req.user._id,
    action: ACTIVITY_ACTION.DELETE,
    targetType: 'Subject',
    targetId: subject._id,
    description: `Deleted subject ${subject.name}`,
  });

  return sendResponse(res, 200, 'Subject deleted successfully');
});
