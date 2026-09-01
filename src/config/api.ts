/**
 * Global API and Domain Configuration for AgriStore
 * Frontend: https://shop.avinia.ir
 * Backend API: https://api.shop.avinia.ir
 */

export const getBackendUrl = (): string => {
  // 1. Explicit Vite env variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }

  // 2. Auto-detect production custom domain
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    // If frontend is running separately on shop.avinia.ir and API is at api.shop.avinia.ir
    if (host === 'shop.avinia.ir') {
      return 'https://api.shop.avinia.ir';
    }
    // If accessing api.shop.avinia.ir directly or localhost/preview
    if (host === 'api.shop.avinia.ir') {
      return '';
    }
  }

  // 3. Fallback for local development and preview environment (same origin proxy)
  return '';
};

export const BACKEND_URL = getBackendUrl();

export const FRONTEND_URL = (
  import.meta.env.VITE_SITE_URL || 'https://shop.avinia.ir'
).replace(/\/$/, '');

/**
 * Builds the full API URL.
 * When on shop.avinia.ir, apiUrl('/api/v1/products') becomes https://api.shop.avinia.ir/api/v1/products.
 * In local dev, it stays as /api/v1/products.
 */
export const apiUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const backend = getBackendUrl();
  if (backend) {
    return `${backend}${cleanPath}`;
  }
  return cleanPath;
};

/**
 * Enhanced fetch wrapper that automatically routes relative API requests
 * to the correct backend host (api.shop.avinia.ir in production).
 */
export const apiFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (typeof input === 'string') {
    return fetch(apiUrl(input), init);
  }
  return fetch(input, init);
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
  const backend = getBackendUrl();
  if (backend) {
    return `${backend}${cleanPath}`;
  }
  return cleanPath;
};
