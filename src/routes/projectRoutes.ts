import { Router } from 'express';
import { projectController } from '../controllers/projectController/index.ts';
import { validationUtils } from '../utils/validation.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = Router();

router.use(authMiddleware.authenticate);

/**
 * @route   GET /api/projects
 * @desc    Get all projects for the authenticated user's organization
 * @access  Private (All authenticated users in the organization)
 */
router.get('/', projectController.getProjects);

/**
 * @route   GET /api/projects/:projectId
 * @desc    Get a specific project by ID (only if it belongs to user's organization)
 * @access  Private (All authenticated users in the organization)
 */
router.get('/:projectId', validationUtils.validateProjectIdParam(), projectController.getProjectById);

/**
 * @route   POST /api/projects
 * @desc    Create a new project in the authenticated user's organization
 * @access  Private (Admin and Manager only)
 * @body    { name }
 */
router.post(
  '/', 
  authMiddleware.managerOrAdmin,
  validationUtils.validateCreateProject(), 
  projectController.createProject
);

/**
 * @route   PUT /api/projects/:projectId
 * @desc    Update a project (only if it belongs to user's organization)
 * @access  Private (Admin and Manager only)
 * @body    { name? }
 */
router.put(
  '/:projectId',
  authMiddleware.managerOrAdmin,
  validationUtils.validateUpdateProject(),
  projectController.updateProject
);

/**
 * @route   DELETE /api/projects/:projectId
 * @desc    Delete a project (only if it belongs to user's organization)
 * @access  Private (Admin and Manager only)
 */
router.delete(
  '/:projectId',
  authMiddleware.managerOrAdmin,
  validationUtils.validateProjectIdParam(),
  projectController.deleteProject
);

export default router;
