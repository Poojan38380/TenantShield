import { Request, Response, NextFunction } from 'express';
import { JWTPayload, ApiKeyPayload } from '../types/auth.js';

export interface TenantContextRequest extends Request {
	tenantId?: string;
	actor?: {
		type: 'USER' | 'API_KEY';
		id: string;
		organizationId: string;
		role?: string;
		email?: string;
		keyName?: string;
	};
}

export const attachTenant = (req: Request, res: Response, next: NextFunction): void => {
	const user: JWTPayload | undefined = (req as any).user;
	const apiKey: ApiKeyPayload | undefined = (req as any).apiKey;

	const requestWithTenant = req as TenantContextRequest;

	if (user) {
		requestWithTenant.tenantId = user.organizationId;
		requestWithTenant.actor = {
			type: 'USER',
			id: user.userId,
			organizationId: user.organizationId,
			role: String(user.role),
			email: user.email,
		};
		return next();
	}

	if (apiKey) {
		requestWithTenant.tenantId = apiKey.organizationId;
		requestWithTenant.actor = {
			type: 'API_KEY',
			id: apiKey.keyId,
			organizationId: apiKey.organizationId,
			keyName: apiKey.keyName,
		};
		return next();
	}

	return next();
};
