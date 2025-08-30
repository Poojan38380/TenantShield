import { describe, it, expect, beforeAll } from 'vitest';
import { generateToken, verifyToken, decodeToken, JWT_CONFIG } from '../src/config/jwt.ts';

beforeAll(() => {
	process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
	process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
});

describe('config/jwt', () => {
	it('generate and verify token', () => {
		const token = generateToken({
			userId: 'u1',
			email: 'a@b.c',
			organizationId: 'o1',
			role: 'ADMIN' as any,
		});
		expect(typeof token).toBe('string');
		const decoded = verifyToken(token);
		expect(decoded.userId).toBe('u1');
		expect(decoded.email).toBe('a@b.c');
	});

	it('decodeToken returns payload without verification', () => {
		const token = generateToken({
			userId: 'u2',
			email: 'c@d.e',
			organizationId: 'o2',
			role: 'MANAGER' as any,
		});
		const payload = decodeToken(token);
		expect(payload?.userId).toBe('u2');
	});
});


