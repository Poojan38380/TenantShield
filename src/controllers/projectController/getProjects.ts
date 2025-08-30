import { Request, Response } from 'express';
import prisma from '../../config/prisma.js';
import { JWTPayload, ApiKeyPayload } from '../../types/auth.js';
import { ApiResponse } from '../../types/api.js';

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const user: JWTPayload = (req as any).user;
    const apiKey: ApiKeyPayload = (req as any).apiKey;
    
    // Get organization ID from either JWT user or API key
    const organizationId = user?.organizationId || apiKey?.organizationId;
    
    if (!organizationId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      } as ApiResponse);
      return;
    }

    const projects = await prisma.project.findMany({
      where: {
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Projects retrieved successfully',
      data: {
        projects,
        count: projects.length,
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Error in getProjects:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching projects',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    } as ApiResponse);
  }
};
