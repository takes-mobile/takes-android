import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/Colors';

interface WalletSetupInfoProps {
  onPhantomDownload: () => void;
  onSolflareDownload: () => void;
  onSetupGuide: () => void;
}

export const WalletSetupInfo: React.FC<WalletSetupInfoProps> = ({
  onPhantomDownload,
  onSolflareDownload,
  onSetupGuide,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 20,
      margin: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerIcon: {
      marginRight: 12,
    },
    headerText: {
      flex: 1,
    },
    description: {
      marginBottom: 20,
      lineHeight: 22,
    },
    walletOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    walletIcon: {
      width: 40,
      height: 40,
      backgroundColor: colors.primary,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    walletInfo: {
      flex: 1,
    },
    walletName: {
      marginBottom: 4,
    },
    walletDescription: {
      color: colors.icon,
    },
    downloadIcon: {
      color: colors.primary,
    },
    setupButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    setupButtonText: {
      color: 'white',
      fontWeight: '600',
    },
    steps: {
      marginTop: 20,
      padding: 16,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepItem: {
      flexDirection: 'row',
      marginBottom: 12,
      alignItems: 'flex-start',
    },
    stepNumber: {
      width: 24,
      height: 24,
      backgroundColor: colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      marginTop: 2,
    },
    stepNumberText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    stepText: {
      flex: 1,
      lineHeight: 20,
    },
  });

  const walletOptions = [
    {
      name: 'Phantom',
      description: 'Popular and user-friendly wallet',
      icon: 'account-balance-wallet',
      onPress: onPhantomDownload,
    },
    {
      name: 'Solflare',
      description: 'Feature-rich Solana wallet',
      icon: 'wallet',
      onPress: onSolflareDownload,
    },
  ];

  const setupSteps = [
    'Download a wallet app from your app store',
    'Create a new wallet or import existing one',
    'Securely store your recovery phrase',
    'Return to this app and connect your wallet',
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons 
          name="info-outline" 
          size={24} 
          color={colors.primary} 
          style={styles.headerIcon}
        />
        <ThemedText type="subtitle" style={styles.headerText}>
          Setup Your Solana Wallet
        </ThemedText>
      </View>

      <ThemedText style={styles.description}>
        To get started with Solana, you&apos;ll need a wallet app. Choose one of the recommended options below:
      </ThemedText>

      {walletOptions.map((wallet, index) => (
        <TouchableOpacity
          key={index}
          style={styles.walletOption}
          onPress={wallet.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.walletIcon}>
            <MaterialIcons 
              name={wallet.icon as any} 
              size={20} 
              color="white" 
            />
          </View>
          <View style={styles.walletInfo}>
            <ThemedText type="defaultSemiBold" style={styles.walletName}>
              {wallet.name}
            </ThemedText>
            <ThemedText type="caption" style={styles.walletDescription}>
              {wallet.description}
            </ThemedText>
          </View>
          <MaterialIcons 
            name="download" 
            size={20} 
            style={styles.downloadIcon}
          />
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.setupButton} onPress={onSetupGuide}>
        <ThemedText style={styles.setupButtonText}>
          View Setup Guide
        </ThemedText>
      </TouchableOpacity>

      <View style={styles.steps}>
        <ThemedText type="defaultSemiBold" style={{ marginBottom: 12 }}>
          Quick Setup Steps:
        </ThemedText>
        {setupSteps.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <ThemedText style={styles.stepNumberText}>
                {index + 1}
              </ThemedText>
            </View>
            <ThemedText style={styles.stepText}>
              {step}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
};
