import { Router } from 'express';
import { apiKeyController } from '../controllers/apiKeyController/index.ts';
import { authMiddleware } from '../middleware/auth.ts';
import { validationUtils } from '../utils/validation.ts';

const router = Router();
router.use(authMiddleware.authenticate);
router.use(authMiddleware.adminOnly);
/**
 * @route   POST /api/manage-keys
 * @desc    Create a new API key for the organization
 * @access  Private (JWT required, Admin only)
 */
router.post('/', 
  validationUtils.validateCreateApiKey(),
  apiKeyController.createApiKey
);

/**
 * @route   GET /api/manage-keys
 * @desc    Get all API keys for the organization
 * @access  Private (JWT required, Admin only)
 */
router.get('/', 
  apiKeyController.getApiKeys
);

/**
 * @route   PUT /api/manage-keys/:keyId/revoke
 * @desc    Revoke an API key (deactivate)
 * @access  Private (JWT required, Admin only)
 */
router.put('/:keyId/revoke',
  validationUtils.validateApiKeyIdParam(),
  apiKeyController.revokeApiKey
);

/**
 * @route   PUT /api/manage-keys/:keyId/rotate
 * @desc    Rotate an API key (generate new key)
 * @access  Private (JWT required, Admin only)
 */
router.put('/:keyId/rotate',
  validationUtils.validateApiKeyIdParam(),
  apiKeyController.rotateApiKey
);

/**
 * @route   DELETE /api/manage-keys/:keyId
 * @desc    Delete an API key permanently
 * @access  Private (JWT required, Admin only)
 */
router.delete('/:keyId',
  validationUtils.validateApiKeyIdParam(),
  apiKeyController.deleteApiKey
);

export default router;
