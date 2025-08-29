import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  PORT: string;
  DATABASE_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

const parseEnv = (): EnvConfig => {
  const config: EnvConfig = {
    PORT: process.env.PORT || '3000',
    DATABASE_URL: process.env.DATABASE_URL || '',
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  };

  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !config[key as keyof EnvConfig]);
  
  if (missing.length > 0) {
    throw new Error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  }

  return config;
};

// Export validated environment variables
export const env = parseEnv();

// Type for environment variables
export type { EnvConfig };

// Helper function to check if running in development
export const isDevelopment = env.NODE_ENV === 'development';

// Helper function to check if running in production
export const isProduction = env.NODE_ENV === 'production';

// Helper function to check if running in test
export const isTest = env.NODE_ENV === 'test';

export default env;
