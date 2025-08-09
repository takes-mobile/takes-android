import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '../components/ThemedText';
import { WalletConnectButton } from './WalletConnectButton';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/Colors';

interface WalletConnectProps {
  onConnectionChange?: (connected: boolean, address?: string | null) => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnectionChange,
  variant = 'primary',
  size = 'medium',
  style,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [refreshing, setRefreshing] = useState(false);

  const {
    connected,
    connecting,
    address,
    error,
    connectWallet,
    disconnectWallet,
    formatAddress,
  } = useWalletConnection();

  // Notify parent component of connection changes
  React.useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(connected, address);
    }
  }, [connected, address, onConnectionChange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Add any refresh logic here if needed
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleRetryConnection = () => {
    connectWallet();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    statusCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusIcon: {
      marginRight: 12,
    },
    statusTitle: {
      flex: 1,
    },
    statusDescription: {
      marginBottom: 16,
      lineHeight: 22,
    },
    addressContainer: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addressLabel: {
      marginBottom: 4,
      color: colors.icon,
    },
    addressText: {
      fontFamily: 'monospace',
      fontSize: 14,
    },
    errorCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.error,
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
    },
    errorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    errorIcon: {
      marginRight: 8,
    },
    errorTitle: {
      color: colors.error,
      fontWeight: 'bold',
    },
    errorText: {
      color: colors.error,
      lineHeight: 20,
      marginBottom: 12,
    },
    retryButton: {
      backgroundColor: colors.error,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    retryButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 12,
    },
    buttonContainer: {
      marginBottom: 20,
    },
    walletActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionButton: {
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 80,
    },
    actionIcon: {
      marginBottom: 4,
    },
    actionText: {
      fontSize: 12,
      textAlign: 'center',
    },
  });

  const renderWalletStatus = () => {
    if (connected && address) {
      return (
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <MaterialIcons 
              name="check-circle" 
              size={24} 
              color={colors.success} 
              style={styles.statusIcon}
            />
            <ThemedText type="subtitle" style={styles.statusTitle}>
              Wallet Connected
            </ThemedText>
          </View>
          
          <ThemedText style={styles.statusDescription}>
            Your Solana wallet is successfully connected and ready to use.
          </ThemedText>

          <View style={styles.addressContainer}>
            <ThemedText type="caption" style={styles.addressLabel}>
              Wallet Address:
            </ThemedText>
            <ThemedText style={styles.addressText}>
              {address}
            </ThemedText>
          </View>

          <View style={styles.walletActions}>
            <View style={styles.actionButton}>
              <MaterialIcons 
                name="account-balance-wallet" 
                size={20} 
                color={colors.icon} 
                style={styles.actionIcon}
              />
              <ThemedText style={styles.actionText}>
                {formatAddress(6)}
              </ThemedText>
            </View>
            
            <View style={styles.actionButton}>
              <MaterialIcons 
                name="security" 
                size={20} 
                color={colors.success} 
                style={styles.actionIcon}
              />
              <ThemedText style={styles.actionText}>
                Secured
              </ThemedText>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <MaterialIcons 
            name="account-balance-wallet" 
            size={24} 
            color={colors.icon} 
            style={styles.statusIcon}
          />
          <ThemedText type="subtitle" style={styles.statusTitle}>
            Connect Your Wallet
          </ThemedText>
        </View>
        
        <ThemedText style={styles.statusDescription}>
          Connect your Solana wallet to start using the app. Make sure you have a wallet app installed.
        </ThemedText>
      </View>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <View style={styles.errorCard}>
        <View style={styles.errorHeader}>
          <MaterialIcons 
            name="error-outline" 
            size={20} 
            color={colors.error} 
            style={styles.errorIcon}
          />
          <ThemedText style={styles.errorTitle}>
            Connection Error
          </ThemedText>
        </View>
        
        <ThemedText style={styles.errorText}>
          {error}
        </ThemedText>
        
        <WalletConnectButton
          connected={false}
          connecting={false}
          onConnect={handleRetryConnection}
          onDisconnect={() => {}}
          variant="outline"
          size="small"
          showAddress={false}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderWalletStatus()}
        {renderError()}
        
        <View style={styles.buttonContainer}>
          <WalletConnectButton
            connected={connected}
            connecting={connecting}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
            address={address}
            variant={variant}
            size={size}
            showAddress={true}
          />
        </View>
      </ScrollView>
    </View>
  );
};
