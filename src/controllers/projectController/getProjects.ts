import { Request, Response } from 'express';
import prisma from '../../config/prisma.ts';
import { JWTPayload } from '../../types/auth.ts';
import { ApiResponse } from '../../types/api.ts';

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const user: JWTPayload = (req as any).user;

    const projects = await prisma.project.findMany({
      where: {
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
