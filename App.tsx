import React, { useEffect } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import "./assets/css/global.css";
import FlashMessage from 'react-native-flash-message';
import Toast from 'react-native-toast-message';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { user, isLoading } = useAuth();
  const navigation = useNavigation();

  // Kullanıcı durumu değiştiğinde navigasyonu güncelle
  useEffect(() => {
    if (user) {
      // Kullanıcı giriş yaptığında tüm stack'i temizle ve Home'a yönlendir
      navigation?.reset({
        index: 0,
        routes: [{ name: 'Home' as never }],
      });
    }
  }, [user, navigation]);

  if (isLoading) {
    return null; // veya bir loading spinner
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <Stack.Screen name="Home" component={HomeScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <AppContent />
        <FlashMessage position="top" />
        <Toast />
      </AuthProvider>
    </NavigationContainer>
  );
}
