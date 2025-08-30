// Ensure test environment variables are set before importing app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
// Use an in-memory SQLite database file per test run
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db?connection_limit=1&pool_timeout=0';

// Silence noisy logs during tests
const noop = () => {};
if (process.env.VERBOSE_TESTS !== 'true') {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  // @ts-expect-error override for tests
  console.log = noop;
}


