import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import { User, Attendance, Subject } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import sendResponse from '../utils/sendResponse.js';
import { sendAccountCreatedEmail, sendPasswordChangedEmail } from '../utils/email.js';
import { notifyUser } from '../services/notificationService.js';
import { logActivity } from '../services/activityLogService.js';
import { ACTIVITY_ACTION, NOTIFICATION_TYPE, ROLES } from '../config/constants.js';

function generateTempPassword() {
  return crypto.randomBytes(6).toString('base64url'); // ~8 char URL-safe string
}

/**
 * HOD creates a Faculty or Student account directly (no self-registration
 * OTP flow needed since the HOD is vouching for the identity). A random
 * temporary password is generated and emailed unless one is provided.
 * Accounts created this way are marked email-verified immediately.
 */
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, role, registerNumber, employeeId, department, classId, phone, password } = req.body;

  if (![ROLES.FACULTY, ROLES.STUDENT, ROLES.HOD].includes(role)) {
    throw ApiError.badRequest('Invalid role specified.');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  if (role === ROLES.STUDENT && registerNumber) {
    const dupReg = await User.findOne({ registerNumber });
    if (dupReg) throw ApiError.conflict('A student with this register number already exists.');
  }

  if ((role === ROLES.FACULTY || role === ROLES.HOD) && employeeId) {
    const dupEmp = await User.findOne({ employeeId });
    if (dupEmp) throw ApiError.conflict('A staff member with this employee ID already exists.');
  }

  if (role === ROLES.STUDENT && !classId) {
    throw ApiError.badRequest('A class must be assigned when creating a student.');
  }

  const tempPassword = password || generateTempPassword();

  const user = await User.create({
    name,
    email,
    password: tempPassword,
    role,
    registerNumber: role === ROLES.STUDENT ? registerNumber : undefined,
    employeeId: role !== ROLES.STUDENT ? employeeId : undefined,
    department: department || null,
    class: role === ROLES.STUDENT ? classId : null,
    phone,
    isEmailVerified: true,
    createdBy: req.user._id,
  });

  await sendAccountCreatedEmail({ to: user.email, name: user.name, role: user.role, tempPassword });
  await notifyUser({
    userId: user._id,
    type: NOTIFICATION_TYPE.ACCOUNT_CREATED,
    title: 'Welcome',
    message: `Your ${role} account has been created.`,
  });

  await logActivity({
    actorId: req.user._id,
    action: ACTIVITY_ACTION.CREATE,
    targetType: 'User',
    targetId: user._id,
    description: `Created ${role} account for ${user.name}`,
  });

  return sendResponse(res, 201, `${role} account created successfully`, {
    user: user.toSafeObject(),
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const { role, department, classId, search, page = 1, limit = 25 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (department) filter.department = department;
  if (classId) filter.class = classId;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { registerNumber: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [users, total] = await Promise.all([
    User.find(filter)
      .populate('department', 'name code')
      .populate('class', 'name code')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  return sendResponse(res, 200, 'Users fetched', {
    users,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('department', 'name code')
    .populate('class', 'name code');
  if (!user) throw ApiError.notFound('User not found');
  return sendResponse(res, 200, 'User fetched', { user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { name, phone, department, classId, isActive, avatarUrl } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (department !== undefined) user.department = department || null;
  if (classId !== undefined && user.role === ROLES.STUDENT) user.class = classId || null;
  if (isActive !== undefined) user.isActive = isActive;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  await user.save();

  await logActivity({
    actorId: req.user._id,
    action: ACTIVITY_ACTION.UPDATE,
    targetType: 'User',
    targetId: user._id,
    description: `Updated user ${user.name}`,
  });

  return sendResponse(res, 200, 'User updated successfully', { user: user.toSafeObject() });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  if (user.role === ROLES.STUDENT) {
    await Attendance.deleteMany({ student: user._id });
  }
  if (user.role === ROLES.FACULTY) {
    await Subject.updateMany({ faculty: user._id }, { $pull: { faculty: user._id } });
  }

  await user.deleteOne();

  await logActivity({
    actorId: req.user._id,
    action: ACTIVITY_ACTION.DELETE,
    targetType: 'User',
    targetId: user._id,
    description: `Deleted user ${user.name}`,
  });

  return sendResponse(res, 200, 'User deleted successfully');
});

/**
 * HOD resets any user's password to a freshly generated temporary
 * password (or a provided one), and emails it to them.
 */
export const resetUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  const tempPassword = newPassword || generateTempPassword();
  user.password = tempPassword;
  await user.save();

  await sendPasswordChangedEmail({ to: user.email, name: user.name });
  await notifyUser({
    userId: user._id,
    type: NOTIFICATION_TYPE.PASSWORD_CHANGED,
    title: 'Password reset by administrator',
    message: 'Your password has been reset by the HOD. Check your email for details.',
  });

  await logActivity({
    actorId: req.user._id,
    action: ACTIVITY_ACTION.PASSWORD_RESET,
    targetType: 'User',
    targetId: user._id,
    description: `Reset password for ${user.name}`,
  });

  return sendResponse(res, 200, 'Password reset successfully and emailed to the user.', {
    // Returned only so the HOD can communicate it directly if email delivery is delayed.
    temporaryPassword: tempPassword,
  });
});
