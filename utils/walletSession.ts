import AsyncStorage from '@react-native-async-storage/async-storage';
import { PublicKey } from '@solana/web3.js';

const WALLET_PUBLIC_KEY = 'WALLET_PUBLIC_KEY';
const WALLET_SESSION_TIMESTAMP = 'WALLET_SESSION_TIMESTAMP';

export interface WalletSession {
  publicKey: string;
  timestamp: number;
}

/**
 * Save wallet public key to AsyncStorage
 * @param publicKey - The wallet's public key
 */
export const savePublicKey = async (publicKey: PublicKey | string): Promise<void> => {
  try {
    const publicKeyString = typeof publicKey === 'string' ? publicKey : publicKey.toString();
    const timestamp = Date.now();
    
    await Promise.all([
      AsyncStorage.setItem(WALLET_PUBLIC_KEY, publicKeyString),
      AsyncStorage.setItem(WALLET_SESSION_TIMESTAMP, timestamp.toString())
    ]);
    
    console.log('Wallet session saved successfully');
  } catch (error) {
    console.error('Error saving wallet session:', error);
    throw new Error('Failed to save wallet session');
  }
};

/**
 * Retrieve saved wallet public key from AsyncStorage
 * @returns The saved public key or null if not found
 */
export const getPublicKey = async (): Promise<string | null> => {
  try {
    const publicKey = await AsyncStorage.getItem(WALLET_PUBLIC_KEY);
    return publicKey;
  } catch (error) {
    console.error('Error retrieving wallet public key:', error);
    return null;
  }
};

/**
 * Get complete wallet session data
 * @returns WalletSession object or null if not found
 */
export const getWalletSession = async (): Promise<WalletSession | null> => {
  try {
    const [publicKey, timestampStr] = await Promise.all([
      AsyncStorage.getItem(WALLET_PUBLIC_KEY),
      AsyncStorage.getItem(WALLET_SESSION_TIMESTAMP)
    ]);

    if (!publicKey || !timestampStr) {
      return null;
    }

    return {
      publicKey,
      timestamp: parseInt(timestampStr, 10)
    };
  } catch (error) {
    console.error('Error retrieving wallet session:', error);
    return null;
  }
};

/**
 * Clear all wallet session data from AsyncStorage
 */
export const clear = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(WALLET_PUBLIC_KEY),
      AsyncStorage.removeItem(WALLET_SESSION_TIMESTAMP)
    ]);
    
    console.log('Wallet session cleared successfully');
  } catch (error) {
    console.error('Error clearing wallet session:', error);
    throw new Error('Failed to clear wallet session');
  }
};

/**
 * Check if a valid wallet session exists
 * @param maxAge - Maximum age of session in milliseconds (default: 30 days)
 * @returns boolean indicating if session is valid
 */
export const isSessionValid = async (maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<boolean> => {
  try {
    const session = await getWalletSession();
    
    if (!session) {
      return false;
    }

    const now = Date.now();
    const isNotExpired = (now - session.timestamp) < maxAge;
    
    return isNotExpired;
  } catch (error) {
    console.error('Error checking session validity:', error);
    return false;
  }
};

/**
 * Get formatted wallet address (shortened version)
 * @param address - The wallet address
 * @param length - Number of characters to show at start and end (default: 4)
 * @returns Formatted address string
 */
export const formatWalletAddress = (address: string, length: number = 4): string => {
  if (!address || address.length <= length * 2) {
    return address;
  }
  
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

/**
 * Validate if a string is a valid Solana public key
 * @param address - The address to validate
 * @returns boolean indicating if address is valid
 */
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

/**
 * Convert address between base58 and base64 formats
 */
export const addressConversion = {
  /**
   * Convert base58 address to base64
   * @param base58Address - Base58 encoded address
   * @returns Base64 encoded address
   */
  base58ToBase64: (base58Address: string): string => {
    try {
      const publicKey = new PublicKey(base58Address);
      return Buffer.from(publicKey.toBytes()).toString('base64');
    } catch (error) {
      console.error('Error converting base58 to base64:', error);
      throw new Error('Invalid base58 address');
    }
  },

  /**
   * Convert base64 address to base58
   * @param base64Address - Base64 encoded address
   * @returns Base58 encoded address
   */
  base64ToBase58: (base64Address: string): string => {
    try {
      const bytes = Buffer.from(base64Address, 'base64');
      const publicKey = new PublicKey(bytes);
      return publicKey.toString();
    } catch (error) {
      console.error('Error converting base64 to base58:', error);
      throw new Error('Invalid base64 address');
    }
  }
};
