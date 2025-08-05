import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import * as walletSession from '../utils/walletSession';

export interface WalletState {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  address: string | null;
  error: string | null;
}

export interface UseWalletConnectionReturn extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  formatAddress: (length?: number) => string;
}

// Solana connection - using mainnet
const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

export const useWalletConnection = (): UseWalletConnectionReturn => {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    connecting: false,
    publicKey: null,
    address: null,
    error: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const isValid = await walletSession.isSessionValid();
      if (isValid) {
        const savedAddress = await walletSession.getPublicKey();
        if (savedAddress && walletSession.isValidSolanaAddress(savedAddress)) {
          const publicKey = new PublicKey(savedAddress);
          setWalletState({
            connected: true,
            connecting: false,
            publicKey,
            address: savedAddress,
            error: null,
          });
        }
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
    }
  };

  const connectWallet = useCallback(async (): Promise<void> => {
    setWalletState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const result = await transact(async (wallet) => {
        // Request authorization to access the wallet
        const authorization = await wallet.authorize({
          cluster: 'mainnet-beta',
          identity: {
            name: 'Takes App',
            uri: 'https://takes.app',
            icon: 'favicon.ico',
          },
        });

        // Validate that we have accounts
        if (!authorization.accounts || authorization.accounts.length === 0) {
          throw new Error('No accounts found in wallet authorization');
        }

        const account = authorization.accounts[0];
        if (!account.address) {
          throw new Error('No address found in wallet account');
        }

        return {
          address: account.address,
          authToken: authorization.auth_token,
        };
      });

      // Handle address format conversion
      let finalAddress: string;
      let publicKey: PublicKey;

      try {
        // Check if the address is base64 format (common issue with wallets)
        if (result.address.includes('=') || result.address.includes('+') || result.address.includes('/')) {
          console.log('Converting base64 address to base58:', result.address);
          // Convert base64 to base58
          finalAddress = walletSession.addressConversion.base64ToBase58(result.address);
        } else {
          // Assume it's already base58
          finalAddress = result.address;
        }

        // Validate the final address
        publicKey = new PublicKey(finalAddress);
        console.log('Wallet connected with address:', finalAddress);
      } catch (conversionError) {
        console.error('Address conversion error:', conversionError);
        throw new Error('Invalid address format received from wallet');
      }
      
      // Save session
      await walletSession.savePublicKey(publicKey);

      setWalletState({
        connected: true,
        connecting: false,
        publicKey,
        address: finalAddress,
        error: null,
      });

    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      let errorMessage = 'Failed to connect wallet';
      
      if (error?.message?.includes('authorization request failed')) {
        errorMessage = 'Wallet authorization failed. Please ensure your wallet app is updated and try again.';
      } else if (error?.message?.includes('User declined') || error?.message?.includes('cancelled')) {
        errorMessage = 'Connection cancelled by user';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'Connection timeout - please try again';
      } else if (error?.message?.includes('Invalid address')) {
        errorMessage = 'Wallet provided invalid address format';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setWalletState(prev => ({
        ...prev,
        connecting: false,
        error: errorMessage,
      }));

      Alert.alert('Connection Failed', errorMessage, [{ text: 'OK', style: 'default' }]);
    }
  }, []);

  const disconnectWallet = useCallback(async (): Promise<void> => {
    try {
      await walletSession.clear();
      
      setWalletState({
        connected: false,
        connecting: false,
        publicKey: null,
        address: null,
        error: null,
      });

      Alert.alert(
        'Wallet Disconnected',
        'Your wallet has been disconnected successfully',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      Alert.alert('Error', 'Failed to disconnect wallet', [{ text: 'OK', style: 'default' }]);
    }
  }, []);

  const formatAddress = useCallback((length: number = 4): string => {
    return walletState.address ? walletSession.formatWalletAddress(walletState.address, length) : '';
  }, [walletState.address]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    formatAddress,
  };
};
