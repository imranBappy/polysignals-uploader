import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from './env';

export const api = axios.create({
    baseURL: `${env.expressBaseUrl}/api`,
    timeout: 30000,
});

// Request Interceptor
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Logging for development
        if (process.env.NODE_ENV === 'development') {
            console.log(
                `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
            );
        }

        // Inject API key into header for all requests
        if (!config.headers['x-api-key']) {
            config.headers['x-api-key'] = env.clientApiKey;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Response Interceptor
api.interceptors.response.use(
    (response) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(
                `[API Response] ${response.status} ${response.config.url}`,
            );
        }
        return response;
    },
    (error: AxiosError) => {
        const message =
            (error.response?.data as any)?.message ||
            error.message ||
            'An unexpected error occurred';

        if (process.env.NODE_ENV === 'development') {
            console.log(
                `[API Error] ${error.response?.status} ${error.config?.url}:`,
                message,
            );
        }

        // You can handle specific status codes here
        if (error.response?.status === 401) {
            // Handle unauthorized - e.g., redirect to login or clear store
            console.warn('Unauthorized access - potential token expiration');
        }

        return Promise.reject({
            ...error,
            message,
            status: error.response?.status,
        });
    },
);

export const setApiAuth = (firebaseIdToken: string | null) => {
    if (!firebaseIdToken) {
        delete api.defaults.headers.common.Authorization;
        return;
    }
    api.defaults.headers.common.Authorization = `Bearer ${firebaseIdToken}`;
};

export type SupabaseTokenExchangeResponse = {
    supabaseToken: string;
};

export const exchangeFirebaseToSupabaseToken = async (
    firebaseIdToken: string,
) => {
    const res = await api.post<SupabaseTokenExchangeResponse>(
        '/auth/supabase-token',
        null,
        {
            headers: { Authorization: `Bearer ${firebaseIdToken}` },
        },
    );
    return res.data.supabaseToken;
};
