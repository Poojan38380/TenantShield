import { describe, it, expect } from 'vitest';
import { notFoundHandler, globalErrorHandler, AppError, extractErrorAuditData } from '../src/middleware/error.ts';

const mockRes = () => {
	const res: any = {};
	res.statusCode = 200;
	res.status = (code: number) => { res.statusCode = code; return res; };
	res.jsonBody = undefined as any;
	res.json = (body: any) => { res.jsonBody = body; return res; };
	return res;
};

describe('middleware/error notFoundHandler', () => {
	it('forwards AppError 404 to next', () => {
		const req: any = { method: 'GET', originalUrl: '/nope' };
		const res = mockRes();
		let forwarded: any;
		notFoundHandler(req as any, res as any, (err: any) => { forwarded = err; });
		expect(forwarded).toBeInstanceOf(AppError);
		expect((forwarded as AppError).statusCode).toBe(404);
	});
});

describe('middleware/error globalErrorHandler', () => {
	it('maps JsonWebTokenError to 401 Invalid token', () => {
		const err = new Error('jwt malformed');
		err.name = 'JsonWebTokenError';
		const req: any = { path: '/p', method: 'GET', body: {}, params: {}, query: {}, get: () => 'UA', connection: { remoteAddress: '127.0.0.1' } };
		const res = mockRes();
		globalErrorHandler(err as any, req as any, res as any, (() => {}) as any);
		expect(res.statusCode).toBe(401);
		expect(res.jsonBody.success).toBe(false);
		expect(res.jsonBody.code).toBe('INVALID_TOKEN');
		// do not assert stack in test env
	});
});

describe('middleware/error extractErrorAuditData', () => {
	it('extracts ids from user and apiKey', () => {
		const req: any = {
			path: '/p', method: 'POST', ip: '1.1.1.1', connection: { remoteAddress: '1.1.1.1' },
			get: () => 'UA',
			user: { userId: 'u1', organizationId: 'o1' },
			apiKey: { keyId: 'k1', organizationId: 'o1' },
		};
		const data = extractErrorAuditData(new AppError('x', 400, 'X'), req as any, {} as any);
		expect(data.userId).toBe('u1');
		expect(data.organizationId).toBe('o1');
		expect(data.apiKeyId).toBe('k1');
	});
});


