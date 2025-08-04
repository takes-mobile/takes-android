import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Replace the content with this simpler version:
export default function onSignTransaction() {
  const params = useLocalSearchParams();

  useEffect(() => {
    console.log('OnSignTransaction route called with params:', params);
    // Don't automatically navigate - let the deep link handler manage this
  }, [params]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e1a2c' }}>
      <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'PressStart2P-Regular' }}>
        Processing Phantom connection...
      </Text>
    </View>
  );
}