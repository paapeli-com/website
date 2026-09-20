import { create } from 'zustand';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';
import { onTokenRefreshed, onUnauthorized, setApiAuthToken } from '@paapeli/api';
import { getSession as getSharedSession } from '@paapeli/brand/session';
import { toast } from 'sonner';

const USER_POOL_ID = 'me-central-1_WCBtB2Rc0';
const CLIENT_ID = '37dl99jmgg21jve8e6n7pfd1da';
const COGNITO_DOMAIN = 'paapeli-dev-auth.auth.me-central-1.amazoncognito.com';

const userPool = new CognitoUserPool({
  UserPoolId: USER_POOL_ID,
  ClientId: CLIENT_ID,
});

// Cognito's own SDK persists its sessions to localStorage under its own keys
// and `userPool.getCurrentUser()` restores from that. The demo accounts and
// the Paapeli Gateway login are synthetic sessions with no such persistence,
// so we save/restore those ourselves under this key.
const STORAGE_KEY = 'paapeli_session';

type StoredSession = { username: string; token: string };

function loadStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function persistSession(session: StoredSession) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {}
}

function clearStoredSession() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function toMockSession(username: string, token: string) {
  const mockUser = {
    getUsername: () => username,
    getSession: (callback: any) => callback(null, null),
    signOut: () => {},
  } as unknown as CognitoUser;

  const mockSession = {
    isValid: () => true,
    getIdToken: () => ({ getJwtToken: () => token }),
    getAccessToken: () => ({ getJwtToken: () => token }),
    getRefreshToken: () => ({ getToken: () => token }),
  } as unknown as CognitoUserSession;

  return { mockUser, mockSession };
}

interface AuthState {
  user: CognitoUser | null;
  session: CognitoUserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithPaapeliToken: (username: string, token: string) => void;
  signUp: (email: string, password: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: (stayOnPage?: boolean) => boolean;
  getCurrentSession: () => Promise<CognitoUserSession | null>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,

  getCurrentSession: async () => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) return null;

    return new Promise((resolve) => {
      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          resolve(null);
          return;
        }
        resolve(session);
      });
    });
  },

  signIn: async (email: string, password: string) => {
    // Trim accidental whitespace from autofill/paste — but keep case (passwords are case-sensitive).
    const inputUser = (email || '').trim();
    const inputPass = (password || '').trim();

    // Hardcoded accounts — exact, case-sensitive match.
    const demoAccounts: Record<string, string> = {
      demo: 'demo',
      sina: 'Sina@Parent',
      mapsa: 'M@psa1405',
    };
    if (demoAccounts[inputUser] !== undefined && demoAccounts[inputUser] === inputPass) {
      const username = inputUser;
      const token = `${username}-token`;
      const { mockUser, mockSession } = toMockSession(username, token);

      persistSession({ username, token });
      set({ user: mockUser, session: mockSession, isAuthenticated: true });
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (session) => {
          set({ user: cognitoUser, session, isAuthenticated: true });
          resolve();
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  },

  // Wraps a Paapeli Gateway JWT in the same shape ProtectedRoute/consumers
  // already expect from Cognito, so route gating keeps working unchanged.
  signInWithPaapeliToken: (username: string, token: string) => {
    const { mockUser, mockSession } = toMockSession(username, token);

    setApiAuthToken(token);
    persistSession({ username, token });
    set({ user: mockUser, session: mockSession, isAuthenticated: true });
  },

  signUp: async (email: string, password: string) => {
    return new Promise<void>((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email,
        }),
      ];

      userPool.signUp(email, password, attributeList, null, (err: any, result) => {
        if (err) {
          console.error('Cognito signUp error:', err);
          console.error('Error code:', err?.code || 'no code');
          console.error('Error message:', err?.message || 'no message');
          console.error('Error name:', err?.name || 'no name');
          reject(err);
          return;
        }
        console.log('SignUp successful:', result);
        resolve();
      });
    });
  },

  confirmSignUp: async (email: string, code: string) => {
    return new Promise<void>((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  },

  resendConfirmationCode: async (email: string) => {
    return new Promise<void>((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.resendConfirmationCode((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  },

  forgotPassword: async (email: string) => {
    return new Promise<void>((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.forgotPassword({
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err),
      });
    });
  },

  confirmPassword: async (email: string, code: string, newPassword: string) => {
    return new Promise<void>((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err),
      });
    });
  },

  signInWithGoogle: async () => {
    const hostname = window.location.hostname;
    let redirectUri = `${window.location.origin}/auth/callback`;

    if (hostname === 'panel.paapeli.com' || hostname.includes('panel-')) {
      redirectUri = `${window.location.origin}/auth/callback`;
    }

    const googleAuthUrl = `https://${COGNITO_DOMAIN}/oauth2/authorize?identity_provider=Google&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=CODE&client_id=${CLIENT_ID}&scope=email openid profile`;

    window.location.href = googleAuthUrl;
  },

  signOut: (stayOnPage = false) => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
    clearStoredSession();
    setApiAuthToken(null);
    set({ user: null, session: null, isAuthenticated: false });
    return stayOnPage;
  },
}));

