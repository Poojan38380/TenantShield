import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { OrgRole } from '@prisma/client';
import prisma from '../../config/prisma.ts';
import { generateToken } from '../../config/jwt.ts';
import { validationUtils } from '../../utils/validation.ts';
import { AuthResponse, RegisterRequest } from '../../types/auth.ts';
import { ApiResponse } from '../../types/api.ts';
import { passwordUtils } from '../../utils/password.ts';
import { logAudit } from '../../services/audit.ts';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await logAudit(req, {
          action: 'USER_REGISTER_VALIDATION_FAILED',
          success: false,
          targetType: 'User',
          targetId: 'unknown',
          metadata: { errors: errors.array().slice(0, 5) },
        });
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
  
      const { email, password, organizationName }: RegisterRequest = req.body;
  
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
  
      if (existingUser) {
        await logAudit(req, {
          action: 'USER_REGISTER_CONFLICT',
          success: false,
          targetType: 'User',
          targetId: existingUser.id,
          metadata: { email },
        });
        res.status(409).json({
          success: false,
          message: 'User already exists with this email',
        } as ApiResponse);
        return;
      }
  
      const hashedPassword = await passwordUtils.hashPassword(password);
  
      const organizationSlug = validationUtils.createSlug(organizationName);
  
      let organization = await prisma.organization.findUnique({
        where: { slug: organizationSlug },
      });
  
      let userRole: OrgRole;
      let isNewOrganization = false;
  
      if (!organization) {
        userRole = OrgRole.ADMIN;
        isNewOrganization = true;
      } else {
        userRole = OrgRole.EMPLOYEE;
      }
  
      const result = await prisma.$transaction(async (tx) => {
        if (isNewOrganization) {
          organization = await tx.organization.create({
            data: {
              name: organizationName,
              slug: organizationSlug,
              ownerId: '', // Temporary
            },
          });
  
          const newUser = await tx.user.create({
            data: {
              email,
              password: hashedPassword,
              organizationId: organization.id,
              role: OrgRole.ADMIN,
            },
          });
  
          // Update organization with the real owner ID
          organization = await tx.organization.update({
            where: { id: organization.id },
            data: { ownerId: newUser.id },
          });
  
          return { user: newUser, organization };
        } else {
          const newUser = await tx.user.create({
            data: {
              email,
              password: hashedPassword,
              organizationId: organization!.id,
              role: OrgRole.EMPLOYEE,
            },
          });
  
          return { user: newUser, organization: organization! };
        }
      });
  
      // Generate JWT token
      const token = generateToken({
        userId: result.user.id,
        email: result.user.email,
        role: userRole,
        organizationId: result.organization.id,
      });
  
      await logAudit(req, {
        action: 'USER_REGISTER_SUCCESS',
        success: true,
        targetType: 'User',
        targetId: result.user.id,
        organizationId: result.organization.id,
        actorType: 'USER',
        actorId: result.user.id,
        metadata: { email: result.user.email, role: userRole, isNewOrganization },
      });

      if (isNewOrganization) {
        await logAudit(req, {
          action: 'ORGANIZATION_CREATED',
          success: true,
          targetType: 'Organization',
          targetId: result.organization.id,
          organizationId: result.organization.id,
          actorType: 'USER',
          actorId: result.user.id,
          metadata: { name: result.organization.name, slug: result.organization.slug },
        });
      }

      res.status(201).json({
        success: true,
        message: isNewOrganization
          ? 'User registered successfully and organization created'
          : 'User registered successfully and added to organization',
        data: {
          token,
          user: {
            id: result.user.id,
            email: result.user.email,
            role: userRole,
            organization: {
              id: result.organization.id,
              name: result.organization.name,
              slug: result.organization.slug,
            },
          },
        },
      } as AuthResponse);
  
    } catch (error) {
      console.error('Error in register function in authController.ts:', error);
      await logAudit(req, {
        action: 'USER_REGISTER_FAILED',
        success: false,
        targetType: 'User',
        targetId: 'unknown',
        metadata: { error: String(error) },
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      } as ApiResponse);
    }
  };
  