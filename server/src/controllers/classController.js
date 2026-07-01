import asyncHandler from 'express-async-handler';
import { Class, Department, Semester, User, Subject } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import sendResponse from '../utils/sendResponse.js';
import { logActivity } from '../services/activityLogService.js';
import { ACTIVITY_ACTION } from '../config/constants.js';

async function buildDisplayFields(departmentId, semesterId) {
  const [department, semester] = await Promise.all([
    Department.findById(departmentId),
    Semester.findById(semesterId),
  ]);
  if (!department) throw ApiError.badRequest('Invalid department.');
  if (!semester) throw ApiError.badRequest('Invalid semester.');

  return {
    name: `${department.name} - ${semester.label}`,
    code: `${department.code}-SEM${semester.number}`,
  };
}

export const getPublicClassOptions = asyncHandler(async (req, res) => {
  const classes = await Class.find({ isActive: true })
    .populate('department', 'name code')
    .populate('semester', 'number label')
    .select('name code department semester')
    .sort({ name: 1 });

  return sendResponse(res, 200, 'Class options fetched', { classes });
});

export const createClass = asyncHandler(async (req, res) => {
  const { department, semester, classTeacher } = req.body;

  const exists = await Class.findOne({ department, semester });
  if (exists) {
    throw ApiError.conflict('A class already exists for this department and semester.');
  }

  const { name, code } = await buildDisplayFields(department, semester);

  const newClass = await Class.create({
    department,
    semester,
    name,
    code,
    classTeacher: classTeacher || null,
    createdBy: req.user._id,
  });

  await logActivity({
    actorId: req.user._id,
    action: ACTIVITY_ACTION.CREATE,
    targetType: 'Class',
    targetId: newClass._id,
    description: `Created class ${newClass.name}`,
  });

  return sendResponse(res, 201, 'Class created successfully', { class: newClass });
});

export const getClasses = asyncHandler(async (req, res) => {
  const { department, semester } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (semester) filter.semester = semester;

  const classes = await Class.find(filter)
    .populate('department', 'name code')
    .populate('semester', 'number label')
    .populate('classTeacher', 'name email')
    .sort({ createdAt: -1 });

  return sendResponse(res, 200, 'Classes fetched', { classes });
});

export const getClassById = asyncHandler(async (req, res) => {
  const classDoc = await Class.findById(req.params.id)
    .populate('department', 'name code')
    .populate('semester', 'number label')
    .populate('classTeacher', 'name email');

  if (!classDoc) throw ApiError.notFound('Class not found');

  const studentCount = await User.countDocuments({ class: classDoc._id, role: 'student' });
  const subjectCount = await Subject.countDocuments({ class: classDoc._id });

  return sendResponse(res, 200, 'Class fetched', {
    class: classDoc,
    studentCount,
    subjectCount,
  });
});

export const updateClass = asyncHandler(async (req, res) => {
  const { classTeacher, isActive } = req.body;

  const classDoc = await Class.findById(req.params.id);
  if (!classDoc) throw ApiError.notFound('Class not found');

  if (classTeacher !== undefined) classDoc.classTeacher = classTeacher || null;
  if (isActive !== undefined) classDoc.isActive = isActive;

  await classDoc.save();

  await logActivity({
    actorId: req.user._id,
    action: ACTIVITY_ACTION.UPDATE,
    targetType: 'Class',
    targetId: classDoc._id,
    description: `Updated class ${classDoc.name}`,
  });

  return sendResponse(res, 200, 'Class updated successfully', { class: classDoc });
});

export const deleteClass = asyncHandler(async (req, res) => {
  const classDoc = await Class.findById(req.params.id);
  if (!classDoc) throw ApiError.notFound('Class not found');

  const studentCount = await User.countDocuments({ class: classDoc._id, role: 'student' });
  const subjectCount = await Subject.countDocuments({ class: classDoc._id });

  if (studentCount > 0 || subjectCount > 0) {
    throw ApiError.conflict(
      'Cannot delete a class that still has students or subjects assigned to it.'
    );
  }

  await classDoc.deleteOne();

  await logActivity({
    actorId: req.user._id,
    action: ACTIVITY_ACTION.DELETE,
    targetType: 'Class',
    targetId: classDoc._id,
    description: `Deleted class ${classDoc.name}`,
  });

  return sendResponse(res, 200, 'Class deleted successfully');
});
