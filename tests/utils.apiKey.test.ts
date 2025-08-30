import { describe, it, expect } from 'vitest';
import { generateApiKey, isValidApiKeyFormat, maskApiKey, hashApiKey, verifyApiKey } from '../src/utils/apiKey.ts';

describe('utils/apiKey', () => {
	it('generateApiKey returns ts_ prefixed 64-hex token', () => {
		const key = generateApiKey();
		expect(key.startsWith('ts_')).toBe(true);
		expect(isValidApiKeyFormat(key)).toBe(true);
	});

	it('isValidApiKeyFormat validates and rejects incorrect formats', () => {
		expect(isValidApiKeyFormat('ts_' + 'a'.repeat(64))).toBe(true);
		expect(isValidApiKeyFormat('ts_' + 'g'.repeat(64))).toBe(false); // non-hex
		expect(isValidApiKeyFormat('bad')).toBe(false);
		expect(isValidApiKeyFormat('ts_' + 'a'.repeat(63))).toBe(false);
	});

	it('maskApiKey masks after first 8 chars', () => {
		const key = 'ts_'.padEnd(70, 'a');
		const masked = maskApiKey(key);
		expect(masked.startsWith(key.substring(0, 8))).toBe(true);
		expect(masked.length).toBe(key.length);
	});

	it('hashApiKey and verifyApiKey round-trip', async () => {
		const key = generateApiKey();
		const hash = await hashApiKey(key);
		expect(hash).toBeTruthy();
		const ok = await verifyApiKey(key, hash);
		expect(ok).toBe(true);
		const bad = await verifyApiKey(key + 'x', hash);
		expect(bad).toBe(false);
	});
});


