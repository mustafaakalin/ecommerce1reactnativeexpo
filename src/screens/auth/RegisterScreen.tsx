import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { registerSchema } from '../../schemas/auth.schema';
import { RegisterFormData } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import { showMessage } from 'react-native-flash-message';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register, isLoading, googleAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: ''
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register(data.name, data.email, data.password, data.password_confirmation);
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Kayıt başarılı, giriş yapılıyor.',
        position: 'bottom'
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        error.message === 'Network Error' 
          ? 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.' 
          : 'Kayıt olurken bir hata oluştu.';
      
      showMessage({
        message: "Kayıt Hatası",
        description: errorMessage,
        type: "danger",
        icon: "danger",
        duration: 4000
      });
    }
  };

  const handleGoogleRegister = async () => {
    try {
      await googleAuth(navigation);
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Google ile kayıt başarılı',
        position: 'bottom'
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' as never }],
      });
    } catch (error: any) {
      showMessage({
        message: "Google Kayıt Hatası",
        description: error.message || 'Google ile kayıt olurken bir hata oluştu',
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
          Hesap Oluştur
        </Text>

        <Animated.View entering={FadeInDown.delay(400).duration(1000).springify()}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <View className="mb-4">
                <TextInput
                  className="p-4 border border-gray-300 rounded-lg bg-gray-50"
                  placeholder="Ad Soyad"
                  onChangeText={onChange}
                  value={value}
                />
                {errors.name && (
                  <Text className="text-red-500 mt-1">{errors.name.message}</Text>
                )}
              </View>
            )}
          />

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
              <View className="mb-4">
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

          <Controller
            control={control}
            name="password_confirmation"
            render={({ field: { onChange, value } }) => (
              <View className="mb-6">
                <View className="relative">
                  <TextInput
                    className="p-4 border border-gray-300 rounded-lg bg-gray-50 pr-12"
                    placeholder="Şifre Tekrarı"
                    secureTextEntry={!showConfirmPassword}
                    onChangeText={onChange}
                    value={value}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-4"
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={24} 
                      color="gray" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password_confirmation && (
                  <Text className="text-red-500 mt-1">{errors.password_confirmation.message}</Text>
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
                Kayıt Ol
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-red-500 p-4 rounded-lg mb-6 flex-row justify-center items-center space-x-2"
            onPress={handleGoogleRegister}
            disabled={isLoading}
          >
            <Ionicons name="logo-google" size={24} color="white" />
            <Text className="text-white text-center font-bold text-lg ml-2">
              Google ile Kayıt Ol
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text className="text-center text-blue-600">
              Zaten hesabınız var mı? Giriş Yapın
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}