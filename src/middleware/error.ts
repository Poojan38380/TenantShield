import { Request, Response, NextFunction } from 'express';
import { env, isDevelopment } from '../config/env.js';
import { ApiResponse } from '../types/api.js';

// Custom error class for application errors
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error types for audit logging
export interface ErrorAuditData {
  statusCode: number;
  message: string;
  path: string;
  method: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  organizationId?: string;
  apiKeyId?: string;
  errorCode?: string;
  stack?: string;
}

// Function to extract audit data from error context
export const extractErrorAuditData = (
  err: Error | AppError,
  req: Request,
  res: Response
): ErrorAuditData => {
  const statusCode = (err as AppError).statusCode || 500;
  const user = (req as any).user;
  const apiKey = (req as any).apiKey;

  return {
    statusCode,
    message: err.message,
    path: req.path,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent'),
    userId: user?.userId,
    organizationId: user?.organizationId || apiKey?.organizationId,
    apiKeyId: apiKey?.keyId,
    errorCode: (err as AppError).code,
    stack: isDevelopment ? err.stack : undefined,
  };
};

// 404 Not Found handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

// Global error handler
export const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Ensure we have a status code
  let statusCode = (err as AppError).statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = (err as AppError).code;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  } else if (err.message?.includes('CORS')) {
    statusCode = 403;
    message = 'CORS policy violation';
    code = 'CORS_ERROR';
  }

  // Extract audit data for security-related errors
  const auditData = extractErrorAuditData(err, req, res);
  
  // Log security-related errors (401, 403) for audit purposes
  if (statusCode === 401 || statusCode === 403) {
    console.log('SECURITY_EVENT:', JSON.stringify({
      type: 'AUTHENTICATION_FAILURE',
      ...auditData,
      timestamp: new Date().toISOString(),
    }));
    
    // TODO: In the future, this will be logged to the AuditLog table
    // await logSecurityEvent('AUTHENTICATION_FAILURE', auditData);
  }

  // Log all errors in development
  if (isDevelopment) {
    console.error('Error Details:', {
      message: err.message,
      stack: err.stack,
      statusCode,
      path: req.path,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  } else {
    // Log only essential info in production
    console.error('Production Error:', {
      message: err.message,
      statusCode,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

  // Prepare error response
  const errorResponse: ApiResponse = {
    success: false,
    message,
    ...(code && { code }),
    ...(isDevelopment && { 
      stack: err.stack,
      details: {
        name: err.name,
        originalMessage: err.message,
      }
    }),
  };

  // Don't leak sensitive information in production
  if (!isDevelopment && statusCode === 500) {
    errorResponse.message = 'Internal Server Error';
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper to catch async errors in route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Express error handler for unhandled promise rejections
export const unhandledRejectionHandler = (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Promise Rejection:', reason);
  // Log to audit system in the future
  process.exit(1);
};

// Express error handler for uncaught exceptions
export const uncaughtExceptionHandler = (error: Error) => {
  console.error('Uncaught Exception:', error);
  // Log to audit system in the future
  process.exit(1);
};

// Helper function to create common errors
export const createError = {
  badRequest: (message: string, code?: string) => new AppError(message, 400, code),
  unauthorized: (message: string = 'Unauthorized', code?: string) => new AppError(message, 401, code),
  forbidden: (message: string = 'Forbidden', code?: string) => new AppError(message, 403, code),
  notFound: (message: string, code?: string) => new AppError(message, 404, code),
  conflict: (message: string, code?: string) => new AppError(message, 409, code),
  internal: (message: string = 'Internal Server Error', code?: string) => new AppError(message, 500, code),
};
