import { body, param, ValidationChain } from 'express-validator';

// Email validation
const validateEmail = (): ValidationChain => {
  return body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ min: 5, max: 255 })
    .withMessage('Email must be between 5 and 255 characters');
};

// Password validation for registration
const validatePassword = (): ValidationChain => {
  return body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
};

// Organization name validation
const validateOrganizationName = (): ValidationChain => {
  return body('organizationName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Organization name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_.]+$/)
    .withMessage('Organization name can only contain letters, numbers, spaces, hyphens, underscores, and periods')
    .trim();
};

// Registration validation rules
const validateRegistration = (): ValidationChain[] => {
  return [
    validateEmail(),
    validatePassword(),
    validateOrganizationName(),
  ];
};

// Login validation rules
const validateLogin = (): ValidationChain[] => {
  return [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ];
};

// Sanitize organization name to create slug
const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s\-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Project name validation
const validateProjectName = (): ValidationChain => {
  return body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_.]+$/)
    .withMessage('Project name can only contain letters, numbers, spaces, hyphens, underscores, and periods')
    .trim();
};

// UUID validation for project ID
const validateProjectId = (): ValidationChain => {
  return param('projectId')
    .isUUID()
    .withMessage('Invalid project ID format');
};

// UUID validation for user ID
const validateUserId = (): ValidationChain => {
  return param('userId')
    .isUUID()
    .withMessage('Invalid user ID format');
};

// Project creation validation rules
const validateCreateProject = (): ValidationChain[] => {
  return [
    validateProjectName(),
  ];
};

// Project update validation rules
const validateUpdateProject = (): ValidationChain[] => {
  return [
    validateProjectId(),
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Project name must be between 1 and 100 characters')
      .matches(/^[a-zA-Z0-9\s\-_.]+$/)
      .withMessage('Project name can only contain letters, numbers, spaces, hyphens, underscores, and periods')
      .trim(),
  ];
};

// Project ID validation rules
const validateProjectIdParam = (): ValidationChain[] => {
  return [
    validateProjectId(),
  ];
};

// User ID validation rules
const validateUserIdParam = (): ValidationChain[] => {
  return [
    validateUserId(),
  ];
};

// API Key name validation
const validateApiKeyName = (): ValidationChain => {
  return body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('API key name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_.]+$/)
    .withMessage('API key name can only contain letters, numbers, spaces, hyphens, underscores, and periods')
    .trim();
};

// API Key expiration hours validation (optional)
const validateApiKeyExpiration = (): ValidationChain => {
  return body('expiresInHours')
    .optional()
    .isInt({ min: 1, max: 8760 }) // 1 hour to 1 year (365 * 24)
    .withMessage('Expiration must be a number between 1 and 8760 hours (1 year)')
    .toInt();
};

// UUID validation for API key ID
const validateApiKeyId = (): ValidationChain => {
  return param('keyId')
    .isUUID()
    .withMessage('Invalid API key ID format');
};

// API Key creation validation rules
const validateCreateApiKey = (): ValidationChain[] => {
  return [
    validateApiKeyName(),
    validateApiKeyExpiration(),
  ];
};

// API Key ID parameter validation rules
const validateApiKeyIdParam = (): ValidationChain[] => {
  return [
    validateApiKeyId(),
  ];
};

const validationUtils = {
  validateEmail,
  validatePassword,
  validateOrganizationName,
  validateRegistration,
  validateLogin,
  validateProjectName,
  validateProjectId,
  validateUserId,
  validateCreateProject,
  validateUpdateProject,
  validateProjectIdParam,
  validateUserIdParam,
  validateApiKeyName,
  validateApiKeyExpiration,
  validateApiKeyId,
  validateCreateApiKey,
  validateApiKeyIdParam,
  createSlug,
};
export { validationUtils };
