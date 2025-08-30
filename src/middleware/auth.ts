import { NextFunction, Request, Response } from 'express';
import { OrgRole } from '@prisma/client';
import { verifyToken } from '../config/jwt.ts';
import { JWTPayload } from '../types/auth.ts';

// Extract Bearer token from Authorization header
const extractBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) return null;
  const trimmed = authorizationHeader.trim();
  if (!trimmed.toLowerCase().startsWith('bearer ')) return null;
  const token = trimmed.slice(7).trim();
  return token.length > 0 ? token : null;
};

// Ensures a valid JWT is present and attaches the decoded user to req
const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      res.status(401).json({ success: false, message: 'Please login to continue.' });
      return;
    }

    const decoded = verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Factory to allow only the specified roles
const requireRoles = (...allowedRoles: OrgRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user: JWTPayload | undefined = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Please login to continue.' });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ success: false, message: 'You are not authorized to access this resource.' });
      return;
    }

    next();
  };
};

// Convenience middlewares for common policies
const adminOnly = requireRoles(OrgRole.ADMIN);
const managerOrAdmin = requireRoles(OrgRole.MANAGER, OrgRole.ADMIN);

const authMiddleware = {
  authenticate,
  requireRoles,
  adminOnly,
  managerOrAdmin,
};

export { authMiddleware };


