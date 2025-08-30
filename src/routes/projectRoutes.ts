import { Router } from 'express';
import { projectController } from '../controllers/projectController/index.ts';
import { validationUtils } from '../utils/validation.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = Router();

// Use flexible authentication (supports both JWT and API keys)
router.use(authMiddleware.authenticateFlexible);

/**
 * @route   GET /api/projects
 * @desc    Get all projects for the authenticated user's organization
 * @access  Private (All authenticated users in the organization or valid API key)
 */
router.get('/', projectController.getProjects);

/**
 * @route   GET /api/projects/:projectId
 * @desc    Get a specific project by ID (only if it belongs to user's organization)
 * @access  Private (All authenticated users in the organization or valid API key)
 */
router.get('/:projectId', validationUtils.validateProjectIdParam(), projectController.getProjectById);

/**
 * @route   POST /api/projects
 * @desc    Create a new project in the authenticated user's organization
 * @access  Private (Admin and Manager roles only, or valid API key)
 * @body    { name }
 */
router.post(
  '/', 
  validationUtils.validateCreateProject(), 
  projectController.createProject
);

/**
 * @route   PUT /api/projects/:projectId
 * @desc    Update a project (only if it belongs to user's organization)
 * @access  Private (Admin and Manager roles only, or valid API key)
 * @body    { name? }
 */
router.put(
  '/:projectId',
  validationUtils.validateUpdateProject(),
  projectController.updateProject
);

/**
 * @route   DELETE /api/projects/:projectId
 * @desc    Delete a project (only if it belongs to user's organization)
 * @access  Private (Admin and Manager roles only, or valid API key)
 */
router.delete(
  '/:projectId',
  validationUtils.validateProjectIdParam(),
  projectController.deleteProject
);

export default router;
