import dotenv from 'dotenv';
import { Secret, SignOptions } from 'jsonwebtoken';

dotenv.config();

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';

// Strict validation of JWT_SECRET in production: Must crash if not configured
if (IS_PRODUCTION && (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '')) {
  console.error('\n❌ ==============================================================');
  console.error('❌ [FATAL SECURITY ERROR] JWT_SECRET is NOT defined in production!');
  console.error('❌ Set JWT_SECRET in your cPanel environment variables or .env file.');
  console.error('❌ Server startup aborted to prevent insecure token generation.');
  console.error('❌ ==============================================================\n');
  process.exit(1);
}

// Single shared source of truth for JWT configuration
export const JWT_SECRET: Secret = process.env.JWT_SECRET || 'agri_dev_secret_key_only_for_local_debugging_not_production_2026';
export const JWT_EXPIRES_IN: SignOptions['expiresIn'] = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

/**
 * Returns error details only in non-production mode to prevent internal info leakage
 */
export const devError = (err: any): { error?: string } => {
  if (!IS_PRODUCTION && err) {
    return { error: err?.message || String(err) };
  }
  return {};
};

