import { Request, Response, NextFunction } from 'express';

/**
 * Helmet Security Headers Middleware with Resilient Fallback.
 * 
 * If the 'helmet' package is present in node_modules, it delegates to helmet().
 * If 'helmet' is not yet installed on the production server (e.g. before running 'npm install'),
 * it automatically applies all standard Helmet security headers without crashing the server.
 */

let helmetInstance: any = null;
let helmetAttempted = false;

function getHelmetInstance() {
  if (helmetAttempted) return helmetInstance;
  helmetAttempted = true;

  try {
    // Dynamic load so build tools (esbuild) do not generate a fatal top-level require('helmet')
    // when executing on environments where npm install has not yet run.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const reqFn = typeof require === 'function' ? require : null;
    if (reqFn) {
      const helmetModule = reqFn('helmet');
      const helmetFn = helmetModule.default || helmetModule;
      if (typeof helmetFn === 'function') {
        helmetInstance = helmetFn({
          contentSecurityPolicy: false, // Preserves Vite SPA scripts, CSS, and HMR
          crossOriginEmbedderPolicy: false,
          crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows uploaded images & MSDS docs
          frameguard: false, // Permits rendering in iframe preview
        });
      }
    }
  } catch {
    console.warn(
      '⚠️ [Security Warning] Package "helmet" is not installed in production node_modules.\n' +
      '   Using native security headers fallback. Run "npm install" on your server to install all dependencies.'
    );
    helmetInstance = null;
  }

  return helmetInstance;
}

export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  const helmet = getHelmetInstance();

  if (helmet && typeof helmet === 'function') {
    return helmet(req, res, next);
  }

  // Fallback: Apply all standard Helmet security headers directly
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Origin-Agent-Cluster', '?1');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  next();
};
