import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { OrgRole } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { JWTPayload } from '../../types/auth.js';
import { TenantContextRequest } from '../../middleware/tenant.js';
import { ApiResponse } from '../../types/api.js';
import { logAudit } from '../../services/audit.js';

interface ChangeUserRoleRequest {
  userId: string;
  newRole: OrgRole;
}

export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
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

    const admin: JWTPayload = (req as any).user;
    const { tenantId } = req as TenantContextRequest;
    const { userId, newRole }: ChangeUserRoleRequest = req.body;

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      } as ApiResponse);
      return;
    }
    if (userId === admin.userId) {
      res.status(400).json({
        success: false,
        message: 'You cannot change your own role',
      } as ApiResponse);
      return;
    }

    // Ensure the target user is in the same organization as the admin
    if (targetUser.organizationId !== tenantId) {
      res.status(403).json({
        success: false,
        message: 'Cannot modify users from other organizations',
      } as ApiResponse);
      return;
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await logAudit(req, {
      action: 'ADMIN_CHANGE_ROLE',
      success: true,
      targetType: 'User',
      targetId: userId,
      organizationId: tenantId!,
      actorType: 'USER',
      actorId: admin.userId,
      metadata: { newRole },
    });

    res.status(200).json({
      success: true,
      message: `User role successfully changed to ${newRole}`,
      data: {
        user: updatedUser,
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Error in changeUserRole:', error);
    await logAudit(req, {
      action: 'ADMIN_CHANGE_ROLE_FAILED',
      success: false,
      targetType: 'User',
      targetId: (req.body as any).userId,
      metadata: { error: String(error) },
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error while changing user role',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    } as ApiResponse);
  }
};

