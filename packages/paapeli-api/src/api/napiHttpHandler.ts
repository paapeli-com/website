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

export function setApiAuthToken(token: string | null) {
    if (token) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        delete apiClient.defaults.headers.common.Authorization;
    }
}

// A 401 from any product/remote means the shared session's token is dead —
// clear it and bounce to the shared login once, regardless of which app made
// the request (every remote bundles its own copy of this client, so this is
// the one place that can catch all of them). Guarded so a burst of parallel
// 401s only signs out/navigates once.
let loggedOutFor401 = false;
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401 && !loggedOutFor401) {
            loggedOutFor401 = true;
            setApiAuthToken(null);
            signOut();
            goToLogin();
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
