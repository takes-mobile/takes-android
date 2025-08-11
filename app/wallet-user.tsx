import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WalletUserScreen } from '../components/WalletUserScreen';

export default function WalletUserRoute() {
  return (
    <View style={styles.container}>
      <WalletUserScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 