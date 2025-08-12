// utils/walletSession.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PublicKey } from '@solana/web3.js';
import { fromByteArray, toByteArray } from 'react-native-quick-base64';

const STORAGE_KEYS = {
  PUBLIC_KEY: '@wallet_public_key',
  AUTH_TOKEN: '@wallet_auth_token', // New key for auth token
  SESSION_TIMESTAMP: '@wallet_session_timestamp',
};

// Session validity duration (24 hours)
const SESSION_DURATION = 24 * 60 * 60 * 1000;

export const savePublicKey = async (publicKey: PublicKey): Promise<void> => {
  try {
    const publicKeyString = publicKey.toBase58();
    const timestamp = Date.now().toString();
    
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.PUBLIC_KEY, publicKeyString],
      [STORAGE_KEYS.SESSION_TIMESTAMP, timestamp],
    ]);
    
    console.log('Public key saved to storage');
  } catch (error) {
    console.error('Error saving public key:', error);
    throw error;
  }
};

export const saveAuthToken = async (authToken: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authToken);
    console.log('Auth token saved to storage');
  } catch (error) {
    console.error('Error saving auth token:', error);
    throw error;
  }
};

export const getPublicKey = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.PUBLIC_KEY);
  } catch (error) {
    console.error('Error getting public key:', error);
    return null;
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const isSessionValid = async (): Promise<boolean> => {
  try {
    const [publicKey, authToken, timestamp] = await AsyncStorage.multiGet([
      STORAGE_KEYS.PUBLIC_KEY,
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.SESSION_TIMESTAMP,
    ]);

    if (!publicKey[1] || !timestamp[1]) {
      return false;
    }

    const sessionTime = parseInt(timestamp[1], 10);
    const currentTime = Date.now();
    const isWithinDuration = (currentTime - sessionTime) < SESSION_DURATION;
    
    // console.log('Session validity check:', {
    //   hasPublicKey: !!publicKey[1],
    //   hasAuthToken: !!authToken[1],
    //   isWithinDuration,
    // });

    return isWithinDuration;
  } catch (error) {
    console.error('Error checking session validity:', error);
    return false;
  }
};

export const clear = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PUBLIC_KEY,
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.SESSION_TIMESTAMP,
    ]);
    console.log('Wallet session cleared');
  } catch (error) {
    console.error('Error clearing wallet session:', error);
    throw error;
  }
};

export const formatWalletAddress = (address: string, length: number = 4): string => {
  if (!address || address.length < length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

// Address conversion utilities
export const addressConversion = {
  base64ToBase58: (base64Address: string): string => {
    try {
      const bytes = toByteArray(base64Address);
      const publicKey = new PublicKey(bytes);
      return publicKey.toBase58();
    } catch (error) {
      console.error('Error converting base64 to base58:', error);
      throw new Error('Invalid base64 address format');
    }
  },

  base58ToBase64: (base58Address: string): string => {
    try {
      const publicKey = new PublicKey(base58Address);
      const bytes = publicKey.toBytes();
      return fromByteArray(bytes);
    } catch (error) {
      console.error('Error converting base58 to base64:', error);
      throw new Error('Invalid base58 address format');
    }
  },
};