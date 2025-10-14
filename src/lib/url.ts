/**
 * Convert Spaces URL to API proxy URL for secure access
 * Example: https://bucket.endpoint.com/bewirtungsbelege/user-1/file.png
 *       -> /api/documents/image/bewirtungsbelege/user-1/file.png
 */
export function convertToProxyUrl(spacesUrl: string): string {
  try {
    const url = new URL(spacesUrl);
    const path = url.pathname.substring(1); // Remove leading /
    return `/api/documents/image/${path}`;
  } catch (error) {
    console.error('[URL Util] Error converting URL to proxy:', error);
    return spacesUrl; // Fallback to original URL
  }
}
