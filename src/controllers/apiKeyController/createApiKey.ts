import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/prisma.js';
import { generateApiKey, hashApiKey, maskApiKey } from '../../utils/apiKey.js';
import { JWTPayload, CreateApiKeyRequest, CreateApiKeyResponse } from '../../types/auth.js';
import { ApiResponse } from '../../types/api.js';
import { logAudit } from '../../services/audit.js';

export const createApiKey = async (req: Request, res: Response): Promise<void> => {
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
    const { name, expiresInHours }: CreateApiKeyRequest = req.body;

    // Calculate expiration date from hours
    let expirationDate: Date | null = null;
    if (expiresInHours) {
      expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + expiresInHours);
    }

    const existingKey = await prisma.apiKey.findFirst({
      where: {
        organizationId: user.organizationId,
        name: name.trim(),
        isActive: true
      }
    });

    if (existingKey) {
      res.status(409).json({
        success: false,
        message: 'An API key with this name already exists in your organization'
      });
      return;
    }

    // Generate key bound to created record id to allow O(1) verification later
    const stub = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        keyHash: 'placeholder',
        organizationId: user.organizationId,
        createdById: user.userId,
        expiresAt: expirationDate,
      },
      include: {
        createdBy: { select: { id: true, email: true } }
      }
    });

    const apiKey = generateApiKey(stub.id);
    const keyHash = await hashApiKey(apiKey);

    const newApiKey = await prisma.apiKey.update({
      where: { id: stub.id },
      data: { keyHash },
      include: {
        createdBy: { select: { id: true, email: true } }
      }
    });

    const response: CreateApiKeyResponse = {
      id: newApiKey.id,
      name: newApiKey.name,
      keyHash: maskApiKey(apiKey),
      apiKey: apiKey, // Full key - only shown on creation
      createdAt: newApiKey.createdAt,
      updatedAt: newApiKey.updatedAt,
      lastUsedAt: newApiKey.lastUsedAt || undefined,
      expiresAt: newApiKey.expiresAt || undefined,
      isActive: newApiKey.isActive,
      createdBy: newApiKey.createdBy,
    };

    await logAudit(req, {
      action: 'API_KEY_CREATED',
      success: true,
      targetType: 'ApiKey',
      targetId: newApiKey.id,
      metadata: { name: newApiKey.name, expiresAt: newApiKey.expiresAt },
      organizationId: user.organizationId,
      actorType: 'USER',
      actorId: user.userId,
    });

    res.status(201).json({
      success: true,
      message: 'API key created successfully',
      data: response
    });

  } catch (error) {
    console.error('Error in createApiKey function in apiKeyController.ts:', error);
    await logAudit(req, {
      action: 'API_KEY_CREATE_FAILED',
      success: false,
      targetType: 'ApiKey',
      targetId: 'unknown',
      metadata: { error: String(error) },
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
