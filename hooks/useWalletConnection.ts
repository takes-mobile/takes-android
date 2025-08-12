import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { PublicKey, Connection } from '@solana/web3.js';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import * as walletSession from '../utils/walletSession';

export interface WalletState {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  address: string | null;
  error: string | null;
  authToken: string | null; // Added authToken to state
}

export interface UseWalletConnectionReturn extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  formatAddress: (length?: number) => string;
  executeTransaction: (transaction: any) => Promise<string>; // New method for transactions
}

// Use mainnet connection - this is crucial!
const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=397b5828-cbba-479e-992e-7000c78d482b', 'confirmed');

const APP_IDENTITY = {
  name: 'Takes App',
  uri: 'https://takes.app',
  icon: 'favicon.ico',
};

export const useWalletConnection = (): UseWalletConnectionReturn => {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    connecting: false,
    publicKey: null,
    address: null,
    error: null,
    authToken: null, // Initialize authToken
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
        const savedAuthToken = await walletSession.getAuthToken(); // Get saved auth token
        
        if (savedAddress && walletSession.isValidSolanaAddress(savedAddress)) {
          const publicKey = new PublicKey(savedAddress);
          setWalletState({
            connected: true,
            connecting: false,
            publicKey,
            address: savedAddress,
            error: null,
            authToken: savedAuthToken, // Set saved auth token
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
        // CRITICAL FIX: Use 'solana:mainnet' instead of 'solana:devnet'
        const authorization = await wallet.authorize({
          chain: 'solana:mainnet', // Changed from devnet to mainnet
          identity: APP_IDENTITY,
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
        // Check if the address is base64 format
        if (result.address.includes('=') || result.address.includes('+') || result.address.includes('/')) {
          console.log('Converting base64 address to base58:', result.address);
          finalAddress = walletSession.addressConversion.base64ToBase58(result.address);
        } else {
          finalAddress = result.address;
        }

        // Validate the final address
        publicKey = new PublicKey(finalAddress);
        console.log('Wallet connected with address:', finalAddress);
      } catch (conversionError) {
        console.error('Address conversion error:', conversionError);
        throw new Error('Invalid address format received from wallet');
      }
      
      // Save session including auth token
      await walletSession.savePublicKey(publicKey);
      await walletSession.saveAuthToken(result.authToken); // Save auth token

      setWalletState({
        connected: true,
        connecting: false,
        publicKey,
        address: finalAddress,
        error: null,
        authToken: result.authToken, // Set auth token in state
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
      // Deauthorize the wallet if we have an auth token
      if (walletState.authToken) {
        try {
          await transact(async (wallet) => {
            await wallet.deauthorize({ auth_token: walletState.authToken! });
          });
        } catch (deauthorizeError) {
          console.log('Deauthorize failed (wallet may not be available):', deauthorizeError);
          // Continue with local cleanup even if deauthorize fails
        }
      }

      await walletSession.clear();
      
      setWalletState({
        connected: false,
        connecting: false,
        publicKey: null,
        address: null,
        error: null,
        authToken: null,
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
  }, [walletState.authToken]);

  // New method to execute transactions with proper MWA handling
  const executeTransaction = useCallback(async (transaction: any): Promise<string> => {
    if (!walletState.connected || !walletState.authToken) {
      throw new Error('Wallet not connected or no auth token available');
    }
  
    // Store the blockhash before signing since MWA might not preserve it
    let storedBlockhash = transaction.recentBlockhash;
    let storedLastValidBlockHeight: number;
    
    // Get fresh blockhash if not already set
    if (!storedBlockhash) {
      const latestBlockhash = await connection.getLatestBlockhash('finalized');
      storedBlockhash = latestBlockhash.blockhash;
      storedLastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
    } else {
      // Get current block height for confirmation
      storedLastValidBlockHeight = await connection.getBlockHeight() + 150;
    }

    try {
      const result = await transact(async (wallet) => {
        console.log('MWA wallet executing transaction...');
        
        // Try reauthorization with existing token first
        try {
          await wallet.reauthorize({
            auth_token: walletState.authToken!,
            identity: APP_IDENTITY,
          });
          console.log('MWA wallet reauthorized successfully');
        } catch (reauthorizeError) {
          console.log('Reauthorization failed, doing fresh authorization:', reauthorizeError);
          
          // If reauthorization fails, do fresh authorization
          const authResult = await wallet.authorize({
            chain: 'solana:mainnet',
            identity: APP_IDENTITY,
          });
          
          // Update the auth token in state and storage
          const newAuthToken = authResult.auth_token;
          setWalletState(prev => ({ ...prev, authToken: newAuthToken }));
          await walletSession.saveAuthToken(newAuthToken);
          console.log('Fresh MWA authorization completed');
        }
        
        // Ensure the transaction is properly prepared
        if (!transaction.recentBlockhash) {
          transaction.recentBlockhash = storedBlockhash;
        }
        if (!transaction.feePayer) {
          transaction.feePayer = new PublicKey(walletState.address!);
        }

        // Sign the transaction with MWA
        const signedTransactions = await wallet.signTransactions({
          transactions: [transaction],
        });

        console.log('Transaction signed successfully');
        return signedTransactions[0];
      });
      
      // Now send the signed transaction to the blockchain via RPC
      console.log('Sending signed transaction to blockchain...');
      const signature = await connection.sendRawTransaction(result.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });
      
      console.log('Transaction sent, signature:', signature);
      
      // Wait for confirmation using the stored blockhash
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: storedBlockhash, // Use the stored blockhash
        lastValidBlockHeight: storedLastValidBlockHeight,
      }, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
      
      console.log('Transaction confirmed successfully');
      return signature;
      
    } catch (error) {
      console.error('MWA transaction failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('No wallet found')) {
          throw new Error('No MWA wallet found. Please ensure your MWA wallet app is installed and running.');
        } else if (error.message.includes('User declined')) {
          throw new Error('Transaction was declined by the user.');
        } else if (error.message.includes('Authorization failed')) {
          throw new Error('MWA wallet authorization failed. Please try reconnecting your wallet.');
        } else if (error.message.includes('Invalid transaction')) {
          throw new Error('Transaction format is invalid for MWA wallet. Please try again.');
        } else if (error.message.includes('Transaction failed')) {
          throw new Error(`Blockchain transaction failed: ${error.message}`);
        } else {
          throw new Error(`MWA wallet transaction failed: ${error.message}`);
        }
      } else {
        throw new Error('MWA wallet transaction failed');
      }
    }
  }, [walletState.authToken, walletState.connected, walletState.address]);

  const formatAddress = useCallback((length: number = 4): string => {
    return walletState.address ? walletSession.formatWalletAddress(walletState.address, length) : '';
  }, [walletState.address]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    formatAddress,
    executeTransaction,
  };
};