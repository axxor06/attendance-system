import express from 'express';
import * as controller from '../controllers/attendanceController.js';
import * as v from '../validators/attendanceValidators.js';
import { validate } from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);

// Faculty + HOD: marking and session management
router.post(
  '/mark',
  authorize(ROLES.FACULTY, ROLES.HOD),
  v.markAttendanceValidator,
  validate,
  controller.markAttendance
);
router.get(
  '/session-roster',
  authorize(ROLES.FACULTY, ROLES.HOD),
  v.getSessionRosterValidator,
  validate,
  controller.getSessionRoster
);
router.patch(
  '/:id',
  authorize(ROLES.FACULTY, ROLES.HOD),
  v.editAttendanceValidator,
  validate,
  controller.editAttendanceEntry
);
router.get(
  '/pending',
  authorize(ROLES.FACULTY),
  controller.getPendingAttendance
);

// All roles (filtered internally by role in the controller)
router.get('/history', controller.getAttendanceHistory);

export default router;
