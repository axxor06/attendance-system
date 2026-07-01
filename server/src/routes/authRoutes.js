import express from 'express';
import * as authController from '../controllers/authController.js';
import * as v from '../validators/authValidators.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/register', authLimiter, v.registerStudentValidator, validate, authController.registerStudent);
router.post('/verify-email', authLimiter, v.verifyEmailValidator, validate, authController.verifyEmail);
router.post('/resend-otp', authLimiter, v.resendOtpValidator, validate, authController.resendOtp);
router.post('/login', authLimiter, v.loginValidator, validate, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', authLimiter, v.forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password', authLimiter, v.resetPasswordValidator, validate, authController.resetPassword);

router.use(protect);
router.get('/me', authController.getMe);
router.post('/change-password', v.changePasswordValidator, validate, authController.changePassword);

export default router;
