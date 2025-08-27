import type { 
  User, 
  Tenant, 
  TenantMember, 
  ApiKey, 
  AuditLog,
  Prisma 
} from '../generated/prisma';

// Enhanced types for multi-tenant operations
export type UserWithTenants = User & {
  tenantMemberships: (TenantMember & {
    tenant: Tenant;
  })[];
  createdTenants: Tenant[];
};

export type TenantWithMembers = Tenant & {
  members: (TenantMember & {
    user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
  })[];
  creator: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
};

export type ApiKeyWithRelations = ApiKey & {
  user: Pick<User, 'id' | 'email'>;
  tenant: Pick<Tenant, 'id' | 'name' | 'slug'>;
};

// Tenant context for middleware
export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
  permissions: string[];
}

// Database operation types
export type CreateUserInput = Prisma.UserCreateInput;
export type UpdateUserInput = Prisma.UserUpdateInput;
export type CreateTenantInput = Prisma.TenantCreateInput;
export type UpdateTenantInput = Prisma.TenantUpdateInput;

// Query options for pagination and filtering
export interface QueryOptions {
  page?: number;
  limit?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  where?: Record<string, any>;
}

// Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Audit log context
export interface AuditContext {
  action: string;
  resource: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
  tenantId?: string;
}

// Role permissions mapping
export const TENANT_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin', 
  MEMBER: 'member',
  VIEWER: 'viewer'
} as const;

export type TenantRole = typeof TENANT_ROLES[keyof typeof TENANT_ROLES];

export const API_PERMISSIONS = {
  READ: 'read',
  WRITE: 'write', 
  ADMIN: 'admin'
} as const;

export type ApiPermission = typeof API_PERMISSIONS[keyof typeof API_PERMISSIONS];

// Database transaction type
export type DatabaseTransaction = Prisma.TransactionClient;
