import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/prisma.ts';
import { JWTPayload } from '../../types/auth.ts';
import { ApiResponse } from '../../types/api.ts';

export const deleteApiKey = async (req: Request, res: Response): Promise<void> => {
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
        message: 'API key not found or you do not have permission to delete it'
      });
      return;
    }

    await prisma.apiKey.delete({
      where: { id: keyId }
    });

    res.status(200).json({
      success: true,
      message: 'API key deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
