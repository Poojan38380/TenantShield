import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  PORT: string;
  DATABASE_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGINS: string;
}

const parseEnv = (): EnvConfig => {
  const config: EnvConfig = {
    PORT: process.env.PORT || '3000',
    DATABASE_URL: process.env.DATABASE_URL || '',
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    JWT_SECRET: process.env.JWT_SECRET || '',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '',
    CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001',
  };

  const required = ['DATABASE_URL','JWT_SECRET','JWT_EXPIRES_IN'];
  const missing = required.filter(key => !config[key as keyof EnvConfig]);
  
  if (missing.length > 0) {
    throw new Error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  }

  return config;
};

export const env = parseEnv();

export type { EnvConfig };

export const isDevelopment = env.NODE_ENV === 'development';

export const isProduction = env.NODE_ENV === 'production';

export const isTest = env.NODE_ENV === 'test';

export default env;
