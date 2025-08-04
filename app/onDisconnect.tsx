import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function OnDisconnect() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // This route will be called when Phantom returns from disconnect
    // The actual processing is handled in UserScreen's deep link handler
    console.log('OnDisconnect route called with params:', params);
    
    // Navigate back to the main screen
    setTimeout(() => {
      router.replace('/');
    }, 100);
  }, [params, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Processing Phantom disconnect...</Text>
    </View>
  );
} 