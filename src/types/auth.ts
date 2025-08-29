import { OrgRole } from '@prisma/client';

// JWT Payload interface
export interface JWTPayload {
  userId: string;
  role: OrgRole;
  organizationId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Extended Request interface for authenticated routes
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// Registration request body
export interface RegisterRequest {
  email: string;
  password: string;
  organizationName: string;
}

// Login request body
export interface LoginRequest {
  email: string;
  password: string;
}

// Authentication response
export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      role: OrgRole;
      organization: {
        id: string;
        name: string;
        slug: string;
      };
    };
  };
}

// User with organization info
export interface UserWithOrganization {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  memberships: Array<{
    id: string;
    role: OrgRole;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  organizationsOwned: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}
