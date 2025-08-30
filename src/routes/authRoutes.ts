import { Router } from 'express';
import { authController } from '../controllers/authController/index.ts';
import { validationUtils } from '../utils/validation.ts';
import { authMiddleware } from '../middleware/auth.ts';
import { loginLimiter, registerLimiter } from '../config/security.ts';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with organization
 * @access  Public
 * @body    { email, password, organizationName, newOrg?: boolean }
 */
router.post('/register', registerLimiter, validationUtils.validateRegistration(), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', loginLimiter, validationUtils.validateLogin(), authController.login);

//Only logged users can send request to logout.
router.use(authMiddleware.authenticate);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Public
 */
router.post('/logout', authController.logout);

export default router;
