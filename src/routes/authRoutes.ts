import { Router } from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { validateRegistration, validateLogin } from '../utils/validation.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with organization
 * @access  Public
 * @body    { email, password, organizationName }
 */
router.post('/register', validateRegistration(), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', validateLogin(), login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Public
 */
router.post('/logout', logout);

export default router;
