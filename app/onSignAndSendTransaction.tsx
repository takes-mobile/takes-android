import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function OnSignAndSendTransaction() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // This route will be called when Phantom returns from transaction
    // The actual processing is handled in UserScreen's deep link handler
    console.log('OnSignAndSendTransaction route called with params:', params);
    
    // Navigate back to the main screen
    setTimeout(() => {
      router.replace('/');
    }, 100);
  }, [params, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Processing transaction...</Text>
    </View>
  );
} 