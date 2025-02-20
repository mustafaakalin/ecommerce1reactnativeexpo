import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { showMessage } from 'react-native-flash-message';

const BASE_URL = Platform.select({
    android: 'http://192.168.1.12:2121/api/v1',
    ios: 'http://akalintech.test:2121/api/v1',
    default: 'http://akalintech.test:2121/api/v1'
});

interface TokenData {
    token: string;
    expiresAt: number; // Unix timestamp
}

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Token utilities
const TOKEN_KEY = '@auth_token';
const TOKEN_EXPIRY_KEY = '@auth_token_expiry';
const USER_DATA_KEY = '@user_data';

const storeToken = async (token: string, expiresIn: number) => {
    try {
        const expiresAt = Date.now() + expiresIn * 60 * 1000; // expiresIn is in minutes
        await AsyncStorage.multiSet([
            [TOKEN_KEY, token],
            [TOKEN_EXPIRY_KEY, expiresAt.toString()]
        ]);
    } catch (error) {
        console.error('Error storing token:', error);
        showMessage({
            message: "Hata",
            description: "Token kaydedilirken bir hata oluştu",
            type: "danger"
        });
    }
};

const getStoredToken = async (): Promise<TokenData | null> => {
    try {
        const [[, token], [, expiresAtStr]] = await AsyncStorage.multiGet([TOKEN_KEY, TOKEN_EXPIRY_KEY]);
        
        if (!token || !expiresAtStr) {
            return null;
        }

        return {
            token,
            expiresAt: parseInt(expiresAtStr)
        };
    } catch (error) {
        console.error('Error getting stored token:', error);
        return null;
    }
};

const clearAuthData = async () => {
    try {
        await AsyncStorage.multiRemove([TOKEN_KEY, TOKEN_EXPIRY_KEY, USER_DATA_KEY]);
    } catch (error) {
        console.error('Error clearing auth data:', error);
    }
};

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    try {
        const tokenData = await getStoredToken();
        if (tokenData?.token) {
            config.headers.Authorization = `Bearer ${tokenData.token}`;
        }
    } catch (error) {
        console.error('Request interceptor error:', error);
    }
    return config;
});

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest: any = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                try {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    });
                } catch (err) {
                    return Promise.reject(err);
                }
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const tokenData = await getStoredToken();
                if (!tokenData?.token) {
                    throw new Error('No token available for refresh');
                }

                const response = await api.get('/auth/refresh');
                const { token, expires_in } = response.data;
                
                await storeToken(token, expires_in);
                
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                originalRequest.headers.Authorization = `Bearer ${token}`;
                
                processQueue();
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                await clearAuthData();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export const authApi = {
    login: async (data: { email: string; password: string }) => {
        try {
            const response = await api.post('/auth/login', data);
            const { token, expires_in, user } = response.data;
            await Promise.all([
                storeToken(token, expires_in),
                AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user))
            ]);
            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },
    
    register: async (data: { name: string; email: string; password: string; password_confirmation: string }) => {
        try {
            const response = await api.post('/auth/register', data);
            const { token, expires_in, user } = response.data;
            await Promise.all([
                storeToken(token, expires_in),
                AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user))
            ]);
            return response;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },
    
    logout: async () => {
        try {
            const tokenData = await getStoredToken();
            if (!tokenData?.token) {
                await clearAuthData();
                return;
            }
            
            await api.post('/auth/logout');
            await clearAuthData();
        } catch (error) {
            console.error('Logout error:', error);
            await clearAuthData(); // Clear data even if the request fails
            throw error;
        }
    },
    
    googleAuth: async (accessToken: string, idToken: string) => {
        try {
            const redirectResponse = await api.post('/auth/google/redirect', {
                access_token: accessToken,
                id_token: idToken
            });

            const { token, expires_in, user } = redirectResponse.data;
            
            await Promise.all([
                storeToken(token, expires_in),
                AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user))
            ]);
            
            return redirectResponse;
        } catch (error) {
            console.error('Google auth error:', error);
            throw error;
        }
    }
};