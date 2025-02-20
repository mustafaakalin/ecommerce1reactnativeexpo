import * as yup from 'yup';
import { LoginFormData, RegisterFormData } from '../types/auth';

export const loginSchema: yup.ObjectSchema<LoginFormData> = yup.object({
    email: yup.string()
        .email('Geçerli bir e-posta adresi giriniz')
        .required('E-posta adresi zorunludur'),
    password: yup.string()
        .min(6, 'Şifre en az 6 karakter olmalıdır')
        .required('Şifre zorunludur'),
});

export const registerSchema: yup.ObjectSchema<RegisterFormData> = yup.object({
    name: yup.string()
        .min(2, 'İsim en az 2 karakter olmalıdır')
        .required('İsim zorunludur'),
    email: yup.string()
        .email('Geçerli bir e-posta adresi giriniz')
        .required('E-posta adresi zorunludur'),
    password: yup.string()
        .min(6, 'Şifre en az 6 karakter olmalıdır')
        .required('Şifre zorunludur'),
    password_confirmation: yup.string()
        .oneOf([yup.ref('password')], 'Şifreler eşleşmiyor')
        .required('Şifre tekrarı zorunludur'),
});