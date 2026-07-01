import asyncHandler from 'express-async-handler';
import { Semester, Class } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import sendResponse from '../utils/sendResponse.js';
import { logActivity } from '../services/activityLogService.js';
import { ACTIVITY_ACTION } from '../config/constants.js';

export const createSemester = asyncHandler(async (req, res) => {
  const { number, label, startDate, endDate, isActive } = req.body;

  const exists = await Semester.findOne({ number });
  if (exists) {
    throw ApiError.conflict(`Semester ${number} already exists.`);
  }

  const semester = await Semester.create({
    number,
    label,
    startDate,
    endDate,
    isActive,
    createdBy: req.user._id,
  });

  await logActivity({
    actorId: req.user._id,
    action: ACTIVITY_ACTION.CREATE,
    targetType: 'Semester',
    targetId: semester._id,
    description: `Created ${semester.label}`,
  });

  return sendResponse(res, 201, 'Semester created successfully', { semester });
});

export const getSemesters = asyncHandler(async (req, res) => {
  const semesters = await Semester.find().sort({ number: 1 });
  return sendResponse(res, 200, 'Semesters fetched', { semesters });
});

export const getSemesterById = asyncHandler(async (req, res) => {
  const semester = await Semester.findById(req.params.id);
  if (!semester) throw ApiError.notFound('Semester not found');
  return sendResponse(res, 200, 'Semester fetched', { semester });
});

export const updateSemester = asyncHandler(async (req, res) => {
  const { number, label, startDate, endDate, isActive } = req.body;

  const semester = await Semester.findById(req.params.id);
  if (!semester) throw ApiError.notFound('Semester not found');

  if (number !== undefined) semester.number = number;
  if (label !== undefined) semester.label = label;
  if (startDate !== undefined) semester.startDate = startDate;
  if (endDate !== undefined) semester.endDate = endDate;
  if (isActive !== undefined) semester.isActive = isActive;

  await semester.save();

  await logActivity({
    actorId: req.user._id,
    action: ACTIVITY_ACTION.UPDATE,
    targetType: 'Semester',
    targetId: semester._id,
    description: `Updated ${semester.label}`,
  });

  return sendResponse(res, 200, 'Semester updated successfully', { semester });
});

export const deleteSemester = asyncHandler(async (req, res) => {
  const semester = await Semester.findById(req.params.id);
  if (!semester) throw ApiError.notFound('Semester not found');

  const classCount = await Class.countDocuments({ semester: semester._id });
  if (classCount > 0) {
    throw ApiError.conflict(
      'Cannot delete a semester that still has classes. Delete or reassign its classes first.'
    );
  }

  await semester.deleteOne();

  await logActivity({
    actorId: req.user._id,
    action: ACTIVITY_ACTION.DELETE,
    targetType: 'Semester',
    targetId: semester._id,
    description: `Deleted ${semester.label}`,
  });

  return sendResponse(res, 200, 'Semester deleted successfully');
});