// Restore a session once on load (equivalent to the old AuthProvider's mount
// effect — zustand stores have no lifecycle of their own). The shared,
// product-agnostic session (set at the host /login, @paapeli/brand/session)
// takes priority — it's what real logins now write, and carries the real
// bearer token our API calls need. Falls back to our own legacy demo/Paapeli
// session, then to Cognito's own async session check.
(() => {
  const shared = getSharedSession();
  if (shared?.token) {
    const { mockUser, mockSession } = toMockSession(shared.email, shared.token);
    setApiAuthToken(shared.token);
    useAuthStore.setState({
      user: mockUser,
      session: mockSession,
      isAuthenticated: true,
      isLoading: false,
    });
    return;
  }

  const stored = loadStoredSession();
  if (stored) {
    const { mockUser, mockSession } = toMockSession(stored.username, stored.token);
    setApiAuthToken(stored.token);
    useAuthStore.setState({
      user: mockUser,
      session: mockSession,
      isAuthenticated: true,
      isLoading: false,
    });
    return;
  }

  void (async () => {
    try {
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        const session = await useAuthStore.getState().getCurrentSession();
        if (session && session.isValid()) {
          useAuthStore.setState({ user: cognitoUser, session, isAuthenticated: true });
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      useAuthStore.setState({ isLoading: false });
    }
  })();
})();

/* A 401 means the token is dead. The single interceptor lives in
   @paapeli/api (napiHttpHandler) — it clears the token, drops the shared
   session and redirects to /login. This only adds the teardown that is
   specific to this store: the Cognito sign-out and the local state.

   This used to be a second interceptor on the same client. Both fired on every
   401, each with its own guard: this one required `isAuthenticated`, the other
   latched on the first 401 of the page and never re-armed. Between them a
   session could expire and leave the user sitting on a signed-in-looking page. */
onUnauthorized(() => {
  if (!useAuthStore.getState().isAuthenticated) return;
  toast.error('Session expired. Please sign in again.');
  // stayOnPage: the interceptor owns the redirect.
  useAuthStore.getState().signOut(true);
});

/* The API client refreshed the access token (napiHttpHandler). The client
   already sends the new one; this keeps the store's session — read by e.g.
   DeviceDetailsContent — and the legacy stored session on it too. */
onTokenRefreshed((token) => {
  const { isAuthenticated, user } = useAuthStore.getState();
  if (!isAuthenticated || !user) return;
  const username = user.getUsername();
  const { mockSession } = toMockSession(username, token);
  useAuthStore.setState({ session: mockSession });
  if (loadStoredSession()) persistSession({ username, token });
});

/** Drop-in replacement for the old `useAuth()` context hook. */
export const useAuth = useAuthStore;
