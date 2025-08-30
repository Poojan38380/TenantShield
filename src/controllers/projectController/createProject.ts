import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/prisma.ts';
import { JWTPayload, ApiKeyPayload } from '../../types/auth.ts';
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

    // Handle both JWT and API key authentication
    const user: JWTPayload = (req as any).user;
    const apiKey: ApiKeyPayload = (req as any).apiKey;
    const { name }: CreateProjectRequest = req.body;

    // Get organization ID and creator ID from either JWT user or API key
    const organizationId = user?.organizationId || apiKey?.organizationId;
    const createdById = user?.userId || apiKey?.createdById;
    
    if (!organizationId || !createdById) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      } as ApiResponse);
      return;
    }

    const existingProject = await prisma.project.findUnique({
      where: {
        organizationId_name: {
          organizationId: organizationId,
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
        organizationId: organizationId,
        createdById: createdById,
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
