import { Router } from 'express';
import { authController } from '../controllers/authController/index.js';
import { validationUtils } from '../utils/validation.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with organization
 * @access  Public
 * @body    { email, password, organizationName }
 */
router.post('/register', validationUtils.validateRegistration(), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', validationUtils.validateLogin(), authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Public
 */
router.post('/logout', authController.logout);

export default router;
