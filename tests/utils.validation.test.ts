import { describe, it, expect } from 'vitest';
import { validationUtils } from '../src/utils/validation.ts';

describe('utils/validation createSlug', () => {
	it('lowercases, trims, and replaces spaces with hyphens', () => {
		const slug = validationUtils.createSlug('  My Project Name  ');
		expect(slug).toBe('my-project-name');
	});

	it('removes disallowed characters and collapses multiple hyphens', () => {
		const slug = validationUtils.createSlug('Hello!! World@@@ ### Foo---Bar');
		expect(slug).toBe('hello-world-foo-bar');
	});

	it('removes underscores and periods, collapses spaces to single hyphens', () => {
		const slug = validationUtils.createSlug('Org_Name.v2  Project__X');
		expect(slug).toBe('orgnamev2-projectx');
	});

	it('handles empty and special-only strings', () => {
		expect(validationUtils.createSlug('')).toBe('');
		expect(validationUtils.createSlug('$$$%%%')).toBe('');
	});
});


