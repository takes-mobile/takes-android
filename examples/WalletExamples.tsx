import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { WalletConnect } from '../components/WalletConnect';
import { WalletConnectButton } from '../components/WalletConnectButton';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { ThemedText } from '../components/ThemedText';

/**
 * Example 1: Simple Wallet Connect Button
 */
export const SimpleWalletExample = () => {
  const {
    connected,
    connecting,
    address,
    connectWallet,
    disconnectWallet,
  } = useWalletConnection();

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Simple Wallet Connection
      </ThemedText>
      
      <WalletConnectButton
        connected={connected}
        connecting={connecting}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        address={address}
        variant="primary"
        size="medium"
        showAddress={true}
      />
      
      {connected && address && (
        <View style={styles.statusContainer}>
          <ThemedText type="subtitle">Wallet Connected!</ThemedText>
          <ThemedText type="caption">Address: {address}</ThemedText>
        </View>
      )}
    </View>
  );
};

/**
 * Example 2: Full Wallet Interface
 */
export const FullWalletExample = () => {
  const handleConnectionChange = (connected: boolean, address?: string | null) => {
    console.log('Wallet connection changed:', { connected, address });
    // Handle connection state changes here
    // For example: redirect to dashboard, update app state, etc.
  };

  return (
    <ScrollView style={styles.fullContainer}>
      <ThemedText type="title" style={styles.title}>
        Complete Wallet Interface
      </ThemedText>
    </ScrollView>
  );
};

/**
 * Example 3: Multiple Button Variants
 */
export const WalletButtonVariants = () => {
  const wallet = useWalletConnection();

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Button Variants
      </ThemedText>
      
      <View style={styles.buttonGroup}>
        <WalletConnectButton
          connected={wallet.connected}
          connecting={wallet.connecting}
          onConnect={wallet.connectWallet}
          onDisconnect={wallet.disconnectWallet}
          address={wallet.address}
          variant="primary"
          size="large"
          showAddress={false}
        />
        
        <WalletConnectButton
          connected={wallet.connected}
          connecting={wallet.connecting}
          onConnect={wallet.connectWallet}
          onDisconnect={wallet.disconnectWallet}
          address={wallet.address}
          variant="secondary"
          size="medium"
          showAddress={true}
        />
        
        <WalletConnectButton
          connected={wallet.connected}
          connecting={wallet.connecting}
          onConnect={wallet.connectWallet}
          onDisconnect={wallet.disconnectWallet}
          address={wallet.address}
          variant="outline"
          size="small"
          showAddress={false}
        />
      </View>
    </View>
  );
};

/**
 * Example 4: Custom Styled Integration
 */
export const CustomWalletIntegration = () => {
  const {
    connected,
    connecting,
    address,
    error,
    connectWallet,
    disconnectWallet,
    formatAddress,
  } = useWalletConnection();

  return (
    <View style={styles.customContainer}>
      <ThemedText type="title" style={styles.title}>
        Custom Integration
      </ThemedText>
      
      {!connected ? (
        <View style={styles.connectSection}>
          <ThemedText style={styles.description}>
            Connect your Solana wallet to get started
          </ThemedText>
          
          <WalletConnectButton
            connected={connected}
            connecting={connecting}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
            variant="primary"
            size="large"
          />
          
          {error && (
            <ThemedText style={styles.errorText}>
              Error: {error}
            </ThemedText>
          )}
        </View>
      ) : (
        <View style={styles.connectedSection}>
          <ThemedText type="subtitle" style={styles.successText}>
            ✅ Wallet Connected
          </ThemedText>
          
          <View style={styles.addressDisplay}>
            <ThemedText type="caption">Wallet Address:</ThemedText>
            <ThemedText style={styles.addressText}>
              {formatAddress(8)}
            </ThemedText>
          </View>
          
          <WalletConnectButton
            connected={connected}
            connecting={connecting}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
            variant="outline"
            size="medium"
            showAddress={false}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  fullContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  customContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
  },
  statusContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonGroup: {
    gap: 15,
  },
  connectSection: {
    alignItems: 'center',
    width: '100%',
  },
  connectedSection: {
    alignItems: 'center',
    width: '100%',
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    opacity: 0.8,
  },
  errorText: {
    color: '#ff4444',
    marginTop: 10,
    fontSize: 14,
  },
  successText: {
    color: '#22c55e',
    marginBottom: 15,
  },
  addressDisplay: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  addressText: {
    fontFamily: 'monospace',
    fontSize: 14,
    marginTop: 5,
  },
});

// Usage in your app:
// import { SimpleWalletExample, FullWalletExample, WalletButtonVariants, CustomWalletIntegration } from './examples/WalletExamples';
