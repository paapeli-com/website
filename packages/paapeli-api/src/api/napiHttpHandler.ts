import axios from 'axios';
import { goToLogin, signOut } from '@paapeli/brand/session';

declare module 'axios' {
    export interface AxiosRequestConfig {
        /** Suppress global error toasts/notifications for this request. */
        quiet?: boolean;
    }
}

export const apiClient = axios.create();

export function setApiBaseUrl(baseUrl: string) {
    apiClient.defaults.baseURL = baseUrl;
}

/* The token currently attached to the client, kept so its `exp` can be read. */
let currentToken: string | null = null;

export function setApiAuthToken(token: string | null) {
    currentToken = token;
    if (token) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
        // A new token starts a new session, so re-arm the 401 handling. Without
        // this the latch below is one-shot for the life of the page: a single
        // early 401 (e.g. a request that raced the session restore) would leave
        // it stuck on, and no later expiry would ever sign anybody out.
        signedOutFor401 = false;
    } else {
        delete apiClient.defaults.headers.common.Authorization;
    }
}

/* Extra cleanup to run when a 401 signs the user out — an app registers its
   own store/provider teardown here rather than adding a second interceptor.
   Two interceptors racing each other is how this drifted before: each had its
   own idea of what "sign out" meant and its own guard condition. */
type UnauthorizedHandler = () => void;
const unauthorizedHandlers = new Set<UnauthorizedHandler>();

export function onUnauthorized(handler: UnauthorizedHandler): () => void {
    unauthorizedHandlers.add(handler);
    return () => {
        unauthorizedHandlers.delete(handler);
    };
}

/* Signing in is allowed to 401 — that is "wrong password", not "session dead".
   Treating it as an expiry would clear the session and reload /login, throwing
   away the error the form is about to show. */
const AUTH_ENDPOINTS = ['/api/v1/aiot/auth/login', '/api/v1/aiot/user/signup'];
const isAuthRequest = (url: string | undefined) =>
    !!url && AUTH_ENDPOINTS.some((p) => url.includes(p));

/* True when the JWT's `exp` claim has passed. A token that isn't a JWT or has
   no `exp` is never treated as expired — only the server can judge it. */
function isTokenExpired(token: string | null): boolean {
    if (!token) return false;
    try {
        const payload = token.split('.')[1];
        if (!payload) return false;
        const { exp } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
            exp?: number;
        };
        return typeof exp === 'number' && Date.now() >= exp * 1000;
    } catch {
        return false;
    }
}

/* The token is dead: clear it, drop the shared session, let the app tear down
   its own state, then bounce to the shared login. Guarded so a burst of
   parallel failures only signs out once. */
let signedOutFor401 = false;
function expireSession() {
    if (signedOutFor401) return;
    signedOutFor401 = true;
    setApiAuthToken(null);
    signOut();
    unauthorizedHandlers.forEach((handler) => {
        // One bad handler must not stop the redirect below.
        try {
            handler();
        } catch {
            /* ignore */
        }
    });
    goToLogin();
}

/* Don't send a request whose token has already expired — sign out instead. */
apiClient.interceptors.request.use((config) => {
    if (!isAuthRequest(config.url) && isTokenExpired(currentToken)) {
        expireSession();
        return Promise.reject(new axios.CanceledError('Session expired'));
    }
    return config;
});

/* A readable 401 means the token is dead. The gateway, though, omits CORS
   headers on its 401s, so cross-origin the browser hides the status and axios
   sees a network error with no `response` (see apps/panel/src/shared/config.ts).
   Such an error can't be told apart from being offline, so it only signs out
   when the token's own `exp` confirms the session is over. */
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!isAuthRequest(error?.config?.url)) {
            const status = error?.response?.status;
            const opaque = !error?.response && !axios.isCancel(error);
            if (status === 401 || (opaque && isTokenExpired(currentToken))) {
                expireSession();
            }
        }
        return Promise.reject(error);
    },
);

export interface HttpOptions {
    quiet?: boolean;
}

const napiHttpHandler = {
    get<T = unknown>(
        url: string,
        params?: Record<string, unknown>,
        options?: HttpOptions,
    ) {
        return apiClient.get<T>(url, { params, quiet: options?.quiet });
    },
    post<T = unknown>(url: string, body?: unknown, options?: HttpOptions) {
        return apiClient.post<T>(url, body, { quiet: options?.quiet });
    },
    put<T = unknown>(url: string, body?: unknown, options?: HttpOptions) {
        return apiClient.put<T>(url, body, { quiet: options?.quiet });
    },
    del<T = unknown>(url: string, options?: HttpOptions) {
        return apiClient.delete<T>(url, { quiet: options?.quiet });
    },
};

export default napiHttpHandler;
