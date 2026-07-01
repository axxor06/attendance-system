import { body } from 'express-validator';
import { OTP_PURPOSE } from '../config/constants.js';

export const registerStudentValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('registerNumber').optional().trim(),
  body('classId').optional().isMongoId().withMessage('Invalid class id'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const verifyEmailValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('otp').isLength({ min: 4, max: 8 }).withMessage('Invalid OTP code'),
];

export const resendOtpValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('purpose')
    .optional()
    .isIn(Object.values(OTP_PURPOSE))
    .withMessage('Invalid OTP purpose'),
];

export const forgotPasswordValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
];

export const resetPasswordValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('otp').isLength({ min: 4, max: 8 }).withMessage('Invalid OTP code'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long'),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long'),
];
