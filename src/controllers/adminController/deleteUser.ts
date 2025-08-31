import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/prisma.js';
import { JWTPayload } from '../../types/auth.js';
import { TenantContextRequest } from '../../middleware/tenant.js';
import { ApiResponse } from '../../types/api.js';
import { logAudit } from '../../services/audit.js';

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
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
    const { userId } = req.params;

    if (userId === admin.userId) {
      res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      } as ApiResponse);
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            ownerId: true,
          }
        }
      },
    });

    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      } as ApiResponse);
      return;
    }

    if (targetUser.organizationId !== tenantId) {
      res.status(403).json({
        success: false,
        message: 'Cannot delete users from other organizations',
      } as ApiResponse);
      return;
    }

    if (targetUser.organization.ownerId === userId) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete the organization owner. Transfer ownership first.',
      } as ApiResponse);
      return;
    }

    const deletedUserInfo = {
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      organizationId: targetUser.organizationId,
    };

    await prisma.user.delete({
      where: { id: userId },
    });

    await logAudit(req, {
      action: 'ADMIN_DELETE_USER',
      success: true,
      targetType: 'User',
      targetId: userId,
      organizationId: tenantId!,
      actorType: 'USER',
      actorId: admin.userId,
      metadata: { deletedUserEmail: deletedUserInfo.email },
    });

    res.status(200).json({
      success: true,
      message: 'User and their created projects deleted successfully',
      data: {
        deletedUser: deletedUserInfo,
      },
    } as ApiResponse);

  } catch (error) {
    console.error('Error in deleteUser:', error);
    await logAudit(req, {
      action: 'ADMIN_DELETE_USER_FAILED',
      success: false,
      targetType: 'User',
      targetId: (req.params as any).userId,
      metadata: { error: String(error) },
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting user',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    } as ApiResponse);
  }
};
