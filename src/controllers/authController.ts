import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { OrgRole } from '@prisma/client';
import prisma from '../config/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../config/jwt.js';
import { createSlug } from '../utils/validation.js';
import { AuthResponse, RegisterRequest, LoginRequest } from '../types/auth.js';
import { ApiResponse } from '../types/api.js';

/**
 * Register a new user with organization
 * If organization exists, add user as EMPLOYEE
 * If organization doesn't exist, create it and make user the ADMIN
 */
export const register = async (req: Request, res: Response): Promise<void> => {
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

    const { email, password, organizationName }: RegisterRequest = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User already exists with this email',
      } as ApiResponse);
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create organization slug
    const organizationSlug = createSlug(organizationName);

    // Check if organization exists
    let organization = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
    });

    let userRole: OrgRole;
    let isNewOrganization = false;

    if (!organization) {
      // Organization doesn't exist, user will be the admin/owner
      userRole = OrgRole.ADMIN;
      isNewOrganization = true;
    } else {
      // Organization exists, user will be an employee
      userRole = OrgRole.EMPLOYEE;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      if (isNewOrganization) {
        // Create new organization with user as owner
        organization = await tx.organization.create({
          data: {
            name: organizationName,
            slug: organizationSlug,
            ownerId: newUser.id,
          },
        });

        // Add user as admin member of the organization
        await tx.organizationMember.create({
          data: {
            userId: newUser.id,
            organizationId: organization.id,
            role: OrgRole.ADMIN,
          },
        });
      } else {
        // Add user as employee to existing organization
        await tx.organizationMember.create({
          data: {
            userId: newUser.id,
            organizationId: organization!.id,
            role: OrgRole.EMPLOYEE,
          },
        });
      }

      return { user: newUser, organization: organization! };
    });

    // Generate JWT token
    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
      role: userRole,
      organizationId: result.organization.id,
    });

    // Return success response
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
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    } as ApiResponse);
  }
};

/**
 * Login user and return JWT token
 */
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
        memberships: {
          include: {
            organization: true,
          },
          take: 1, // take the first membership
        },
        organizationsOwned: {
          take: 1, // take the first owned organization
        },
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      } as ApiResponse);
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      } as ApiResponse);
      return;
    }

    let userRole: OrgRole;
    let organization: { id: string; name: string; slug: string };

    if (user.organizationsOwned.length > 0) {
      // User owns an organization (is admin)
      userRole = OrgRole.ADMIN;
      organization = user.organizationsOwned[0];
    } else if (user.memberships.length > 0) {
      // User is a member of an organization
      userRole = user.memberships[0].role;
      organization = user.memberships[0].organization;
    } else {
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

/**
 * Logout user (client-side token removal)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please remove the token from client storage.',
  } as ApiResponse);
};

export default {
  register,
  login,
  logout,
};
