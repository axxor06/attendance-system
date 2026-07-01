import express from 'express';
import * as controller from '../controllers/semesterController.js';
import * as v from '../validators/semesterValidators.js';
import { validate } from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);

router.get('/', controller.getSemesters);
router.get('/:id', controller.getSemesterById);

router.use(authorize(ROLES.HOD));
router.post('/', v.createSemesterValidator, validate, controller.createSemester);
router.patch('/:id', v.updateSemesterValidator, validate, controller.updateSemester);
router.delete('/:id', controller.deleteSemester);

export default router;
