import { Request, Response } from 'express';
import prisma from '../../config/prisma.ts';
import { maskApiKey } from '../../utils/apiKey.ts';
import { JWTPayload, ApiKeyResponse } from '../../types/auth.ts';

export const getApiKeys = async (req: Request, res: Response): Promise<void> => {
  try {
    const user: JWTPayload = (req as any).user;

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedKeys: ApiKeyResponse[] = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      keyHash: maskApiKey(key.keyHash),
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
      lastUsedAt: key.lastUsedAt || undefined,
      expiresAt: key.expiresAt || undefined,
      isActive: key.isActive,
      createdBy: key.createdBy,
    }));

    res.status(200).json({
      success: true,
      message: 'API keys retrieved successfully',
      data: formattedKeys
    });

  } catch (error) {
    console.error('Error retrieving API keys:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
