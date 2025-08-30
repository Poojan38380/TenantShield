import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/prisma.ts';
import { JWTPayload } from '../../types/auth.ts';
import { ApiResponse } from '../../types/api.ts';

interface CreateProjectRequest {
  name: string;
}

export const createProject = async (req: Request, res: Response): Promise<void> => {
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
    const { name }: CreateProjectRequest = req.body;

    const existingProject = await prisma.project.findUnique({
      where: {
        organizationId_name: {
          organizationId: user.organizationId,
          name: name.trim(),
        },
      },
    });

    if (existingProject) {
      res.status(409).json({
        success: false,
        message: 'A project with this name already exists in your organization',
      } as ApiResponse);
      return;
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        organizationId: user.organizationId,
        createdById: user.userId,
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

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project,
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Error in createProject:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating project',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    } as ApiResponse);
  }
};
