import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/prisma.ts';
import { generateApiKey, hashApiKey, maskApiKey } from '../../utils/apiKey.ts';
import { JWTPayload, CreateApiKeyRequest, CreateApiKeyResponse } from '../../types/auth.ts';
import { ApiResponse } from '../../types/api.ts';

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

    const apiKey = generateApiKey();
    const keyHash = await hashApiKey(apiKey);

    const newApiKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        keyHash,
        organizationId: user.organizationId,
        createdById: user.userId,
        expiresAt: expirationDate,
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

    res.status(201).json({
      success: true,
      message: 'API key created successfully',
      data: response
    });

  } catch (error) {
    console.error('Error in createApiKey function in apiKeyController.ts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
