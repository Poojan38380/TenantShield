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
  newOrg?: boolean;
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
  organizationId: string;
  role: OrgRole;
  organization: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
  };
}

// API Key payload for authenticated API requests
export interface ApiKeyPayload {
  keyId: string;
  organizationId: string;
  organizationName: string;
  createdById: string;
  keyName: string;
}

// Extended Request interface for API key authenticated routes
export interface ApiKeyAuthenticatedRequest extends Request {
  apiKey?: ApiKeyPayload;
}

// API Key creation request
export interface CreateApiKeyRequest {
  name: string;
  expiresInHours?: number; // Number of hours from now, optional
}

// API Key response
export interface ApiKeyResponse {
  id: string;
  name: string;
  keyHash: string; // For display purposes only (masked)
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdBy: {
    id: string;
    email: string;
  };
}

// API Key creation response (includes the actual key - only shown once)
export interface CreateApiKeyResponse extends ApiKeyResponse {
  apiKey: string; // The actual key - only returned on creation
}