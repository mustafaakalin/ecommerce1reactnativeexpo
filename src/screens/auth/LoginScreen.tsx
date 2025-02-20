import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { loginSchema } from '../../schemas/auth.schema';
import { LoginFormData } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import { showMessage } from 'react-native-flash-message';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login, isLoading, googleAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Giriş başarılı, yönlendiriliyorsunuz.',
        position: 'bottom'
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        error.message === 'Network Error' 
          ? 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.' 
          : 'Giriş yapılırken bir hata oluştu.';
      
      showMessage({
        message: "Giriş Hatası",
        description: errorMessage,
        type: "danger",
        icon: "danger",
        duration: 4000
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleAuth(navigation);
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Google ile giriş başarılı',
        position: 'bottom'
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' as never }],
      });
    } catch (error: any) {
      showMessage({
        message: "Google Giriş Hatası",
        description: error.message || 'Google ile giriş yapılırken bir hata oluştu',
        type: "danger",
        icon: "danger",
        duration: 4000
      });
    }
  };

  return (
    <View className="flex-1 bg-white p-6">
      <Animated.View 
        entering={FadeInUp.delay(200).duration(1000).springify()}
        className="flex-1 justify-center"
      >
        <Text className="text-3xl font-bold text-center mb-8 text-blue-600">
          Hoş Geldiniz
        </Text>

        <Animated.View entering={FadeInDown.delay(400).duration(1000).springify()}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <View className="mb-4">
                <TextInput
                  className="p-4 border border-gray-300 rounded-lg bg-gray-50"
                  placeholder="E-posta"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={onChange}
                  value={value}
                />
                {errors.email && (
                  <Text className="text-red-500 mt-1">{errors.email.message}</Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <View className="mb-6">
                <View className="relative">
                  <TextInput
                    className="p-4 border border-gray-300 rounded-lg bg-gray-50 pr-12"
                    placeholder="Şifre"
                    secureTextEntry={!showPassword}
                    onChangeText={onChange}
                    value={value}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4"
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={24} 
                      color="gray" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text className="text-red-500 mt-1">{errors.password.message}</Text>
                )}
              </View>
            )}
          />

          <TouchableOpacity
            className={`${isLoading ? 'bg-blue-400' : 'bg-blue-600'} p-4 rounded-lg mb-4`}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-bold text-lg">
                Giriş Yap
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-red-500 p-4 rounded-lg mb-6 flex-row justify-center items-center space-x-2"
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            <Ionicons name="logo-google" size={24} color="white" />
            <Text className="text-white text-center font-bold text-lg ml-2">
              Google ile Giriş Yap
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register' as never)}
          >
            <Text className="text-center text-blue-600">
              Hesabınız yok mu? Kayıt Olun
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}