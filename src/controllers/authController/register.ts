import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { OrgRole } from '@prisma/client';
import prisma from '../../config/prisma.js';
import { generateToken } from '../../config/jwt.js';
import { validationUtils } from '../../utils/validation.js';
import { AuthResponse, RegisterRequest } from '../../types/auth.js';
import { ApiResponse } from '../../types/api.js';
import { passwordUtils } from '../../utils/password.js';
import { logAudit } from '../../services/audit.js';

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
  
      const { email, password, organizationName, newOrg }: RegisterRequest = req.body;
  
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

      const existingOrg = await prisma.organization.findUnique({
        where: { slug: organizationSlug },
      });

      let isNewOrganization = Boolean(newOrg);

      // If user explicitly wants to create a new organization but name exists
      if (isNewOrganization && existingOrg) {
        await logAudit(req, {
          action: 'ORGANIZATION_NAME_CONFLICT',
          success: false,
          targetType: 'Organization',
          targetId: existingOrg.id,
          metadata: { name: organizationName, slug: organizationSlug },
        });
        res.status(409).json({
          success: false,
          message: 'Organization name already exists. Please choose a different name.',
        } as ApiResponse);
        return;
      }

      // If user is joining an existing org but it doesn't exist
      if (!isNewOrganization && !existingOrg) {
        await logAudit(req, {
          action: 'ORGANIZATION_NOT_FOUND_FOR_JOIN',
          success: false,
          targetType: 'Organization',
          targetId: 'unknown',
          metadata: { name: organizationName, slug: organizationSlug },
        });
        res.status(404).json({
          success: false,
          message: 'Organization does not exist. Pass newOrg=true to create it.',
        } as ApiResponse);
        return;
      }

      const result = await prisma.$transaction(async (tx) => {
        if (isNewOrganization) {
          let organization = await tx.organization.create({
            data: {
              name: organizationName,
              slug: organizationSlug,
              ownerId: '',
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
              organizationId: existingOrg!.id,
              role: OrgRole.EMPLOYEE,
            },
          });

          return { user: newUser, organization: existingOrg! };
        }
      });
  
      // Generate JWT token
      const token = generateToken({
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
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
        metadata: { email: result.user.email, role: result.user.role, isNewOrganization },
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
            role: result.user.role,
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
  