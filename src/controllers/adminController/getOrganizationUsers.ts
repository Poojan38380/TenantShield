import { Request, Response } from 'express';
import prisma from '../../config/prisma.js';
import { JWTPayload } from '../../types/auth.js';
import { TenantContextRequest } from '../../middleware/tenant.js';
import { ApiResponse } from '../../types/api.js';

export const getOrganizationUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const admin: JWTPayload = (req as any).user;
    const { tenantId } = req as TenantContextRequest;

    // Get all users in the admin's organization
    const users = await prisma.user.findMany({
      where: {
        organizationId: tenantId!,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { role: 'asc' }, // ADMIN, MANAGER, EMPLOYEE
        { createdAt: 'asc' },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Organization users retrieved successfully',
      data: {
        users,
        total: users.length,
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Error in getOrganizationUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving organization users',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    } as ApiResponse);
  }
};


