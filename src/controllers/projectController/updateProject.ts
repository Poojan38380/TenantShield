import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/prisma.js';
import { JWTPayload, ApiKeyPayload } from '../../types/auth.js';
import { TenantContextRequest } from '../../middleware/tenant.js';
import { ApiResponse } from '../../types/api.js';
import { logAudit } from '../../services/audit.js';

interface UpdateProjectRequest {
  name?: string;
}

export const updateProject = async (req: Request, res: Response): Promise<void> => {
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
    const { name }: UpdateProjectRequest = req.body;

    const organizationId = tenantId;
    
    if (!organizationId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      } as ApiResponse);
      return;
    }

    if (user) {
      // check user role
      if (user.role === 'EMPLOYEE') {
        res.status(403).json({
          success: false,
          message: 'Only Admins and Managers can update projects',
        } as ApiResponse);
        return;
      }
    } else if (apiKey) {
      // verify the creator exists
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

    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: organizationId,
      },
    });

    if (!existingProject) {
      res.status(404).json({
        success: false,
        message: 'Project not found or you do not have access to this project',
      } as ApiResponse);
      return;
    }

    if (name && name.trim() !== existingProject.name) {
      const conflictingProject = await prisma.project.findUnique({
        where: {
          organizationId_name: {
            organizationId: organizationId,
            name: name.trim(),
          },
        },
      });

      if (conflictingProject && conflictingProject.id !== projectId) {
        res.status(409).json({
          success: false,
          message: 'A project with this name already exists in your organization',
        } as ApiResponse);
        return;
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name && { name: name.trim() }),
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

    await logAudit(req, {
      action: 'PROJECT_UPDATED',
      success: true,
      targetType: 'Project',
      targetId: updatedProject.id,
      organizationId: organizationId,
      actorType: user ? 'USER' : 'API_KEY',
      actorId: (user?.userId || apiKey?.keyId)!,
      metadata: { changed: { name } },
    });

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: updatedProject,
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Error in updateProject in projectController.ts:', error);
    await logAudit(req, {
      action: 'PROJECT_UPDATE_FAILED',
      success: false,
      targetType: 'Project',
      targetId: (req.params as any).projectId,
      metadata: { error: String(error) },
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating project',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    } as ApiResponse);
  }
};
