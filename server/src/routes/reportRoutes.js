import express from 'express';
import * as controller from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);

router.get(
  '/subject/:subjectId',
  authorize(ROLES.HOD, ROLES.FACULTY),
  controller.exportSubjectReport
);
router.get(
  '/student/:studentId?',
  authorize(ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT),
  controller.exportStudentReport
);
router.get(
  '/class/:classId/monthly',
  authorize(ROLES.HOD, ROLES.FACULTY),
  controller.exportClassMonthlyReport
);

export default router;
