import axios, { type InternalAxiosRequestConfig } from 'axios';
import { getToken, goToLogin, signOut, subscribeToken, updateToken } from '@paapeli/brand/session';

declare module 'axios' {
    export interface AxiosRequestConfig {
        /** Suppress global error toasts/notifications for this request. */
        quiet?: boolean;
        /** Set once a request has been replayed after a token refresh. */
        retriedAfterRefresh?: boolean;
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

/* Endpoints that are allowed to 401 without meaning "session dead": signing in
   with a wrong password, and the refresh-cookie calls themselves. None of them
   may trigger a refresh or a sign-out — a failing refresh would otherwise try
   to refresh itself. Login stays first: the reachability probe below uses it. */
const AUTH_ENDPOINTS = [
    '/api/v1/aiot/auth/login',
    '/api/v1/aiot/user/signup',
    '/api/v1/aiot/auth/google',
    '/api/v1/aiot/auth/refresh',
    '/api/v1/aiot/auth/logout',
    '/api/v1/aiot/auth/logout-all',
];
const REFRESH_URL = '/api/v1/aiot/auth/refresh';
const isAuthRequest = (url: string | undefined) =>
    !!url && AUTH_ENDPOINTS.some((p) => url.includes(p));

/* Treat a token as expired this long before its `exp`, so a request doesn't
   leave with a token that dies in flight. */
const EXPIRY_SKEW_MS = 10_000;

/* True when the JWT's `exp` claim has passed (less the skew). A token that
   isn't a JWT or has no `exp` is never treated as expired — only the server
   can judge it. */
function isTokenExpired(token: string | null): boolean {
    if (!token) return false;
    try {
        const payload = token.split('.')[1];
        if (!payload) return false;
        const { exp } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
            exp?: number;
        };
        return typeof exp === 'number' && Date.now() >= exp * 1000 - EXPIRY_SKEW_MS;
    } catch {
        return false;
    }
}

/* ------------------------------------------------------------------ */
/* Refresh. The refresh token is an HttpOnly cookie the gateway sets   */
/* on login and rotates on every POST /auth/refresh, returning a new   */
/* access token. An expired or rejected access token is refreshed and  */
/* the request retried once; only if the refresh itself fails is the   */
/* user signed out.                                                    */
/* ------------------------------------------------------------------ */

/* Apps that hold their own copy of the token (e.g. a store) register here to
   hear about the new one. */
type TokenRefreshedHandler = (token: string) => void;
const tokenRefreshedHandlers = new Set<TokenRefreshedHandler>();

export function onTokenRefreshed(handler: TokenRefreshedHandler): () => void {
    tokenRefreshedHandlers.add(handler);
    return () => {
        tokenRefreshedHandlers.delete(handler);
    };
}

function adoptToken(token: string) {
    setApiAuthToken(token);
    tokenRefreshedHandlers.forEach((handler) => {
        try {
            handler(token);
        } catch {
            /* one bad handler must not break the others */
        }
    });
}

/* Rotation makes a refresh single-use: two tabs refreshing with the same
   cookie would present a spent token, which the gateway may read as theft and
   revoke the whole family. So refreshes are serialised across tabs with a Web
   Lock, and a tab that waited checks whether another already rotated. Browsers
   without Web Locks just refresh (in-tab calls are still shared, below). */
async function withRefreshLock(fn: () => Promise<string | null>): Promise<string | null> {
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    return locks ? await locks.request('paapeli-token-refresh', fn) : fn();
}

/* One refresh at a time in this tab: a burst of failing requests shares it. */
let refreshing: Promise<string | null> | null = null;

/** A fresh access token, or null when the session can't be refreshed.
    `staleToken` is the one that failed, to tell whether another tab has
    already replaced it. */
function refreshAccessToken(staleToken: string | null): Promise<string | null> {
    if (!refreshing) {
        refreshing = withRefreshLock(async () => {
            const stored = getToken();
            if (stored && stored !== staleToken && !isTokenExpired(stored)) {
                adoptToken(stored);
                return stored;
            }
            try {
                // Sent without Authorization — see the request interceptor.
                const { data } = await apiClient.post<{ token?: string }>(REFRESH_URL, undefined, {
                    withCredentials: true,
                    quiet: true,
                });
                if (!data?.token) return null;
                updateToken(data.token);
                adoptToken(data.token);
                return data.token;
            } catch {
                return null;
            }
        }).finally(() => {
            refreshing = null;
        });
    }
    return refreshing;
}

/* Another tab refreshed: use its token here too. */
subscribeToken((token) => {
    if (token && token !== currentToken) adoptToken(token);
});

/* The session is beyond saving: clear it, drop the shared session, let the
   app tear down its own state, then bounce to the shared login. Guarded so a
   burst of parallel failures only signs out once. */
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

const bearerOf = (config: InternalAxiosRequestConfig | undefined) => {
    const header = config?.headers?.Authorization;
    return typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : null;
};

/* Don't send a request whose token has already expired — refresh first, and
   only sign out if that fails. */
apiClient.interceptors.request.use(async (config) => {
    /* The refresh is authenticated by its HttpOnly cookie alone; the gateway
       answers 401 if it also carries a bearer token. The client's defaults
       are already merged into `config` here, so dropping the one header keeps
       everything else the client sends (base URL, other headers, cookies via
       withCredentials). */
    if (config.url?.includes(REFRESH_URL)) {
        config.headers.delete('Authorization');
        return config;
    }
    if (isAuthRequest(config.url) || !isTokenExpired(currentToken)) return config;
    const token = await refreshAccessToken(currentToken);
    if (!token) {
        expireSession();
        return Promise.reject(new axios.CanceledError('Session expired'));
    }
    config.headers.Authorization = `Bearer ${token}`;
    return config;
});

/* Whether the gateway is answering readably right now. Its only public endpoint
   is login, which returns a CORS-enabled 400 for an empty body — so any
   readable response proves the gateway is up and CORS works. Uses bare axios
   (no interceptors, no token) and is shared by a burst of failing requests. */
let reachabilityProbe: Promise<boolean> | null = null;
function gatewayReachable(): Promise<boolean> {
    if (!reachabilityProbe) {
        reachabilityProbe = axios
            .post(AUTH_ENDPOINTS[0]!, {}, { baseURL: apiClient.defaults.baseURL, timeout: 5000 })
            .then(
                () => true,
                (e) => !!e?.response,
            )
            .finally(() => {
                setTimeout(() => {
                    reachabilityProbe = null;
                }, 10_000);
            });
    }
    return reachabilityProbe;
}

/* The access token was rejected: refresh and replay the request once. A
   request that already went round once and failed again means the refreshed
   session is refused too — sign out. */
async function refreshAndRetry(error: any) {
    const config: InternalAxiosRequestConfig | undefined = error?.config;
    if (!config || config.retriedAfterRefresh) {
        expireSession();
        return Promise.reject(error);
    }
    const token = await refreshAccessToken(bearerOf(config) ?? currentToken);
    if (!token) {
        expireSession();
        return Promise.reject(error);
    }
    config.retriedAfterRefresh = true;
    config.headers.Authorization = `Bearer ${token}`;
    return apiClient.request(config);
}

/* A readable 401 means the access token was rejected. The gateway, though,
   omits CORS headers on its 401s, so cross-origin the browser hides the status
   and axios sees a bare network error (ERR_NETWORK, no `response`) — see
   apps/panel/src/shared/config.ts. That looks the same as being offline, so:
   an expired `exp` counts as a 401 at once; otherwise, if the gateway is
   provably reachable, the hidden status can only be its auth rejection. */
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (isAuthRequest(error?.config?.url) || axios.isCancel(error)) {
            return Promise.reject(error);
        }
        if (error?.response?.status === 401) {
            return refreshAndRetry(error);
        }
        if (!error?.response && error?.code === 'ERR_NETWORK' && currentToken) {
            if (isTokenExpired(bearerOf(error?.config) ?? currentToken)) {
                return refreshAndRetry(error);
            }
            if (typeof navigator === 'undefined' || navigator.onLine) {
                if (await gatewayReachable()) return refreshAndRetry(error);
            }
        }
        return Promise.reject(error);
    },
);

export interface HttpOptions {
    quiet?: boolean;
    /** Send cookies cross-origin — needed by the HttpOnly refresh-token calls. */
    withCredentials?: boolean;
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
        return apiClient.post<T>(url, body, {
            quiet: options?.quiet,
            withCredentials: options?.withCredentials,
        });
    },
    put<T = unknown>(url: string, body?: unknown, options?: HttpOptions) {
        return apiClient.put<T>(url, body, { quiet: options?.quiet });
    },
    del<T = unknown>(url: string, options?: HttpOptions) {
        return apiClient.delete<T>(url, { quiet: options?.quiet });
    },
};

export default napiHttpHandler;
