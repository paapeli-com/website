import axios from 'axios';

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
