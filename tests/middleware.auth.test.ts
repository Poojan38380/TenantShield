import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authMiddleware } from '../src/middleware/auth.ts';
import type { JWTPayload } from '../src/types/auth.ts';
import { OrgRole } from '@prisma/client';

vi.mock('../src/config/jwt.ts', () => ({
	verifyToken: vi.fn(),
}));

vi.mock('../src/services/audit.ts', () => ({
	logAudit: vi.fn(),
}));

const { verifyToken } = await import('../src/config/jwt.ts');
const { logAudit } = await import('../src/services/audit.ts');

const mockRes = () => {
	const res: any = {};
	res.statusCode = 200;
	res.status = (code: number) => { res.statusCode = code; return res; };
	res.jsonBody = undefined as any;
	res.json = (body: any) => { res.jsonBody = body; return res; };
	return res;
};

describe('middleware/auth authenticate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns 401 when token is missing', () => {
		const req: any = { headers: {}, path: '/p', method: 'GET' };
		const res = mockRes();
		const next = vi.fn();
		authMiddleware.authenticate(req, res as any, next);
		expect(res.statusCode).toBe(401);
		expect(next).not.toHaveBeenCalled();
		expect(logAudit).toHaveBeenCalled();
	});

	it('returns 401 when token invalid', () => {
		(verifyToken as any).mockImplementation(() => { throw new Error('bad'); });
		const req: any = { headers: { authorization: 'Bearer bad' }, path: '/p', method: 'GET' };
		const res = mockRes();
		const next = vi.fn();
		authMiddleware.authenticate(req, res as any, next);
		expect(res.statusCode).toBe(401);
		expect(next).not.toHaveBeenCalled();
		expect(logAudit).toHaveBeenCalled();
	});

	it('calls next and attaches user when token valid', () => {
		const payload: JWTPayload = { userId: 'u1', email: 'a@b.c', organizationId: 'o1', role: 'ADMIN' as any };
		(verifyToken as any).mockReturnValue(payload);
		const req: any = { headers: { authorization: 'Bearer token' } };
		const res = mockRes();
		const next = vi.fn();
		authMiddleware.authenticate(req, res as any, next);
		expect(next).toHaveBeenCalled();
		expect(req.user).toEqual(payload);
	});
});

describe('middleware/auth requireRoles', () => {
	it('returns 401 when user missing', () => {
		const handler = authMiddleware.requireRoles(OrgRole.ADMIN);
		const req: any = { path: '/p', method: 'GET' };
		const res = mockRes();
		const next = vi.fn();
		handler(req, res as any, next);
		expect(res.statusCode).toBe(401);
		expect(next).not.toHaveBeenCalled();
	});

	it('returns 403 when role not allowed', () => {
		const handler = authMiddleware.requireRoles(OrgRole.ADMIN);
		const req: any = { user: { role: OrgRole.MANAGER }, path: '/p', method: 'GET' };
		const res = mockRes();
		const next = vi.fn();
		handler(req, res as any, next);
		expect(res.statusCode).toBe(403);
		expect(next).not.toHaveBeenCalled();
	});

	it('calls next when role allowed', () => {
		const handler = authMiddleware.requireRoles(OrgRole.MANAGER, OrgRole.ADMIN);
		const req: any = { user: { role: OrgRole.ADMIN }, path: '/p', method: 'GET' };
		const res = mockRes();
		const next = vi.fn();
		handler(req, res as any, next);
		expect(next).toHaveBeenCalled();
	});
});


