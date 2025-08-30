import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/prisma.js';
import { generateApiKey, hashApiKey, maskApiKey } from '../../utils/apiKey.js';
import { JWTPayload, CreateApiKeyResponse } from '../../types/auth.js';
import { ApiResponse } from '../../types/api.js';
import { logAudit } from '../../services/audit.js';

export const rotateApiKey = async (req: Request, res: Response): Promise<void> => {
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

    const existingApiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        organizationId: user.organizationId,
        isActive: true
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
          }
        }
      }
    });

    if (!existingApiKey) {
      res.status(404).json({
        success: false,
        message: 'Active API key not found or you do not have permission to rotate it'
      });
      return;
    }

    const newApiKey = generateApiKey();
    const newKeyHash = await hashApiKey(newApiKey);

    const updatedApiKey = await prisma.apiKey.update({
      where: { id: keyId },
      data: { 
        keyHash: newKeyHash,
        lastUsedAt: null,
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
          }
        }
      }
    });

    const response: CreateApiKeyResponse = {
      id: updatedApiKey.id,
      name: updatedApiKey.name,
      keyHash: maskApiKey(newApiKey),
      apiKey: newApiKey,
      createdAt: updatedApiKey.createdAt,
      updatedAt: updatedApiKey.updatedAt,
      lastUsedAt: updatedApiKey.lastUsedAt || undefined,
      expiresAt: updatedApiKey.expiresAt || undefined,
      isActive: updatedApiKey.isActive,
      createdBy: updatedApiKey.createdBy,
    };

    await logAudit(req, {
      action: 'API_KEY_ROTATED',
      success: true,
      targetType: 'ApiKey',
      targetId: updatedApiKey.id,
      organizationId: user.organizationId,
      actorType: 'USER',
      actorId: user.userId,
    });

    res.status(200).json({
      success: true,
      message: 'API key rotated successfully. Please update your applications with the new key.',
      data: response
    });

  } catch (error) {
    console.error('Error rotating API key:', error);
    await logAudit(req, {
      action: 'API_KEY_ROTATE_FAILED',
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
