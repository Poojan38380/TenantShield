import { NextFunction, Request, Response } from 'express';
import { OrgRole } from '@prisma/client';
import { verifyToken } from '../config/jwt.ts';
import { JWTPayload, ApiKeyPayload } from '../types/auth.ts';
import prisma from '../config/prisma.ts';
import { verifyApiKey, isValidApiKeyFormat } from '../utils/apiKey.ts';
import { logAudit } from '../services/audit.ts';

// Extract Bearer token from Authorization header
const extractBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) return null;
  const trimmed = authorizationHeader.trim();
  if (!trimmed.toLowerCase().startsWith('bearer ')) return null;
  const token = trimmed.slice(7).trim();
  return token.length > 0 ? token : null;
};

// Extract API key from Authorization header
const extractApiKey = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) return null;
  const trimmed = authorizationHeader.trim();
  if (!trimmed.toLowerCase().startsWith('apikey ')) return null;
  const apiKey = trimmed.slice(7).trim();
  return apiKey.length > 0 ? apiKey : null;
};

// Ensures a valid JWT is present and attaches the decoded user to req
const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      logAudit(req, {
        action: 'AUTH_JWT_MISSING',
        success: false,
        targetType: 'Route',
        targetId: req.path,
        metadata: { authorization: req.headers.authorization ? 'present' : 'absent' },
      });
      res.status(401).json({ success: false, message: 'Please login to continue.' });
      return;
    }

    const decoded = verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch (error) {
    logAudit(req, {
      action: 'AUTH_JWT_INVALID',
      success: false,
      targetType: 'Route',
      targetId: req.path,
      metadata: { error: String(error) },
    });
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Factory to allow only the specified roles
const requireRoles = (...allowedRoles: OrgRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user: JWTPayload | undefined = (req as any).user;

    if (!user) {
      logAudit(req, {
        action: 'AUTH_ROLE_DENIED',
        success: false,
        targetType: 'Route',
        targetId: req.path,
        metadata: { requiredRoles: allowedRoles },
      });
      res.status(401).json({ success: false, message: 'Please login to continue.' });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      logAudit(req, {
        action: 'AUTH_ROLE_DENIED',
        success: false,
        targetType: 'Route',
        targetId: req.path,
        metadata: { userRole: user.role, requiredRoles: allowedRoles },
      });
      res.status(403).json({ success: false, message: 'You are not authorized to access this resource.' });
      return;
    }

    next();
  };
};

// Authenticate using API key
const authenticateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const apiKeyValue = extractApiKey(req.headers.authorization);
    
    if (!apiKeyValue) {
      logAudit(req, {
        action: 'AUTH_APIKEY_MISSING',
        success: false,
        targetType: 'Route',
        targetId: req.path,
      });
      res.status(401).json({ success: false, message: 'API key required. Use Authorization: ApiKey <your-key>' });
      return;
    }

    // Validate API key format
    if (!isValidApiKeyFormat(apiKeyValue)) {
      logAudit(req, {
        action: 'AUTH_APIKEY_FORMAT_INVALID',
        success: false,
        targetType: 'Route',
        targetId: req.path,
      });
      res.status(401).json({ success: false, message: 'Invalid API key format' });
      return;
    }

    // Find all API keys to check against (we need to hash and compare)
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            email: true,
          }
        }
      }
    });

    // Find matching API key by verifying hash
    let matchedApiKey = null;
    for (const apiKey of apiKeys) {
      const isValid = await verifyApiKey(apiKeyValue, apiKey.keyHash);
      if (isValid) {
        matchedApiKey = apiKey;
        break;
      }
    }

    if (!matchedApiKey) {
      logAudit(req, {
        action: 'AUTH_APIKEY_INVALID',
        success: false,
        targetType: 'Route',
        targetId: req.path,
      });
      res.status(401).json({ success: false, message: 'Invalid or expired API key' });
      return;
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: matchedApiKey.id },
      data: { lastUsedAt: new Date() }
    });

    // Attach API key info to request
    const apiKeyPayload: ApiKeyPayload = {
      keyId: matchedApiKey.id,
      organizationId: matchedApiKey.organizationId,
      organizationName: matchedApiKey.organization.name,
      createdById: matchedApiKey.createdById,
      keyName: matchedApiKey.name,
    };

    (req as any).apiKey = apiKeyPayload;
    // Log successful API key usage
    logAudit(req, {
      action: 'API_KEY_USED',
      success: true,
      targetType: 'ApiKey',
      targetId: matchedApiKey.id,
      metadata: { keyName: matchedApiKey.name, route: req.path, method: req.method },
      organizationId: matchedApiKey.organizationId,
      actorType: 'API_KEY',
      actorId: matchedApiKey.id,
    });
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

// Hybrid authentication - supports both JWT and API key
const authenticateFlexible = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({ success: false, message: 'Authorization header required. Use Bearer <jwt-token> or ApiKey <api-key>' });
    return;
  }

  const trimmed = authHeader.trim().toLowerCase();
  
  if (trimmed.startsWith('bearer ')) {
    // Handle JWT authentication
    authenticate(req, res, next);
  } else if (trimmed.startsWith('apikey ')) {
    // Handle API key authentication
    await authenticateApiKey(req, res, next);
  } else {
    res.status(401).json({ success: false, message: 'Invalid authorization format. Use Bearer <jwt-token> or ApiKey <api-key>' });
  }
};

// Convenience middlewares for common policies
const adminOnly = requireRoles(OrgRole.ADMIN);
const managerOrAdmin = requireRoles(OrgRole.MANAGER, OrgRole.ADMIN);

const authMiddleware = {
  authenticate,
  authenticateApiKey,
  authenticateFlexible,
  requireRoles,
  adminOnly,
  managerOrAdmin,
};

export { authMiddleware };


