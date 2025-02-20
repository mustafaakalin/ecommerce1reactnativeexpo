import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Animated, { FadeIn } from 'react-native-reanimated';
import Modal from 'react-native-modal';
import { showMessage } from 'react-native-flash-message';
import Toast from 'react-native-toast-message';

export default function HomeScreen() {
  const { logout, user, isLoading } = useAuth();
  const [isModalVisible, setModalVisible] = React.useState(false);

  const handleLogoutConfirm = async () => {
    try {
      setModalVisible(false);
      await logout();
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Başarıyla çıkış yapıldı',
        position: 'bottom'
      });
    } catch (error) {
      showMessage({
        message: "Hata",
        description: "Çıkış yapılırken bir hata oluştu. Lütfen tekrar deneyin.",
        type: "danger",
        icon: "danger"
      });
    }
  };

  return (
    <View className="flex-1 bg-white p-6">
      <Animated.View 
        entering={FadeIn.duration(1000)}
        className="flex-1 justify-center items-center"
      >
        <Text className="text-2xl mb-4">Hoş Geldiniz, {user?.name}</Text>
        <TouchableOpacity
          className="bg-red-500 px-8 py-4 rounded-lg"
          onPress={() => setModalVisible(true)}
          disabled={isLoading}
        >
          <Text className="text-white font-bold text-lg">
            {isLoading ? "Çıkış Yapılıyor..." : "Çıkış Yap"}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        onBackButtonPress={() => setModalVisible(false)}
        useNativeDriver
        className="m-0"
      >
        <View className="bg-white rounded-2xl p-6 items-center mx-4">
          <Text className="text-xl font-bold mb-4">Çıkış Yap</Text>
          <Text className="text-gray-600 mb-6 text-center">
            Çıkış yapmak istediğinizden emin misiniz?
          </Text>
          <View className="flex-row justify-end w-full space-x-4">
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="bg-gray-200 px-6 py-3 rounded-lg flex-1"
            >
              <Text className="text-gray-800 text-center font-medium">İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogoutConfirm}
              className="bg-red-500 px-6 py-3 rounded-lg flex-1"
            >
              <Text className="text-white text-center font-medium">Evet, Çıkış Yap</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}