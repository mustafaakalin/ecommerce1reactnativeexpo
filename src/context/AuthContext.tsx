import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, User } from '../types/auth';
import { authApi } from '../config/api';
import axios, { AxiosError } from 'axios';
import { showMessage } from 'react-native-flash-message';
import { useGoogleAuth } from '../services/googleAuth';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>;
    logout: () => Promise<void>;
    googleAuth: (navigation: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Changed to true for initial load
    const [error, setError] = useState<string | null>(null);

    // Check for stored user data when app starts
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const userJson = await AsyncStorage.getItem('user_data');
                if (userJson) {
                    const userData = JSON.parse(userJson);
                    setUser(userData);
                }
            } catch (error) {
                console.error('Error loading stored auth:', error);
                showMessage({
                    message: "Hata",
                    description: "Oturum bilgileri yüklenirken hata oluştu",
                    type: "danger"
                });
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const handleApiError = (error: unknown) => {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            if (!axiosError.response) {
                throw new Error('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
            }
            const status = axiosError.response.status;
            const data = axiosError.response.data as any;

            switch (status) {
                case 401:
                    throw new Error(data.message || 'Geçersiz kimlik bilgileri');
                case 422:
                    throw new Error(data.message || 'Geçersiz veri');
                default:
                    throw new Error(data.message || 'Bir hata oluştu');
            }
        }
        throw error;
    };

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await authApi.login({ email, password });
            const authData = data as AuthResponse;
            await AsyncStorage.setItem('user_data', JSON.stringify(authData.user));
            setUser(authData.user);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (name: string, email: string, password: string, password_confirmation: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await authApi.register({ name, email, password, password_confirmation });
            const authData = data as AuthResponse;
            await AsyncStorage.setItem('user_data', JSON.stringify(authData.user));
            setUser(authData.user);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            await authApi.logout();
            await AsyncStorage.removeItem('user_data');
            setUser(null);
        } catch (error) {
            if (error.message === 'No token found') {
                // Token yoksa sessizce çıkış yap
                setUser(null);
                return;
            }
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const { signInWithGoogle, isLoading: isGoogleLoading } = useGoogleAuth();

    const googleAuth = useCallback(async (navigation: any) => {
        if (isLoading || isGoogleLoading) return;
        
        setIsLoading(true);
        setError(null);
        try {
            console.log('Starting Google Auth process...');
            const { accessToken, idToken } = await signInWithGoogle();
            
            if (!accessToken || !idToken) {
                throw new Error('Google girişi başarısız oldu: Token bulunamadı');
            }

            console.log('Google tokens received, calling backend...');
            const { data } = await authApi.googleAuth(accessToken, idToken);
            
            if (!data?.user) {
                throw new Error('Sunucu yanıtı geçersiz');
            }

            console.log('Backend auth successful, setting user data...');
            await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
            setUser(data.user);

            // Başarılı giriş sonrası doğrudan Home'a yönlendir
            if (navigation) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });
            }
            
            return data;
        } catch (error) {
            console.error('Google Auth Error:', error);
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    }, [isGoogleLoading, isLoading]);

    return (
        <AuthContext.Provider value={{ 
            user, 
            isLoading, 
            error, 
            login, 
            register, 
            logout,
            googleAuth 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};