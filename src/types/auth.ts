export interface LoginFormData {
    email: string;
    password: string;
}

export interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface User {
    id: number;
    name: string;
    surname: string | null;
    email: string;
    identity_number: string | null;
    avatar: string | null;
    instagram_account: string | null;
    facebook_account: string | null;
    tiktok_account: string | null;
    x_account: string | null;
    created_at: string;
    updated_at: string;
    addresses: any[];
    orders: any[];
}

export interface AuthResponse {
    user: User;
    token: string;
    token_type: string;
    expires_in: number;
}