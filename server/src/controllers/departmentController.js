import asyncHandler from 'express-async-handler';
import { Department, Class } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import sendResponse from '../utils/sendResponse.js';
import { logActivity } from '../services/activityLogService.js';
import { ACTIVITY_ACTION } from '../config/constants.js';

export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description } = req.body;

  const exists = await Department.findOne({
    $or: [{ name }, { code: code.toUpperCase() }],
  });
  if (exists) {
    throw ApiError.conflict('A department with this name or code already exists.');
  }

  const department = await Department.create({
    name,
    code,
    description,
    createdBy: req.user._id,
  });

  await logActivity({
    actorId: req.user._id,
    action: ACTIVITY_ACTION.CREATE,
    targetType: 'Department',
    targetId: department._id,
    description: `Created department ${department.name}`,
  });

  return sendResponse(res, 201, 'Department created successfully', { department });
});

export const getDepartments = asyncHandler(async (req, res) => {
  const { includeInactive } = req.query;
  const filter = includeInactive === 'true' ? {} : { isActive: true };
  const departments = await Department.find(filter).sort({ name: 1 });
  return sendResponse(res, 200, 'Departments fetched', { departments });
});

export const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound('Department not found');
  return sendResponse(res, 200, 'Department fetched', { department });
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, isActive } = req.body;

  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound('Department not found');

  if (name) department.name = name;
  if (code) department.code = code;
  if (description !== undefined) department.description = description;
  if (isActive !== undefined) department.isActive = isActive;

  await department.save();

  await logActivity({
    actorId: req.user._id,
    action: ACTIVITY_ACTION.UPDATE,
    targetType: 'Department',
    targetId: department._id,
    description: `Updated department ${department.name}`,
  });

  return sendResponse(res, 200, 'Department updated successfully', { department });
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound('Department not found');

  const classCount = await Class.countDocuments({ department: department._id });
  if (classCount > 0) {
    throw ApiError.conflict(
      'Cannot delete a department that still has classes. Delete or reassign its classes first.'
    );
  }

  await department.deleteOne();

  await logActivity({
    actorId: req.user._id,
    action: ACTIVITY_ACTION.DELETE,
    targetType: 'Department',
    targetId: department._id,
    description: `Deleted department ${department.name}`,
  });

  return sendResponse(res, 200, 'Department deleted successfully');
});
