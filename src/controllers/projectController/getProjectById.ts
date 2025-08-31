import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/prisma.js';
import { JWTPayload, ApiKeyPayload } from '../../types/auth.js';
import { TenantContextRequest } from '../../middleware/tenant.js';
import { ApiResponse } from '../../types/api.js';

export const getProjectById = async (req: Request, res: Response): Promise<void> => {
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
    const apiKey: ApiKeyPayload = (req as any).apiKey;
    const { tenantId } = req as TenantContextRequest;
    const { projectId } = req.params;

    const organizationId = tenantId;
    
    if (!organizationId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      } as ApiResponse);
      return;
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: organizationId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found or you do not have access to this project',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Project retrieved successfully',
      data: {
        project,
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Error in getProjectById:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching project',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    } as ApiResponse);
  }
};
