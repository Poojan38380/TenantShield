import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAudit } from '../src/services/audit.ts';

vi.mock('../src/config/prisma.ts', () => {
	return {
		default: {
			auditLog: {
				create: vi.fn(),
			},
		},
	};
});

const prisma = (await import('../src/config/prisma.ts')).default as any;

describe('services/audit logAudit', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('writes audit log using request context (user)', async () => {
		const req: any = {
			headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8', 'user-agent': 'UA' },
			ip: '9.9.9.9',
			path: '/route',
			method: 'GET',
			get: (h: string) => (h.toLowerCase() === 'user-agent' ? 'UA' : undefined),
			user: { userId: 'u1', organizationId: 'o1' },
		};

		await logAudit(req, { action: 'TEST', success: true });

		expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
		const arg = (prisma.auditLog.create as any).mock.calls[0][0].data;
		expect(arg).toMatchObject({
			organizationId: 'o1',
			actorType: 'USER',
			actorId: 'u1',
			action: 'TEST',
			success: true,
			userAgent: 'UA',
			ip: '1.2.3.4',
		});
	});

	it('derives actor from apiKey when present', async () => {
		const req: any = {
			headers: {},
			ip: '2.2.2.2',
			path: '/route',
			method: 'POST',
			get: () => undefined,
			apiKey: { keyId: 'k1', organizationId: 'o2' },
		};

		await logAudit(req, { action: 'API', success: false });
		expect(prisma.auditLog.create).toHaveBeenCalled();
		const arg = (prisma.auditLog.create as any).mock.calls[0][0].data;
		expect(arg).toMatchObject({
			organizationId: 'o2',
			actorType: 'API_KEY',
			actorId: 'k1',
			action: 'API',
			success: false,
		});
	});

	it('does not throw if prisma fails', async () => {
		(prisma.auditLog.create as any).mockRejectedValueOnce(new Error('db-fail'));
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const req: any = {
			headers: {},
			ip: '1.1.1.1',
			path: '/x',
			method: 'GET',
			get: () => undefined,
		};
		await expect(logAudit(req, { action: 'X', success: true })).resolves.toBeUndefined();
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockRestore();
	});
});


