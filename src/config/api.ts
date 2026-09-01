/**
 * Global API and Domain Configuration for AgriStore
 * Frontend: https://shop.avinia.ir
 * Backend API: https://api.shop.avinia.ir
 */

export const BACKEND_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('shop.avinia.ir')
    ? 'https://api.shop.avinia.ir'
    : '')
).replace(/\/$/, '');

export const FRONTEND_URL = (
  import.meta.env.VITE_SITE_URL || 'https://shop.avinia.ir'
).replace(/\/$/, '');

/**
 * Builds full API URL. If BACKEND_URL is empty (e.g. running in same-origin dev/container),
 * it produces a clean relative path (e.g. /api/v1/products).
 * If BACKEND_URL is set to https://api.shop.avinia.ir, it produces https://api.shop.avinia.ir/api/v1/products.
 */
export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!BACKEND_URL) {
    return cleanPath;
  }
  return `${BACKEND_URL}${cleanPath}`;
};

/**
 * Resolves uploaded media URLs (images, MSDS PDFs) so they point to the backend server.
 */
export const resolveMediaUrl = (pathOrUrl: string | undefined | null): string => {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  if (BACKEND_URL) {
    return `${BACKEND_URL}${cleanPath}`;
  }
  return cleanPath;
};
