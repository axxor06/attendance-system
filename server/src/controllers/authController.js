import asyncHandler from 'express-async-handler';
import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import sendResponse from '../utils/sendResponse.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  parseDurationToMs,
} from '../utils/jwt.js';
import { createOtp, verifyOtp } from '../utils/otp.js';
import { sendOtpEmail, sendPasswordChangedEmail } from '../utils/email.js';
import { notifyUser } from '../services/notificationService.js';
import { logActivity } from '../services/activityLogService.js';
import { OTP_PURPOSE, NOTIFICATION_TYPE, ACTIVITY_ACTION, ROLES } from '../config/constants.js';

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: parseDurationToMs(process.env.JWT_REFRESH_EXPIRES),
    path: '/api/auth',
  });
}

/**
 * Student self-registration. Creates an unverified account and sends an
 * OTP to confirm the email. HOD/Faculty accounts are created directly by
 * the HOD (see userController) since those roles aren't self-service.
 */
export const registerStudent = asyncHandler(async (req, res) => {
  const { name, email, password, registerNumber, classId, phone } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  if (registerNumber) {
    const existingReg = await User.findOne({ registerNumber });
    if (existingReg) {
      throw ApiError.conflict('A student with this register number already exists.');
    }
  }

  const user = await User.create({
    name,
    email,
    password,
    role: ROLES.STUDENT,
    registerNumber,
    class: classId || null,
    phone,
    isEmailVerified: false,
  });

  const code = await createOtp(user.email, OTP_PURPOSE.EMAIL_VERIFICATION);
  await sendOtpEmail({ to: user.email, name: user.name, otp: code, purpose: OTP_PURPOSE.EMAIL_VERIFICATION });

  return sendResponse(res, 201, 'Account created. Please check your email for a verification code.', {
    email: user.email,
  });
});

/**
 * Verifies the OTP sent during registration and activates the account.
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const result = await verifyOtp(email, OTP_PURPOSE.EMAIL_VERIFICATION, otp);
  if (!result.valid) {
    throw ApiError.badRequest(result.reason);
  }

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { isEmailVerified: true },
    { new: true }
  );

  if (!user) {
    throw ApiError.notFound('No account found with this email.');
  }

  await notifyUser({
    userId: user._id,
    type: NOTIFICATION_TYPE.ACCOUNT_CREATED,
    title: 'Email verified',
    message: 'Your email has been verified successfully. You can now log in.',
  });

  return sendResponse(res, 200, 'Email verified successfully. You can now log in.');
});

/**
 * Resends a fresh OTP for either email verification or password reset.
 */
export const resendOtp = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Avoid leaking which emails are registered.
    return sendResponse(res, 200, 'If an account exists, a code has been sent.');
  }

  const otpPurpose = purpose === OTP_PURPOSE.PASSWORD_RESET
    ? OTP_PURPOSE.PASSWORD_RESET
    : OTP_PURPOSE.EMAIL_VERIFICATION;

  const code = await createOtp(user.email, otpPurpose);
  await sendOtpEmail({ to: user.email, name: user.name, otp: code, purpose: otpPurpose });

  return sendResponse(res, 200, 'If an account exists, a code has been sent.');
});

/**
 * Logs a user in. Requires students to have verified their email first.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact your administrator.');
  }

  if (user.role === ROLES.STUDENT && !user.isEmailVerified) {
    throw ApiError.forbidden('Please verify your email before logging in.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  setRefreshCookie(res, refreshToken);

  await logActivity({
    actorId: user._id,
    action: ACTIVITY_ACTION.LOGIN,
    targetType: 'User',
    targetId: user._id,
    description: `${user.name} logged in`,
    ipAddress: req.ip,
  });

  return sendResponse(res, 200, 'Login successful', {
    accessToken,
    user: user.toSafeObject(),
  });
});

/**
 * Issues a new access token using the refresh token cookie.
 */
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw ApiError.unauthorized('No refresh token provided.');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Account no longer available.');
  }

  const accessToken = generateAccessToken(user);

  return sendResponse(res, 200, 'Token refreshed', {
    accessToken,
    user: user.toSafeObject(),
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken', { path: '/api/auth' });
  return sendResponse(res, 200, 'Logged out successfully.');
});

/**
 * Step 1 of forgot-password: sends an OTP to the account email.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return sendResponse(res, 200, 'If an account exists, a reset code has been sent.');
  }

  const code = await createOtp(user.email, OTP_PURPOSE.PASSWORD_RESET);
  await sendOtpEmail({ to: user.email, name: user.name, otp: code, purpose: OTP_PURPOSE.PASSWORD_RESET });

  return sendResponse(res, 200, 'If an account exists, a reset code has been sent.');
});

/**
 * Step 2 of forgot-password: verifies OTP and sets the new password.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const result = await verifyOtp(email, OTP_PURPOSE.PASSWORD_RESET, otp);
  if (!result.valid) {
    throw ApiError.badRequest(result.reason);
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw ApiError.notFound('No account found with this email.');
  }

  user.password = newPassword;
  await user.save();

  await sendPasswordChangedEmail({ to: user.email, name: user.name });
  await notifyUser({
    userId: user._id,
    type: NOTIFICATION_TYPE.PASSWORD_CHANGED,
    title: 'Password changed',
    message: 'Your password was reset successfully.',
  });

  return sendResponse(res, 200, 'Password reset successfully. You can now log in.');
});

/**
 * Authenticated user changes their own password (knows current password).
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect.');
  }

  user.password = newPassword;
  await user.save();

  await sendPasswordChangedEmail({ to: user.email, name: user.name });
  await notifyUser({
    userId: user._id,
    type: NOTIFICATION_TYPE.PASSWORD_CHANGED,
    title: 'Password changed',
    message: 'Your password was changed successfully.',
  });

  return sendResponse(res, 200, 'Password changed successfully.');
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('department', 'name code')
    .populate('class', 'name code');
  return sendResponse(res, 200, 'Current user fetched', { user: user.toSafeObject() });
});
