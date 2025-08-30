import { describe, it, expect } from 'vitest';
import { passwordUtils } from '../src/utils/password.ts';

describe('utils/password', () => {
	it('validatePassword returns errors for weak passwords', () => {
		const errs = passwordUtils.validatePassword('short');
		expect(errs.length).toBeGreaterThan(0);
	});

	it('validatePassword passes for strong password', () => {
		const errs = passwordUtils.validatePassword('Str0ng_P@ssw0rd!');
		expect(errs).toEqual([]);
	});

	it('hash and compare works', async () => {
		const pwd = 'Str0ng_P@ssw0rd!';
		const hash = await passwordUtils.hashPassword(pwd);
		expect(hash).toBeTruthy();
		const ok = await passwordUtils.comparePassword(pwd, hash);
		expect(ok).toBe(true);
		const bad = await passwordUtils.comparePassword('wrong', hash);
		expect(bad).toBe(false);
	});
});


