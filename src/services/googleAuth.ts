import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

// Google OAuth client IDs configuration
GoogleSignin.configure({
    webClientId: '489349235744-cnbmmip4585gjpftd4pt655clvatid5a.apps.googleusercontent.com', // client_type: 3 from google-services.json
    offlineAccess: true
});

export const useGoogleAuth = () => {
    const checkPlayServices = async () => {
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            return true;
        } catch (error) {
            console.error('Play Services Check Error:', error);
            throw error;
        }
    };

    const signInWithGoogle = async () => {
        try {
            console.log('Starting Google Sign-In Process...');
            
            // Check Play Services
            await checkPlayServices();
            console.log('Play Services Check Passed');

            // Sign out first to ensure clean state
            try {
                await GoogleSignin.signOut();
                console.log('Previous sign-in cleared');
            } catch (signOutError) {
                console.log('No previous sign-in to clear');
            }

            // Get user info
            console.log('Requesting Google Sign In...');
            const userInfo = await GoogleSignin.signIn();
            console.log('Google Sign In Success:', {
                email: userInfo.user.email,
                id: userInfo.user.id,
                hasIdToken: !!userInfo.idToken
            });

            if (!userInfo.idToken) {
                throw new Error('Google authentication failed: Missing ID token');
            }

            // Get tokens
            const tokens = await GoogleSignin.getTokens();
            console.log('Tokens Retrieved:', {
                hasAccessToken: !!tokens.accessToken,
                hasIdToken: !!userInfo.idToken
            });

            return {
                user: userInfo.user,
                accessToken: tokens.accessToken,
                idToken: userInfo.idToken
            };
        } catch (error: any) {
            console.error('Google Sign-In Error Details:', {
                code: error.code,
                message: error.message,
                nativeError: error?.nativeError,
                stack: error.stack
            });

            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                throw new Error('Google girişi iptal edildi');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                throw new Error('Google girişi zaten devam ediyor');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                throw new Error('Google Play Servisleri kullanılamıyor veya güncel değil');
            } else if (error.code === 10) { // DEVELOPER_ERROR
                throw new Error('SHA-1 parmak izi veya paket adı yapılandırması hatalı. Lütfen Firebase Console\'da yapılandırmayı kontrol edin.');
            } else {
                throw new Error(error.message || 'Google girişi başarısız oldu');
            }
        }
    };

    const signOut = async () => {
        try {
            await GoogleSignin.revokeAccess();
            await GoogleSignin.signOut();
            console.log('Google Sign Out Success');
        } catch (error) {
            console.error('Google Sign Out Error:', error);
            throw error;
        }
    };

    return {
        signInWithGoogle,
        signOut
    };
};