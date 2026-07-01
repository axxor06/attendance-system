import express from 'express';
import * as controller from '../controllers/periodTemplateController.js';
import * as v from '../validators/periodTemplateValidators.js';
import { validate } from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);

router.get('/', controller.getActivePeriodTemplates);
router.get('/:day', controller.getPeriodTemplateByDay);

router.use(authorize(ROLES.HOD));
router.post('/', v.upsertPeriodTemplateValidator, validate, controller.upsertPeriodTemplate);
router.patch('/:id/deactivate', controller.deactivatePeriodTemplate);

export default router;
