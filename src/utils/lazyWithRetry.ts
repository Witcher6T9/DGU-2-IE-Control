import { lazy, ComponentType } from 'react';

/**
 * Enhanced React.lazy with automatic reload retry on dynamic chunk import failure.
 * Fixes "Failed to fetch dynamically imported module" errors that occur when
 * new deployments or builds invalidate cached chunk hashes in the user's browser.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err: any) {
      const isChunkError =
        err?.message?.includes('dynamically imported module') ||
        err?.message?.includes('Failed to fetch dynamically imported module') ||
        err?.message?.includes('Loading chunk') ||
        err?.name === 'TypeError';

      if (isChunkError && typeof window !== 'undefined') {
        const hasRefreshed = sessionStorage.getItem('chunk_retry_occurred');
        if (!hasRefreshed) {
          sessionStorage.setItem('chunk_retry_occurred', 'true');
          console.warn('[lazyWithRetry] Stale chunk detected. Refreshing page for latest application bundle...');
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
      }
      throw err;
    }
  });
}
