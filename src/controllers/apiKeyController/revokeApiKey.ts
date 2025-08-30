import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/prisma.js';
import { JWTPayload } from '../../types/auth.js';
import { ApiResponse } from '../../types/api.js';
import { logAudit } from '../../services/audit.js';

export const revokeApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.type === 'field' ? err.path : 'unknown',
          message: err.msg,
        })),
      } as ApiResponse);
      return;
    }

    const user: JWTPayload = (req as any).user;
    const { keyId } = req.params;

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        organizationId: user.organizationId,
      }
    });

    if (!apiKey) {
      res.status(404).json({
        success: false,
        message: 'API key not found or you do not have permission to revoke it'
      });
      return;
    }

    if (!apiKey.isActive) {
      res.status(400).json({
        success: false,
        message: 'API key is already revoked'
      });
      return;
    }

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    });

    await logAudit(req, {
      action: 'API_KEY_REVOKED',
      success: true,
      targetType: 'ApiKey',
      targetId: keyId,
      organizationId: user.organizationId,
      actorType: 'USER',
      actorId: user.userId,
    });

    res.status(200).json({
      success: true,
      message: 'API key revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking API key:', error);
    await logAudit(req, {
      action: 'API_KEY_REVOKE_FAILED',
      success: false,
      targetType: 'ApiKey',
      targetId: (req.params as any).keyId,
      metadata: { error: String(error) },
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
