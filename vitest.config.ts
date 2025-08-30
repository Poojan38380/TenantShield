import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['tests/**/*.test.ts'],
		setupFiles: ['tests/setup.ts'],
		globals: true,
		watch: false,
		reporters: 'default',
	},
	esbuild: {
		target: 'es2022',
	},
});


