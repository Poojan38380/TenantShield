import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/prisma.js';
import { JWTPayload, ApiKeyPayload } from '../../types/auth.js';
import { ApiResponse } from '../../types/api.js';
import { logAudit } from '../../services/audit.js';

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
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

    // Handle both JWT and API key authentication
    const user: JWTPayload = (req as any).user;
    const apiKey: ApiKeyPayload = (req as any).apiKey;
    const { projectId } = req.params;

    // Get organization ID from either JWT user or API key
    const organizationId = user?.organizationId || apiKey?.organizationId;
    
    if (!organizationId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      } as ApiResponse);
      return;
    }

    // Role-based access control
    if (user) {
      // JWT authentication - check user role
      if (user.role === 'EMPLOYEE') {
        res.status(403).json({
          success: false,
          message: 'Only Admins and Managers can delete projects',
        } as ApiResponse);
        return;
      }
    } else if (apiKey) {
      // API key authentication - verify the creator exists
      const apiKeyCreator = await prisma.user.findFirst({
        where: {
          id: apiKey.createdById,
          organizationId: organizationId,
        }
      });

      if (!apiKeyCreator) {
        res.status(401).json({
          success: false,
          message: 'API key creator no longer exists or does not belong to the organization',
        } as ApiResponse);
        return;
      }
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
      },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found or you do not have access to this project',
      } as ApiResponse);
      return;
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    await logAudit(req, {
      action: 'PROJECT_DELETED',
      success: true,
      targetType: 'Project',
      targetId: projectId,
      organizationId: organizationId,
      actorType: user ? 'USER' : 'API_KEY',
      actorId: (user?.userId || apiKey?.keyId)!,
    });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      data: {
        deletedProject: {
          id: project.id,
          name: project.name,
          organizationId: project.organizationId,
        },
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Error in deleteProject:', error);
    await logAudit(req, {
      action: 'PROJECT_DELETE_FAILED',
      success: false,
      targetType: 'Project',
      targetId: (req.params as any).projectId,
      metadata: { error: String(error) },
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting project',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    } as ApiResponse);
  }
};
