import request from 'supertest';
import app from '../src/app.ts';

describe('App integration', () => {
	it('GET / returns welcome payload', async () => {
		const res = await request(app).get('/');
		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({
			message: 'Welcome to TenantShield!'
		});
	});

	it('GET /api/projects requires auth', async () => {
		const res = await request(app).get('/api/projects');
		expect(res.status).toBe(401);
		expect(res.body.success).toBe(false);
	});

	it('POST /api/auth/logout without token returns 401', async () => {
		const res = await request(app).post('/api/auth/logout');
		expect(res.status).toBe(401);
	});

	it('Unknown route responds with 404 JSON', async () => {
		const res = await request(app).get('/does-not-exist');
		expect(res.status).toBe(404);
		expect(res.body.success).toBe(false);
	});
});


