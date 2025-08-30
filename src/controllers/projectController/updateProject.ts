import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/prisma.ts';
import { JWTPayload } from '../../types/auth.ts';
import { ApiResponse } from '../../types/api.ts';

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
    const { projectId } = req.params;
    const { name }: UpdateProjectRequest = req.body;

    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: user.organizationId,
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
            organizationId: user.organizationId,
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

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: updatedProject,
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Error in updateProject:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating project',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    } as ApiResponse);
  }
};
