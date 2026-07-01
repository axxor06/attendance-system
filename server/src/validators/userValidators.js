import { body } from 'express-validator';
import { ROLE_LIST } from '../config/constants.js';

export const createUserValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('role').isIn(ROLE_LIST).withMessage('Invalid role'),
  body('registerNumber').optional().trim(),
  body('employeeId').optional().trim(),
  body('department').optional({ checkFalsy: true }).isMongoId(),
body('classId').optional({ checkFalsy: true }).isMongoId(),
  body('password').optional().isLength({ min: 8 }),
];

export const updateUserValidator = [
  body('name').optional().trim().notEmpty(),
  body('phone').optional().trim(),
 body('department').optional({ nullable: true, checkFalsy: true }).isMongoId(),
body('classId').optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body('isActive').optional().isBoolean(),
];

export const resetUserPasswordValidator = [
  body('newPassword').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];
