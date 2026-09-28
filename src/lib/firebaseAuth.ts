/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Firebase integration is temporarily suspended for local development.
// All authentication and factory data operate in local-first mode (IndexedDB + localStorage).
// Ready to be re-connected before final production publish.

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'local-offline-usr',
      email: 'applicationhub69@gmail.com',
      emailVerified: true,
      isAnonymous: false,
    },
    operationType,
    path
  };
  console.info('Local development mode: Firestore operation stubbed.', errInfo);
}

// Stub database object for type compatibility
export const db = {} as any;
export const auth = {
  currentUser: {
    uid: 'local-offline-user',
    email: 'applicationhub69@gmail.com',
    displayName: 'IE Engineer (Local)'
  }
} as any;

/**
 * Health check probe: returns immediately in local mode with no network overhead.
 */
export async function testConnection(): Promise<void> {
  return Promise.resolve();
}

// In-memory token & profile store
let cachedAccessToken: string | null = 'local-auth-token-active';
type AuthCallback = (user: any, token: string) => void;
const authListeners: Set<AuthCallback> = new Set();

let currentLocalUser: any = (() => {
  try {
    const saved = localStorage.getItem('ie_user_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.email && parsed.email.toLowerCase().includes('realmec85pro231')) {
        parsed.email = 'applicationhub69@gmail.com';
      }
      return {
        uid: parsed.googleUid || 'local-usr-admin',
        displayName: parsed.name || 'Lead IE Engineer',
        email: parsed.email || 'applicationhub69@gmail.com',
        photoURL: parsed.photoURL || undefined
      };
    }
  } catch {}
  return {
    uid: 'local-usr-admin',
    displayName: 'Lead IE Engineer',
    email: 'applicationhub69@gmail.com',
    photoURL: undefined
  };
})();

/**
 * Subscribes to authentication state changes locally without Firebase network calls.
 */
export const initAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (currentLocalUser && onAuthSuccess) {
    onAuthSuccess(currentLocalUser, cachedAccessToken || 'local-auth-token-active');
  } else if (!currentLocalUser && onAuthFailure) {
    onAuthFailure();
  }

  if (onAuthSuccess) {
    authListeners.add(onAuthSuccess);
  }

  return () => {
    if (onAuthSuccess) {
      authListeners.delete(onAuthSuccess);
    }
  };
};

export function getLocalAvatarSvg(name: string, bg: string = '#176f78'): string {
  const initials = (name || 'IE')
    .split(' ')
    .filter(Boolean)
    .map(p => p[0].toUpperCase())
    .slice(0, 2)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="50" fill="${bg}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="system-ui,-apple-system,sans-serif" font-size="38" font-weight="700">${initials || 'IE'}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Direct Profile Authentication for 100% Local / Offline operations.
 */
export const googleSignIn = async (userEmail?: string): Promise<{ user: any; accessToken: string; error?: string } | null> => {
  const emailToUse = userEmail || 'applicationhub69@gmail.com';
  const name = emailToUse ? emailToUse.split('@')[0] : 'IE Engineer';
  const simulatedUser = {
    uid: 'local-usr-' + (emailToUse.split('@')[0] || 'local'),
    displayName: name,
    email: emailToUse,
    photoURL: getLocalAvatarSvg(name, '#176f78')
  };

  currentLocalUser = simulatedUser;
  cachedAccessToken = 'local-token-' + Date.now();

  authListeners.forEach(listener => {
    try {
      listener(simulatedUser, cachedAccessToken!);
    } catch {}
  });

  return { user: simulatedUser, accessToken: cachedAccessToken };
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || 'local-auth-token';
};

export const googleSignOut = async () => {
  currentLocalUser = null;
  cachedAccessToken = null;
  authListeners.forEach(listener => {
    try {
      listener(null, '');
    } catch {}
  });
};
