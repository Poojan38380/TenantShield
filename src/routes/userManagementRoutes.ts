import { Router } from 'express';
import { body } from 'express-validator';
import { OrgRole } from '@prisma/client';
import { adminController } from '../controllers/adminController/index.ts';
import { authMiddleware } from '../middleware/auth.ts';
import { validationUtils } from '../utils/validation.ts';

const router = Router();

// Require authentication and admin role
router.use(authMiddleware.authenticate);
router.use(authMiddleware.adminOnly);

/**
 * @route   GET /api/manage/users
 * @desc    Get all users in the admin's organization
 * @access  Admin only
 */
router.get('/users', adminController.getOrganizationUsers);

/**
 * @route   PATCH /api/manage/users/:userId/role
 * @desc    Change a user's role within the organization
 * @access  Admin only
 * @body    { newRole: OrgRole }
 */
router.patch('/users/:userId/role', 
  [
    body('newRole') 
      .isIn([OrgRole.MANAGER, OrgRole.EMPLOYEE])
      .withMessage('newRole must be one of: MANAGER, EMPLOYEE'),
  ],
  (req: any, res: any) => {
    // Add userId from params to body for the controller
    req.body.userId = req.params.userId;
    adminController.changeUserRole(req, res);
  }
);

/**
 * @route   DELETE /api/manage/users/:userId
 * @desc    Delete a user from the organization
 * @access  Admin only
 */
router.delete(
  '/users/:userId',
  validationUtils.validateUserIdParam(),
  adminController.deleteUser
);

export default router;

