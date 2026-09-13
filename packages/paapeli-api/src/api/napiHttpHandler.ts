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

/* Whether the gateway is answering readably right now. Its only public endpoint
   is login, which returns a CORS-enabled 400 for an empty body — so any
   readable response proves the gateway is up and CORS works. Uses bare axios
   (no interceptors, no token) and is shared by a burst of failing requests. */
let reachabilityProbe: Promise<boolean> | null = null;
function gatewayReachable(): Promise<boolean> {
    if (!reachabilityProbe) {
        reachabilityProbe = axios
            .post(AUTH_ENDPOINTS[0], {}, { baseURL: apiClient.defaults.baseURL, timeout: 5000 })
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

/* A readable 401 means the token is dead. The gateway, though, omits CORS
   headers on its 401s, so cross-origin the browser hides the status and axios
   sees a bare network error (ERR_NETWORK, no `response`) — see
   apps/panel/src/shared/config.ts. That looks the same as being offline, so:
   an expired `exp` signs out at once; otherwise, if the gateway is provably
   reachable, the hidden status can only be its auth rejection, so sign out. */
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (isAuthRequest(error?.config?.url) || axios.isCancel(error)) {
            return Promise.reject(error);
        }
        if (error?.response?.status === 401) {
            expireSession();
        } else if (!error?.response && error?.code === 'ERR_NETWORK' && currentToken) {
            if (isTokenExpired(currentToken)) {
                expireSession();
            } else if (typeof navigator === 'undefined' || navigator.onLine) {
                void gatewayReachable().then((up) => {
                    if (up) expireSession();
                });
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
