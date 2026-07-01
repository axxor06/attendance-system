import express from 'express';
import * as controller from '../controllers/userController.js';
import * as v from '../validators/userValidators.js';
import { validate } from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.HOD));

router.post('/', v.createUserValidator, validate, controller.createUser);
router.get('/', controller.getUsers);
router.get('/:id', controller.getUserById);
router.patch('/:id', v.updateUserValidator, validate, controller.updateUser);
router.delete('/:id', controller.deleteUser);
router.post('/:id/reset-password', v.resetUserPasswordValidator, validate, controller.resetUserPassword);

export default router;
