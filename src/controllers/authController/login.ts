import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { OrgRole } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { generateToken } from '../../config/jwt.js';
import { AuthResponse, LoginRequest } from '../../types/auth.js';
import { ApiResponse } from '../../types/api.js';
import { passwordUtils } from '../../utils/password.js';
import { logAudit } from '../../services/audit.js';


export const login = async (req: Request, res: Response): Promise<void> => {
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
  
      const { email, password }: LoginRequest = req.body;
  
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          organization: true,
        },
      });
  
      if (!user) {
        await logAudit(req, {
          action: 'AUTH_LOGIN_FAILED',
          success: false,
          targetType: 'User',
          targetId: 'unknown',
          metadata: { email },
        });
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        } as ApiResponse);
        return;
      }
  
      const isPasswordValid = await passwordUtils.comparePassword(password, user.password);
      if (!isPasswordValid) {
        await logAudit(req, {
          action: 'AUTH_LOGIN_FAILED',
          success: false,
          targetType: 'User',
          targetId: user.id,
          metadata: { email },
        });
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        } as ApiResponse);
        return;
      }
  
      const userRole: OrgRole = user.role;
      const organization = user.organization;
  
      if (!organization) {
        res.status(400).json({
          success: false,
          message: 'User is not associated with any organization',
        } as ApiResponse);
        return;
      }
  
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: userRole,
        organizationId: organization.id,
      });
  
      await logAudit(req, {
        action: 'AUTH_LOGIN_SUCCESS',
        success: true,
        targetType: 'User',
        targetId: user.id,
        organizationId: organization.id,
        metadata: { email },
        actorType: 'USER',
        actorId: user.id,
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            role: userRole,
            organization: {
              id: organization.id,
              name: organization.name,
              slug: organization.slug,
            },
          },
        },
      } as AuthResponse);
  
    } catch (error) {
      console.error('Error in login function in authController.ts:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      } as ApiResponse);
    }
  };
  