import { Request } from 'express';

/**
 * Converts relative asset or image URLs into fully qualified absolute URLs.
 * Essential for Android and mobile clients that cannot resolve relative paths.
 */
export function toAbsoluteImageUrl(req: Request, imageUrl?: string | null): string | null {
  if (!imageUrl) return null;
  
  // Already absolute or data URI
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  // Determine base host dynamically or from environment
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${baseUrl}${cleanPath}`;
}
