import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useContext } from 'react';
import { ThemeContext } from '../app/_layout';

export const WalletStatusIndicator = () => {
  const { connected, address, formatAddress } = useWalletConnection();
  const { theme: themeName } = useContext(ThemeContext);
  const router = useRouter();

  if (!connected || !address) {
    return null;
  }

  const lightTheme = {
    background: 'rgba(255, 255, 255, 0.95)',
    border: '#e5e7eb',
    text: '#000',
    primary: '#22c55e',
    shadow: '#000',
  };

  const darkTheme = {
    background: 'rgba(45, 38, 64, 0.95)',
    border: '#4a3f66',
    text: '#fff',
    primary: '#8b5cf6',
    shadow: '#130f1c',
  };

  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  return (
    <Text>Wallet Connected</Text>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
    maxWidth: 200,
  },
  iconContainer: {
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
    marginRight: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  address: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 1,
  },
}); 