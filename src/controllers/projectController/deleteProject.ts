import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/prisma.ts';
import { JWTPayload } from '../../types/auth.ts';
import { ApiResponse } from '../../types/api.ts';

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

    const user: JWTPayload = (req as any).user;
    const { projectId } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: user.organizationId,
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
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting project',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    } as ApiResponse);
  }
};
