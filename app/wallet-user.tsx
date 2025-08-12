import React from 'react';
import { View, StyleSheet } from 'react-native';
import { UserScreen } from '../components/UserScreen';

export default function WalletUserRoute() {
  return (
    <View style={styles.container}>
      <UserScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 