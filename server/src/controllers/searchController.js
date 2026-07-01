import asyncHandler from 'express-async-handler';
import { User, Department, Subject } from '../models/index.js';
import sendResponse from '../utils/sendResponse.js';
import ApiError from '../utils/ApiError.js';
import { ROLES } from '../config/constants.js';

/**
 * Global search across students, faculty, departments, and subjects.
 * Scoped by role: students can only search within their own data context
 * is not really meaningful for them, so this endpoint is restricted to
 * HOD and Faculty (students don't need an institution-wide search).
 */
export const globalSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    throw ApiError.badRequest('Search query must be at least 2 characters.');
  }

  const regex = { $regex: q.trim(), $options: 'i' };

  const [students, faculty, departments, subjects] = await Promise.all([
    User.find({
      role: ROLES.STUDENT,
      $or: [{ name: regex }, { registerNumber: regex }, { email: regex }],
    })
      .select('name registerNumber email class')
      .populate('class', 'name code')
      .limit(10),

    User.find({
      role: ROLES.FACULTY,
      $or: [{ name: regex }, { employeeId: regex }, { email: regex }],
    })
      .select('name employeeId email department')
      .populate('department', 'name code')
      .limit(10),

    Department.find({ $or: [{ name: regex }, { code: regex }] }).limit(10),

    Subject.find({ $or: [{ name: regex }, { code: regex }] })
      .select('name code class')
      .populate('class', 'name code')
      .limit(10),
  ]);

  return sendResponse(res, 200, 'Search results fetched', {
    students,
    faculty,
    departments,
    subjects,
  });
});
