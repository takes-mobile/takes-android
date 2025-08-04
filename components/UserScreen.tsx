import React, { useState, useCallback, useEffect, useContext, useRef } from "react";
import { Text, TextInput, View, Button, ScrollView, Image, TouchableOpacity, Alert, Modal, ActivityIndicator, ImageBackground, SafeAreaView, Dimensions, Pressable, Animated, EmitterSubscription } from "react-native";
import { useBets } from "../context/BetsContext";

import {
  usePrivy,
  useLinkWithOAuth,
  useEmbeddedSolanaWallet,
  getUserEmbeddedSolanaWallet,
} from "@privy-io/expo";
import Constants from "expo-constants";
import { useLinkWithPasskey } from "@privy-io/expo/passkey";
import { PrivyUser } from "@privy-io/public-api";
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, VersionedTransaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-styled';
import { BN } from '@project-serum/anchor';
import { ThemeContext } from '../app/_layout';
import RetroButton from './RetroButton';

const toMainIdentifier = (x: PrivyUser["linked_accounts"][number]) => {
  if (x.type === "phone") {
    return x.phoneNumber;
  }
  if (x.type === "email" || x.type === "wallet") {
    return x.address;
  }

  if (x.type === "twitter_oauth" || x.type === "tiktok_oauth") {
    return x.username;
  }

  if (x.type === "custom_auth") {
    return x.custom_user_id;
  }

  return x.type;
};
// Utility functions for Phantom deeplinks
const decryptPayload = (data: string, nonce: string, sharedSecret: Uint8Array) => {
  if (!sharedSecret) throw new Error("missing shared secret");
  
  try {
    console.log('Attempting to decrypt with:', {
      dataLength: data.length,
      nonceLength: nonce.length,
      sharedSecretLength: sharedSecret.length
    });
    
    const decryptedData = nacl.box.open.after(
      bs58.decode(data),
      bs58.decode(nonce),
      sharedSecret
    );
    
    if (!decryptedData) {
      throw new Error("Unable to decrypt data - decryption returned null");
    }
    
    return JSON.parse(Buffer.from(decryptedData).toString("utf8"));
  } catch (error) {
    console.error('Decryption error details:', error);
    console.error('Data sample:', data.substring(0, 50) + '...');
    console.error('Nonce:', nonce);
    throw error;
  }
};

const encryptPayload = (payload: any, sharedSecret: Uint8Array<ArrayBufferLike>) => {
  if (!sharedSecret) throw new Error("missing shared secret");
  const nonce = nacl.randomBytes(24);
  const payloadUint8 = new TextEncoder().encode(JSON.stringify(payload));
  const encryptedPayload = nacl.box.after(
    payloadUint8,
    nonce,
    sharedSecret
  );
  return [nonce, encryptedPayload];
};

// Create redirect links for Phantom deeplinks
const onConnectRedirectLink = Linking.createURL("onConnect");
const onDisconnectRedirectLink = Linking.createURL("onDisconnect");  
const onSignAndSendTransactionRedirectLink = Linking.createURL("onSignAndSendTransaction");

const buildUrl = (path: any, params: { toString: () => any; }) => 
  `https://phantom.app/ul/v1/${path}?${params.toString()}`;

// BetCard component for user's bets
const BetCard = ({ bet, userWallet, theme, onEndPosition, endingPosition }: { 
  bet: any; 
  userWallet: string | undefined; 
  theme: any;
  onEndPosition: (bet: any, participation: any) => void;
  endingPosition: string | null;
}) => {
  const router = useRouter();
  const [hasTokens, setHasTokens] = useState<boolean | null>(null);
  const [checkingTokens, setCheckingTokens] = useState(false);
  
  const formatTimeLeft = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Find user's participation in this bet
  const userParticipation = bet.participants?.find((p: any) => p.wallet === userWallet);
  const userOption = userParticipation ? bet.options[userParticipation.optionIndex] : null;
  const userBetAmount = userParticipation ? userParticipation.amount : 0;

  const isExpired = bet.betType !== 'timeless' && new Date(bet.endTime || '') <= new Date();
  const isEnding = endingPosition === bet.id;

  // Check if user has tokens for this bet using Jupiter Ultra API
  const checkTokenBalance = async () => {
    if (!userWallet || !userParticipation) return;
    
    setCheckingTokens(true);
    try {
      const tokenMint = bet.tokenAddresses[userParticipation.optionIndex];
      
      const response = await fetch(`https://ultra-api.jup.ag/balances/${userWallet}`);
      
      if (!response.ok) {
        setHasTokens(false);
        return;
      }
      
      const balances = await response.json();
      
      if (balances[tokenMint] && balances[tokenMint].uiAmount > 0) {
        setHasTokens(true);
      } else {
        setHasTokens(false);
      }
    } catch (error) {
      console.error('Error checking token balance:', error);
      setHasTokens(false);
    } finally {
      setCheckingTokens(false);
    }
  };

  useEffect(() => {
    checkTokenBalance();
  }, [userWallet, bet.id]);

  return (
    <View style={{
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 18,
      marginHorizontal: 18,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    }}>
      {/* Bet Type Badge */}
      {bet.betType && (
        <View style={{
          position: 'absolute',
          top: 12,
          right: 12,
          backgroundColor: bet.betType === 'bonk' ? '#F97316' : 
                         bet.betType === 'timeless' ? '#8b5cf6' : '#22c55e',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#fff',
        }}>
          <Text style={{
            fontSize: 8,
            fontFamily: 'PressStart2P-Regular',
            color: '#fff',
            textTransform: 'uppercase',
          }}>
            {bet.betType === 'bonk' ? '🪙 BONK' : 
             bet.betType === 'timeless' ? '♾️ TIMELESS' : '🎯 STANDARD'}
          </Text>
        </View>
      )}

      {/* Generated Image Display */}
      {bet.generatedImage && (
        <View style={{ marginBottom: 12 }}>
          <Image 
            source={{ uri: bet.generatedImage }} 
            style={{ 
              width: '100%', 
              height: 120, 
              borderRadius: 8,
            }} 
            resizeMode="cover"
          />
        </View>
      )}

      {/* Question */}
      <Text style={{
        fontSize: 16,
        fontFamily: 'PressStart2P-Regular',
        color: theme.text,
        marginBottom: 12,
        lineHeight: 22,
      }}>
        {bet.question}
      </Text>

      {/* User's bet info */}
      <View style={{
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.green + '40',
      }}>
        <Text style={{
          fontSize: 14,
          fontFamily: 'PressStart2P-Regular',
          color: theme.green,
          fontWeight: '600',
          marginBottom: 4,
        }}>
          Your Bet: {userOption}
        </Text>
        <Text style={{
          fontSize: 16,
          fontFamily: 'PressStart2P-Regular',
          color: theme.text,
          fontWeight: 'bold',
        }}>
          Amount: {userBetAmount} {bet.betType === 'bonk' ? 'BONK' : 'SOL'}
        </Text>
      </View>

      {/* Status and stats */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* <View style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: bet.isActive && !isExpired ? theme.green : '#ef4444',
            marginRight: 6,
          }} /> */}
          {/* <Text style={{
            fontSize: 12,
            fontFamily: 'PressStart2P-Regular',
            color: bet.isActive && !isExpired ? theme.green : '#ef4444',
            fontWeight: '600',
          }}>
            {bet.isActive && !isExpired ? 'Active' : 'Ended'}
          </Text> */}
        </View>
        
        <Text style={{
          fontSize: 12,
          fontFamily: 'PressStart2P-Regular',
          color: theme.subtext,
        }}>
          Pool: {bet.betType === 'bonk' ? 
            `${(bet.totalPool * 1).toFixed(0)} BONK` : 
            `${bet.totalPool.toFixed(2)} SOL`}
        </Text>
        
        {/* <Text style={{
          fontSize: 12,
          fontFamily: 'PressStart2P-Regular',
          color: theme.subtext,
        }}>
          {bet.betType === 'timeless' ? 'TIMELESS' : formatTimeLeft(bet.endTime || '')}
        </Text> */}
      </View>

      {/* Action buttons */}
      <View style={{
        flexDirection: 'row',
        gap: 8,
      }}>
        {/* <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: theme.primary || '#3B82F6',
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 12,
            alignItems: 'center',
            opacity: isEnding ? 0.7 : 1,
          }}
          onPress={() => {
            router.push({
              pathname: '/bet-details',
              params: { betData: JSON.stringify(bet) }
            });
          }}
          disabled={isEnding}
        >
          <Text style={{
            color: '#fff',
            fontSize: 12,
            fontFamily: 'PressStart2P-Regular',
            fontWeight: '600',
          }}>
            View Details
          </Text>
        </TouchableOpacity> */}

        {/* Show End Position button only if user has tokens */}
        {hasTokens === true && (
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: theme.orange || '#F97316',
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              alignItems: 'center',
              opacity: isEnding ? 0.7 : 1,
            }}
            onPress={() => onEndPosition(bet, userParticipation)}
            disabled={isEnding}
          >
            {isEnding ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{
                color: '#fff',
                fontSize: 12,
                fontFamily: 'PressStart2P-Regular',
                fontWeight: '600',
              }}>
                End Position
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Show Withdrawn status if user has no tokens */}
        {hasTokens === false && (
          <View style={{
            flex: 1,
            backgroundColor: '#6B7280',
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 12,
            alignItems: 'center',
            opacity: 0.7,
          }}>
            <Text style={{
              color: '#fff',
              fontSize: 12,
              fontFamily: 'PressStart2P-Regular',
              fontWeight: '600',
            }}>
              Withdrawn
            </Text>
          </View>
        )}

        {/* Show loading while checking tokens */}
        {hasTokens === null && checkingTokens && (
          <View style={{
            flex: 1,
            backgroundColor: '#6B7280',
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 12,
            alignItems: 'center',
            opacity: 0.7,
          }}>
            <ActivityIndicator color="#fff" size="small" />
          </View>
        )}
      </View>
    </View>
  );
};

export const UserScreen = () => {
  // Remove signedMessages and signMessage logic
  const { logout, user } = usePrivy();
  const { linkWithPasskey } = useLinkWithPasskey();
  const oauth = useLinkWithOAuth();
  const { wallets, create } = useEmbeddedSolanaWallet();
  const account = getUserEmbeddedSolanaWallet(user);
  const [copied, setCopied] = useState(false);
  const [solBalance, setSolBalance] = useState<string | null>(null);
  const [bonkBalance, setBonkBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const router = useRouter();
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawToken, setWithdrawToken] = useState<'SOL' | 'BONK'>('SOL');
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');
  
  // Phantom connection state
  const [dappKeyPair] = useState(nacl.box.keyPair());
  const [sharedSecret, setSharedSecret] = useState<Uint8Array>();
  const [session, setSession] = useState<string>();
  const [deepLink, setDeepLink] = useState<string>('');
  const [phantomSession, setPhantomSession] = useState<string | null>(null);
  const [phantomWalletPublicKey, setPhantomWalletPublicKey] = useState<PublicKey | null>(null);
  const [connectingToPhantom, setConnectingToPhantom] = useState(false);
  const [lastProcessedDeepLink, setLastProcessedDeepLink] = useState<string>('');
  const [lastProcessedTime, setLastProcessedTime] = useState<number>(0);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'previous'>('live');
  const [userBets, setUserBets] = useState<any[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);
  const [endingPosition, setEndingPosition] = useState<string | null>(null);
  const { width: windowWidth, height: screenHeight } = Dimensions.get('window');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const modalSlideAnim = useRef(new Animated.Value(screenHeight)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const { theme: themeName, toggleTheme } = useContext(ThemeContext);
  const { fetchBets, lastFetched } = useBets();
  const lightTheme = {
    background: '#f6f8fa',
    card: '#fff',
    text: '#222',
    subtext: '#444',
    border: '#000',
    green: '#22c55e',
    orange: '#F97316',
    shadow: '#000',
    input: '#f6f8fa',
    modal: '#fff',
    placeholder: '#bbb',
  };
  const darkTheme = {
    background: '#1e1a2c', // Dark purple background
    card: '#2d2640', // Medium-dark purple card
    text: '#fff',
    subtext: '#c8b6e8', // Light purple subtext
    border: '#4a3f66', // Medium purple border
    green: '#22c55e',
    orange: '#F97316',
    shadow: '#130f1c', // Very dark purple shadow
    input: '#352d4d', // Medium-dark purple input
    modal: '#2d2640', // Same as card color
    placeholder: '#8778b3', // Medium-light purple placeholder
  };
  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  // Add a helper function to refresh balance
  const fetchBalance = useCallback(async () => {
    if (!account?.address) return;
    
    setLoadingBalance(true);
    try {
      // Fetch SOL balance
      const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=397b5828-cbba-479e-992e-7000c78d482b');
      const balance = await connection.getBalance(new PublicKey(account.address));
      setSolBalance((balance / LAMPORTS_PER_SOL).toFixed(4));
      
      // Fetch BONK balance using Jupiter Ultra API
      const BONK_MINT = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
      const response = await fetch(`https://ultra-api.jup.ag/balances/${account.address}`);
      
      if (response.ok) {
        const balances = await response.json();
        console.log('Jupiter balances response:', balances);
        
        if (balances[BONK_MINT] && balances[BONK_MINT].uiAmount) {
          const bonkAmount = balances[BONK_MINT].uiAmount;
          console.log('BONK amount found:', bonkAmount);
          setBonkBalance(bonkAmount.toFixed(2));
        } else {
          console.log('No BONK balance found');
          setBonkBalance('0.00');
        }
      } else {
        console.log('Failed to fetch balances from Jupiter API');
        setBonkBalance('0.00');
      }
    } catch (e) {
      console.error("Error fetching balance:", e);
      setSolBalance(null);
      setBonkBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  }, [account?.address]);

  useEffect(() => {
    console.log('Account address changed:', account?.address);
    if (account?.address) {
      console.log('Triggering balance fetch for address:', account.address);
      fetchBalance();
    }
  }, [account?.address, fetchBalance]);

  useEffect(() => {
    // Fetch real-time SOL price in USD using Jupiter
    const fetchSolPrice = async () => {
      try {
        // SOL mint address
        const SOL_MINT = 'So11111111111111111111111111111111111111112';
        // USDC mint address  
        const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
        // 1 SOL in lamports
        const oneSOLInLamports = 1000000000;
        
        const response = await fetch(
          `https://quote-api.jup.ag/v6/quote?inputMint=${SOL_MINT}&outputMint=${USDC_MINT}&amount=${oneSOLInLamports}&slippageBps=50`
        );
        
        if (response.ok) {
          const data = await response.json();
          // Convert USDC amount (6 decimals) to USD price
          const usdcAmount = parseInt(data.outAmount) / 1000000; // USDC has 6 decimals
          setSolPrice(usdcAmount);
        }
      } catch (error) {
        console.error('Error fetching SOL price from Jupiter:', error);
        // Fallback to CoinGecko if Jupiter fails
        try {
          const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
          const data = await res.json();
          setSolPrice(data.solana.usd);
        } catch {}
      }
    };
    fetchSolPrice();
    const interval = setInterval(fetchSolPrice, 60000); // update every 60s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-create wallet if not present
    if (user && !account?.address && typeof create === 'function') {
      create();
    }
  }, [user, account?.address, create]);

// 4. Fix the useEffect for deep link initialization

// 2. Fix the deep link handler - add better state management
const handleDeepLink = useCallback(({ url }: { url: string }) => {
  console.log("Received deep link:", url);

  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    console.log("Processing deeplink pathname:", urlObj.pathname);
    console.log("URL params:", Object.fromEntries(params.entries()));

    // Only process Phantom-related deep links
    if (!urlObj.pathname.includes("onConnect") && 
        !urlObj.pathname.includes("onDisconnect") && 
        !urlObj.pathname.includes("onSignAndSendTransaction")) {
      console.log("Ignoring non-Phantom deep link");
      return;
    }

    // Handle errors first
    if (params.get("errorCode")) {
      const errorMessage = params.get("errorMessage") || "Unknown error occurred";
      console.log("Phantom error:", errorMessage);
      Alert.alert("Wallet Error", errorMessage);
      setConnectingToPhantom(false);
      return;
    }

    // Handle connect response
    if (urlObj.pathname.includes("onConnect")) {
      console.log("Processing Phantom connect response");
      
      const phantomEncryptionPubkey = params.get("phantom_encryption_public_key");
      const nonce = params.get("nonce");
      const data = params.get("data");
      
      console.log('Connect params:', {
        phantomKey: phantomEncryptionPubkey?.substring(0, 20) + '...',
        nonce: nonce?.substring(0, 20) + '...',
        dataLength: data?.length
      });
      
      if (phantomEncryptionPubkey && nonce && data) {
        try {
          // Create shared secret using the correct key pair
          const phantomPublicKey = bs58.decode(phantomEncryptionPubkey);
          const sharedSecretDapp = nacl.box.before(
            phantomPublicKey,
            dappKeyPair.secretKey
          );

          console.log('Shared secret created, length:', sharedSecretDapp.length);

          // Decrypt the connection data
          const connectData = decryptPayload(data, nonce, sharedSecretDapp);
          
          console.log("Successfully decrypted connect data:", {
            publicKey: connectData.public_key,
            sessionLength: connectData.session?.length
          });

          // Store connection state
          setSharedSecret(sharedSecretDapp);
          setSession(connectData.session);
          setPhantomWalletPublicKey(new PublicKey(connectData.public_key));
          setConnectingToPhantom(false);
          
          Alert.alert(
            "Phantom Connected! 🎉",
            `Successfully connected to ${connectData.public_key.slice(0, 8)}...`,
            [{ text: "OK" }]
          );
        } catch (decryptError) {
          console.error("Error decrypting connection data:", decryptError);
          Alert.alert(
            "Connection Error", 
            "Failed to decrypt Phantom response. Please try connecting again."
          );
          setConnectingToPhantom(false);
        }
      } else {
        console.log("Missing required connection parameters");
        Alert.alert("Connection Error", "Invalid response from Phantom wallet");
        setConnectingToPhantom(false);
      }
    }

    // Handle disconnect response
    if (urlObj.pathname.includes("onDisconnect")) {
      console.log("Phantom disconnected"); 
      setPhantomWalletPublicKey(null);
      setSession(undefined);
      setSharedSecret(undefined);
      Alert.alert("Phantom Disconnected", "Your Phantom wallet has been disconnected.");
    }

    // Handle transaction response
    if (urlObj.pathname.includes("onSignAndSendTransaction")) {
      console.log("Processing Phantom transaction response");
      
      const signature = params.get("signature");
      
      if (signature) {
        console.log("Transaction signature:", signature);
        Alert.alert(
          "Transaction Successful! 🎉",
          `Transaction completed with signature: ${signature.slice(0, 8)}...`,
          [
            {
              text: "View on Explorer",
              onPress: () => {
                Linking.openURL(`https://solscan.io/tx/${signature}`);
              }
            },
            { text: "OK" }
          ]
        );
        
        // Refresh balance after successful transaction
        setTimeout(() => {
          if (account?.address) {
            fetchBalance();
          }
        }, 2000);
      } else {
        Alert.alert("Transaction Error", "No transaction signature received");
      }
    }

  } catch (error) {
    console.error("Error processing deep link:", error);
    setConnectingToPhantom(false);
    Alert.alert("Deeplink Error", "Failed to process wallet response");
  }
}, [dappKeyPair.secretKey, account?.address, fetchBalance]);

// 3. Fix the connection function - ensure proper key generation
const connectToPhantom = useCallback(async () => {
  if (connectingToPhantom) {
    console.log("Already connecting to Phantom, skipping...");
    return;
  }

  setConnectingToPhantom(true);
  
  try {
    console.log("Initiating Phantom connection...");
    console.log("Dapp public key:", bs58.encode(dappKeyPair.publicKey));
    
    const params = new URLSearchParams({
      dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
      cluster: "mainnet-beta",
      app_url: "https://takes-app.vercel.app/",
      redirect_link: onConnectRedirectLink,
    });

    const phantomUrl = buildUrl("connect", params);
    console.log("Opening Phantom URL:", phantomUrl);
    
    const canOpen = await Linking.openURL(phantomUrl);
    if (!canOpen) {
      throw new Error("Cannot open Phantom app. Please install Phantom wallet.");
    }
    
    await Linking.openURL(phantomUrl);
  } catch (error) {
    console.error("Error connecting to Phantom:", error);
    Alert.alert("Connection Error",  error as string, "Failed to connect to Phantom wallet." as any);
    setConnectingToPhantom(false); 
  }
}, [connectingToPhantom, dappKeyPair.publicKey, onConnectRedirectLink]);


// 4. Fix the useEffect for deep link initialization
useEffect(() => {
  let linkingSubscription: EmitterSubscription;

  const initializeDeeplinks = async () => {
    try {
      // Handle initial URL if app was opened via deeplink
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log("Initial URL:", initialUrl);
        // Add a delay to ensure component is fully mounted
        setTimeout(() => {
          handleDeepLink({ url: initialUrl });
        }, 500);
      }

      // Listen for incoming links
      linkingSubscription = Linking.addEventListener("url", (event) => {
        console.log("URL event received:", event.url);
        // Add a small delay here too
        setTimeout(() => {
          handleDeepLink(event);
        }, 100);
      });
    } catch (error) {
      console.error("Error initializing deeplinks:", error);
    }
  };

  initializeDeeplinks();

  return () => {
    if (linkingSubscription) {
      linkingSubscription.remove();
    }
  };
}, [handleDeepLink]); // Add handleDeepLink to dependencies

  // Fetch user's bets
  const fetchUserBets = async () => {
    if (!account?.address) return;
    
    setLoadingBets(true);
    try {
      const response = await fetch('https://apipoolc.vercel.app/api/read');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter bets where user is a participant
          const allBets = data.bets || [];
          const participatedBets = allBets.filter((bet: any) => 
            bet.participants?.some((p: any) => p.wallet === account.address)
          );
          setUserBets(participatedBets);
        }
      }
    } catch (error) {
      console.error('Error fetching user bets:', error);
    } finally {
      setLoadingBets(false);
    }
  };

  useEffect(() => {
    fetchUserBets();
  }, [account?.address]);

  // Jupiter API functions for token swapping
  const getJupiterQuote = async (inputMint: string, outputMint: string, amount: number) => {
    try {
      const response = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get Jupiter quote');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Jupiter quote error:', error);
      throw error;
    }
  };

  const getJupiterSwapTransaction = async (quoteResponse: any, userPublicKey: string) => {
    try {
      const response = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey,
          wrapAndUnwrapSol: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get Jupiter swap transaction');
      }

      return await response.json();
    } catch (error) {
      console.error('Jupiter swap transaction error:', error);
      throw error;
    }
  };

  // Get token balance using Jupiter Ultra API
  const getTokenBalance = async (walletAddress: string, tokenMint: string) => {
    try {
      const response = await fetch(`https://ultra-api.jup.ag/balances/${walletAddress}`);
      
      if (!response.ok) {
        console.error('Failed to fetch balances from Jupiter Ultra API');
        return 0;
      }
      
      const balances = await response.json();
      
      // Check if the token exists in the wallet
      if (balances[tokenMint]) {
        return balances[tokenMint].uiAmount;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting token balance from Jupiter Ultra API:', error);
      return 0;
    }
  };

  // Get token decimals using Jupiter Pools API
  const getTokenDecimals = async (tokenMint: string) => {
    try {
      const response = await fetch(`https://datapi.jup.ag/v1/pools?assetIds=${tokenMint}`);
      
      if (!response.ok) {
        console.error('Failed to fetch token info from Jupiter Pools API');
        return 9; // Default to 9 decimals (like SOL)
      }
      
      const data = await response.json();
      
      if (data.pools && data.pools.length > 0 && data.pools[0].baseAsset) {
        return data.pools[0].baseAsset.decimals;
      }
      
      return 9; // Default to 9 decimals if not found
    } catch (error) {
      console.error('Error getting token decimals:', error);
      return 9; // Default to 9 decimals
    }
  };

  // Check if token account exists and has balance using Jupiter Ultra API
  const checkTokenAccountExists = async (walletAddress: string, tokenMint: string) => {
    try {
      const response = await fetch(`https://ultra-api.jup.ag/balances/${walletAddress}`);
      
      if (!response.ok) {
        return { exists: false, balance: 0 };
      }
      
      const balances = await response.json();
      
      if (balances[tokenMint]) {
        return { exists: true, balance: balances[tokenMint].uiAmount };
      }
      
      return { exists: false, balance: 0 };
    } catch (error) {
      console.error('Error checking token account:', error);
      return { exists: false, balance: 0 };
    }
  };

  // End Position function - sell ALL tokens back to SOL
  const handleEndPosition = async (bet: any, participation: any) => {
    if (!wallets || wallets.length === 0) {
      Alert.alert('Error', 'No wallet found. Please connect your wallet first.');
      return;
    }

    const wallet = wallets[0];
    const userWallet = wallet.address;

    if (!userWallet) {
      Alert.alert('Error', 'Unable to get wallet address.');
      return;
    }

    setEndingPosition(bet.id);

    try {
      // SOL mint address (wrapped SOL)
      const SOL_MINT = 'So11111111111111111111111111111111111111112';
      const tokenMint = bet.tokenAddresses[participation.optionIndex];
      
      console.log('Checking token account and balance...');
      
      // Get token balance from Jupiter Ultra API
      const tokenBalance = await getTokenBalance(userWallet, tokenMint);
      
      console.log('Token balance from Jupiter Ultra API:', tokenBalance);
      
      if (tokenBalance <= 0) {
        Alert.alert(
          'No Tokens Found',
          'You have already withdrawn all your tokens for this bet.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get token decimals from Jupiter Pools API
      const tokenDecimals = await getTokenDecimals(tokenMint);
      console.log('Token decimals:', tokenDecimals);
      
      // Convert token balance to the smallest unit using correct decimals
      const tokenAmount = Math.floor(tokenBalance * Math.pow(10, tokenDecimals));

      console.log('Getting Jupiter quote for token to SOL...');
      
      // Get quote from Jupiter (Token → SOL)
      const quote = await getJupiterQuote(tokenMint, SOL_MINT, tokenAmount);
      
      console.log('Jupiter quote:', quote);

      // Get swap transaction
      const swapTransaction = await getJupiterSwapTransaction(quote, userWallet);
      
      console.log('Got swap transaction');

      // Deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapTransaction.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(new Uint8Array(swapTransactionBuf));

      console.log('Signing and sending transaction...');

      // Sign and send transaction using Privy
      const provider = await wallet.getProvider();
      const { signature } = await provider.request({
        method: 'signAndSendTransaction',
        params: {
          transaction: transaction,
          connection: new Connection('https://mainnet.helius-rpc.com/?api-key=397b5828-cbba-479e-992e-7000c78d482b'),
        },
      });

      console.log('Transaction successful:', signature);

      Alert.alert(
        'Position Closed! 🎉',
        `Successfully sold ${tokenBalance.toFixed(4)} tokens for SOL!\n\nTransaction: ${signature.slice(0, 8)}...`,
        [{ text: 'OK' }]
      );

      // Refresh user bets and trigger token balance recheck
      await fetchUserBets();
      
      // Refresh user's SOL balance
      const refreshBalance = async () => {
        if (!account?.address) return;
        try {
          const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=397b5828-cbba-479e-992e-7000c78d482b');
          const balance = await connection.getBalance(new PublicKey(account.address));
          setSolBalance((balance / LAMPORTS_PER_SOL).toFixed(4));
        } catch (e) {
          console.error('Error refreshing balance:', e);
        }
      };
      
      // Refresh balance immediately and after a short delay to ensure transaction is confirmed
      await refreshBalance();
      setTimeout(refreshBalance, 2000);
      
      // Trigger a recheck of token balances for all bet cards
      // This will cause the BetCard components to re-check their token balances
      setTimeout(() => {
        // Force re-render of bet cards to update token status
        setUserBets([...userBets]);
      }, 1000);

    } catch (error) {
      console.error('End position error:', error);
      Alert.alert(
        'Error',
        `Failed to end position: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setEndingPosition(null);
    }
  };

    // Fixed transfer functions - Since Phantom transfer deep link isn't implemented, we'll use a different approach
  const handlePhantomTransfer = useCallback(async (amount: string) => {
    if (!phantomWalletPublicKey || !account?.address) {
      Alert.alert("Error", "No wallet connected or no recipient address");
      return;
    }

    try {
      console.log(`Creating transfer of ${amount} SOL from Phantom to app wallet`);
      
      // Since Phantom transfer deep link isn't implemented, we'll show instructions
      Alert.alert(
        "Manual Transfer Required",
        `Please manually transfer ${amount} SOL from your Phantom wallet to:\n\n${account.address}\n\nCopy the address and open Phantom to complete the transfer.`,
        [
          {
            text: "Copy Address",
            onPress: async () => {
              try {
                await Clipboard.setStringAsync(account.address);
                Alert.alert("Address Copied", "Wallet address copied to clipboard!");
              } catch (error) {
                console.error("Error copying address:", error);
              }
            }
          },
          {
            text: "Open Phantom",
            onPress: () => {
              Linking.openURL("https://phantom.app/");
            }
          },
          { text: "Cancel" }
        ]
      );
    } catch (error) {
      console.error("Error creating Phantom transfer:", error);
      Alert.alert("Transfer Error", `Failed to create transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [phantomWalletPublicKey, account?.address]);

  // Open settings modal with animation
  const openSettingsModal = () => {
    // Reset animation values
    modalSlideAnim.setValue(screenHeight);
    modalOpacityAnim.setValue(0);
    setShowSettingsModal(true);
    
    // Use a short delay to ensure modal is fully rendered
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(modalSlideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, 100);
  };

  // Close settings modal with animation
  const closeSettingsModal = () => {
    Animated.parallel([
      Animated.timing(modalSlideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSettingsModal(false);
    });
  };

  // Check if Twitter is already linked
  const hasTwitter = user?.linked_accounts?.some(
    (acc) => acc.type === "twitter_oauth"
  );

  // Find Twitter account info
  const twitterAccount = user?.linked_accounts?.find(a => a.type === 'twitter_oauth');
  const twitterPfp = twitterAccount?.profile_picture_url;

  if (!user) {
    return null;
  }

  // --- PROFILE HEADER (NO GREEN BG, NAME+USERNAME BESIDE PFP) ---
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={{
          backgroundColor: theme.card,
          borderBottomWidth: 2,
          borderColor: theme.border,
          position: 'relative',
          zIndex: 1,
          paddingBottom: 0,
          paddingHorizontal: 0,
        }}>
        {/* No green banner */}
        {/* Logout and Settings buttons stacked vertically at top right */}
        <View style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 20,
        }}>
          <TouchableOpacity 
            style={{ 
              backgroundColor: theme.card, 
              borderRadius: 20, 
              borderWidth: 2, 
              borderColor: theme.border, 
              padding: 8,
              shadowColor: theme.shadow,
              shadowOpacity: 0.2,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onPress={openSettingsModal}
          >
            <MaterialIcons name="settings" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
        {/* Profile picture and name/username beside it */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 60, // Adjusted for smaller buttons
            paddingHorizontal: 24,
            paddingBottom: 24,
            backgroundColor: theme.card,
            zIndex: 11,
          }}
        >
          <View style={{
            shadowColor: theme.shadow,
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}>
            {twitterPfp ? (
              <Image 
                source={{ uri: twitterPfp }} 
                style={{ 
                  width: 88, 
                  height: 88, 
                  borderRadius: 44, 
                  borderWidth: 4, 
                  borderColor: theme.card, 
                  backgroundColor: theme.card 
                }} 
              />
            ) : (
              <MaterialIcons 
                name="account-circle" 
                size={88} 
                color={theme.green} 
                style={{ backgroundColor: theme.card, borderRadius: 44 }} 
              />
            )}
          </View>
          <View style={{ marginLeft: 20, flex: 1, justifyContent: 'center' }}>
            <Text style={{
              fontFamily: 'PressStart2P-Regular',
              fontSize: 18,
              color: theme.text,
              textShadowColor: 'rgba(0,0,0,0.7)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 0,
              marginBottom: 6,
              flexShrink: 1,
            }}>
              {twitterAccount?.name || 'User'}
            </Text>
            <Text style={{
              fontFamily: 'PressStart2P-Regular',
              fontSize: 14,
              color: theme.subtext,
              marginBottom: 0,
              flexShrink: 1,
            }}>
              @{twitterAccount?.username || 'user'}
            </Text>
          </View>
        </View>
      </View>

      {/* Wallet Balance Card */}
      <View style={{ backgroundColor: theme.card, borderRadius: 18, marginHorizontal: 18, marginTop: 18, padding: 18, alignItems: 'flex-start', borderWidth: 3, borderColor: theme.border, shadowColor: theme.shadow, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
        <Text style={{ 
          fontSize: 14, 
          color: theme.text, 
          fontFamily: 'PressStart2P-Regular',
          marginBottom: 8, 
          textAlign: 'left',
          textTransform: 'uppercase'
        }}>
          your BALANCE
        </Text>
        <Text style={{ 
          fontSize: 24, 
          fontFamily: 'PressStart2P-Regular',
          color: theme.green, 
          marginTop: 12, 
          textAlign: 'left',
          textShadowColor: 'rgba(0,0,0,0.7)',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 0,
        }}>
          {solBalance && solPrice ? `$${(parseFloat(solBalance) * solPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : loadingBalance ? 'Loading...' : '-'}
        </Text>
        
        {/* SOL Balance */}
        <Text style={{ 
          fontSize: 14, 
          fontFamily: 'PressStart2P-Regular',
          color: theme.subtext, 
          marginTop: 12,
          marginBottom: 4, 
          textAlign: 'left' 
        }}>
          {solBalance !== null ? `${solBalance} SOL` : ''}
        </Text>
        
        {/* BONK Balance */}
        <Text style={{ 
          fontSize: 14, 
          fontFamily: 'PressStart2P-Regular',
          color: theme.orange || '#F97316', 
          marginBottom: 8, 
          textAlign: 'left' 
        }}>
          {bonkBalance !== null ? `${bonkBalance} BONK` : 'Loading BONK...'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ 
            color: theme.green, 
            fontSize: 12, 
            fontFamily: 'PressStart2P-Regular',
            letterSpacing: 0 
          }}>
            {account?.address ? `${account.address.slice(0, 4)}...${account.address.slice(-4)}` : ''}
          </Text>
          <TouchableOpacity
            onPress={async () => {
              if (account?.address) {
                await Clipboard.setStringAsync(account.address);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }
            }}
            style={{ marginLeft: 6 }}
          >
            <MaterialIcons name={copied ? 'check' : 'content-copy'} size={20} color={copied ? '#4caf50' : theme.green} />
          </TouchableOpacity>
        </View>
        {/* Wallet address QR code on profile */}
        {/* QR code removed as requested */}
      </View>
      {/* Add Funds and Withdraw buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 18, marginBottom: 8, paddingHorizontal: 18 }}>
        <RetroButton
          title="ADD"
          onPress={() => setShowAddFundsModal(true)}
          backgroundColor="#4ed620" // Match the login button color
          textColor="#000000"
          fontSize={14}
          letterSpacing={0}
          fontWeight="normal"
          minHeight={48}
          minWidth={120}
          textStyle={{ fontFamily: 'PressStart2P-Regular' }}
        />
        <RetroButton
          title="WITHDRAW"
          onPress={() => setShowWithdrawModal(true)}
          backgroundColor="#F97316" // Orange for withdraw
          textColor="#000000"
          fontSize={14}
          letterSpacing={0}
          fontWeight="normal"
          minHeight={48}
          minWidth={120}
          textStyle={{ fontFamily: 'PressStart2P-Regular' }}
        />
      </View>

      {/* Deposit (Receive) Modal */}
      <Modal
        visible={showReceiveModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowReceiveModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShowReceiveModal(false)}
        />
        <View style={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.modal,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 28,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 20,
        }}>
          {/* Handle */}
          <View style={{
            width: 40,
            height: 4,
            backgroundColor: theme.subtext,
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: 24,
          }} />
          
          <Text style={{ 
            fontSize: 18, 
            fontFamily: 'PressStart2P-Regular',
            color: theme.green, 
            marginBottom: 24, 
            textAlign: 'center',
            textShadowColor: 'rgba(0,0,0,0.7)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 0,
          }}>
            RECEIVE SOL
          </Text>
          <Text style={{ 
            color: theme.text, 
            fontSize: 12, 
            fontFamily: 'PressStart2P-Regular',
            marginBottom: 12, 
            textAlign: 'center' 
          }}>
            YOUR ADDRESS:
          </Text>
          <Text style={{ 
            color: theme.green, 
            fontSize: 10, 
            marginBottom: 12, 
            textAlign: 'center', 
            fontFamily: 'PressStart2P-Regular',
          }}>
            {account?.address}
          </Text>
          <TouchableOpacity
            onPress={async () => {
              if (account?.address) {
                await Clipboard.setStringAsync(account.address);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }
            }}
            style={{ padding: 6, marginBottom: 18, alignSelf: 'center' }}
          >
            <MaterialIcons name={copied ? 'check' : 'content-copy'} size={22} color={copied ? theme.green : theme.green} />
          </TouchableOpacity>
          {/* QR code removed from deposit modal as requested */}
          
          {/* Buy Crypto with Card Option */}
          <RetroButton
            title="BUY CRYPTO WITH CARD"
            backgroundColor="#4ed620"
            textColor="#000000"
            fontSize={12}
            letterSpacing={0}
            fontWeight="normal"
            minHeight={48}
            minWidth={240}
            textStyle={{ fontFamily: 'PressStart2P-Regular' }}
            onPress={() => { setShowReceiveModal(false); Alert.alert('Buy Crypto', 'Buy crypto with card functionality coming soon!'); }}
          />
        </View>
      </Modal>

      {/* Withdraw (Send) Modal */}
      <Modal
        visible={showSendModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSendModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: theme.modal, borderRadius: 24, borderWidth: 3, borderColor: theme.border, padding: 28, width: 340, alignItems: 'center', shadowColor: theme.shadow, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 12 }}>
            <Text style={{ 
              fontSize: 18, 
              fontFamily: 'PressStart2P-Regular',
              color: theme.green, 
              marginBottom: 24, 
              textAlign: 'center',
              textShadowColor: 'rgba(0,0,0,0.7)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 0,
            }}>
              WITHDRAW SOL
            </Text>
            <Text style={{ 
              fontSize: 10, 
              fontFamily: 'PressStart2P-Regular',
              color: theme.subtext, 
              marginBottom: 16, 
              textAlign: 'center' 
            }}>
              DEMO MODE - SIMULATED TRANSACTIONS
            </Text>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <TextInput
                style={{ flex: 1, borderWidth: 3, borderColor: theme.green, borderRadius: 16, padding: 14, fontSize: 16, backgroundColor: theme.input, fontWeight: 'bold', color: theme.text }}
                placeholder="Recipient Address"
                value={sendAddress}
                onChangeText={setSendAddress}
                autoCapitalize="none"
                placeholderTextColor={theme.placeholder}
              />
              <TouchableOpacity
                onPress={async () => {
                  const text = await Clipboard.getStringAsync();
                  setSendAddress(text);
                }}
                style={{ marginLeft: 8, backgroundColor: theme.input, borderRadius: 10, padding: 8, borderWidth: 2, borderColor: theme.green }}
              >
                <MaterialCommunityIcons name="clipboard-outline" size={22} color={theme.green} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={{ width: '100%', borderWidth: 3, borderColor: theme.green, borderRadius: 16, padding: 14, marginBottom: 16, fontSize: 16, backgroundColor: theme.input, fontWeight: 'bold', color: theme.text }}
              placeholder="Amount (SOL)"
              value={sendAmount}
              onChangeText={setSendAmount}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.placeholder}
            />
            {sendError ? <Text style={{ color: '#ff5252', marginBottom: 10, fontWeight: 'bold' }}>{sendError}</Text> : null}
            {sendSuccess ? <Text style={{ color: '#4caf50', marginBottom: 10, fontWeight: 'bold' }}>{sendSuccess}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
              <RetroButton
                title="SEND"
                backgroundColor="#4ed620"
                textColor="#000000"
                fontSize={12}
                letterSpacing={0}
                fontWeight="normal"
                minHeight={40}
                minWidth={100}
                textStyle={{ fontFamily: 'PressStart2P-Regular' }}
                disabled={sending}
                onPress={async () => {
                  setSendError('');
                  setSendSuccess('');
                  if (!sendAddress || !sendAmount) {
                    setSendError('Enter address and amount');
                    return;
                  }
                  let pubkey;
                  try {
                    pubkey = new PublicKey(sendAddress);
                  } catch {
                    setSendError('Invalid address');
                    return;
                  }
                  const amountLamports = Math.floor(Number(sendAmount) * LAMPORTS_PER_SOL);
                  if (isNaN(amountLamports) || amountLamports <= 0) {
                    setSendError('Invalid amount');
                    return;
                  }
                  if (!wallets?.[0]) {
                    setSendError('No wallet found. Please ensure your wallet is connected.');
                    return;
                  }
                  
                  if (!account?.address) {
                    setSendError('Wallet address not available. Please try refreshing.');
                    return;
                  }
                  setSending(true);
                  try {
                    // Check if user has enough balance (including fees)
                    const currentBalance = parseFloat(solBalance || '0');
                    const sendAmountNum = parseFloat(sendAmount);
                    const estimatedFee = 0.000005; // ~5000 lamports for transaction fee
                    
                    if (currentBalance < sendAmountNum + estimatedFee) {
                      setSendError(`Insufficient balance. You need ${(sendAmountNum + estimatedFee).toFixed(6)} SOL (including fees)`);
                      return;
                    }

                    // Use a more reliable RPC endpoint
                    const connection = new Connection('https://solana-mainnet.rpc.extrnode.com', 'confirmed');
                    const fromPubkey = new PublicKey(account?.address || '');
                    const toPubkey = pubkey;
                    
                    // Get recent blockhash
                    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
                    
                    const transaction = new Transaction().add(
                      SystemProgram.transfer({
                        fromPubkey,
                        toPubkey,
                        lamports: amountLamports,
                      })
                    );
                    
                    transaction.feePayer = fromPubkey;
                    transaction.recentBlockhash = blockhash;
                    transaction.lastValidBlockHeight = lastValidBlockHeight;
                    
                    // For now, let's use a simpler approach that should work
                    // We'll simulate the transaction and show a success message
                    // TODO: Implement proper Privy wallet transaction signing
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
                    
                    // For testing purposes, we'll show success
                    // In production, you'll need to implement the correct Privy wallet signing
                    setSendSuccess(`Transaction simulated successfully! (Demo mode)`);
                    setSendAddress('');
                    setSendAmount('');
                    
                    // Simulate balance update
                    const newBalance = parseFloat(solBalance || '0') - parseFloat(sendAmount);
                    setSolBalance(newBalance.toFixed(4));
                    
                  } catch (e) {
                    const err = e as any;
                    console.error('Transaction error:', err);
                    
                    // Provide more specific error messages
                    if (err.message?.includes('insufficient funds')) {
                      setSendError('Insufficient SOL balance for transaction');
                    } else if (err.message?.includes('Invalid blockhash')) {
                      setSendError('Network error. Please try again.');
                    } else if (err.message?.includes('signature')) {
                      setSendError('Transaction signing failed. Please try again.');
                    } else {
                      setSendError(`Transaction failed: ${err.message || 'Unknown error'}`);
                    }
                  } finally {
                    setSending(false);
                  }
                }}
              >
                {sending ? <ActivityIndicator color="#000" /> : null}
              </RetroButton>
              <RetroButton
                title="CANCEL"
                backgroundColor="#FFFFFF"
                textColor="#000000"
                fontSize={12}
                letterSpacing={0}
                fontWeight="normal"
                minHeight={40}
                minWidth={100}
                textStyle={{ fontFamily: 'PressStart2P-Regular' }}
                onPress={() => {
                  setShowSendModal(false);
                  setSendError('');
                  setSendSuccess('');
                  setSendAddress('');
                  setSendAmount('');
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal - Animated like in LoginScreen */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowSettingsModal(false)}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: modalOpacityAnim,
          }}
        >
          <Pressable
            style={{
              flex: 1,
            }}
            onPress={closeSettingsModal}
          />
        </Animated.View>
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.modal,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 32,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 20,
            zIndex: 1000,
            transform: [{ translateY: modalSlideAnim }],
            opacity: modalOpacityAnim,
          }}
        >
          {/* Handle */}
          <View style={{
            width: 40,
            height: 4,
            backgroundColor: theme.subtext,
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: 24,
          }} />

          <Text style={{ 
            fontSize: 18, 
            fontFamily: 'PressStart2P-Regular',
            color: themeName === 'dark' ? theme.green : theme.text, 
            marginBottom: 24, 
            textAlign: 'center',
            textShadowColor: themeName === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(34,197,94,0.15)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 0,
          }}>
            SETTINGS
          </Text>
          
          {/* Settings buttons with consistent theming */}
          <View style={{gap: 16, alignItems: 'center', width: '100%'}}>
            <RetroButton
              title={themeName === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}
              onPress={toggleTheme}
              backgroundColor={themeName === 'dark' ? '#ffffff' : '#000000'}
              textColor={themeName === 'dark' ? '#000000' : '#ffffff'}
              fontSize={12}
              letterSpacing={0}
              fontWeight="normal"
              minHeight={48}
              minWidth={240}
              textStyle={{ fontFamily: 'PressStart2P-Regular' }}
            />
            <RetroButton
              title="LOGOUT"
              onPress={() => { closeSettingsModal(); logout(); }}
              backgroundColor={themeName === 'dark' ? '#333333' : '#ffffff'}
              textColor="#ff4444"
              fontSize={12}
              letterSpacing={0}
              fontWeight="normal"
              minHeight={48}
              minWidth={240}
              textStyle={{ fontFamily: 'PressStart2P-Regular' }}
            />
          </View>
        </Animated.View>
      </Modal>

      {/* Tabs for Live Bets and Previous Bets */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 28, borderBottomWidth: 2, borderColor: theme.border, marginHorizontal: 8 }}>
        {[
          { key: 'live', label: 'YOUR LIVE BETS' },
          { key: 'previous', label: 'PREVIOUS BETS' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as any)}
            style={{ borderBottomWidth: activeTab === tab.key ? 3 : 0, borderColor: theme.green, paddingBottom: 8, minWidth: 120, alignItems: 'center' }}
          >
            <Text style={{ 
              fontSize: 12, 
              fontFamily: 'PressStart2P-Regular',
              color: activeTab === tab.key ? theme.text : theme.subtext 
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Tab Content */}
      <View style={{ marginTop: 18, marginBottom: 60 }}>
        {loadingBets ? (
          <View style={{ backgroundColor: theme.card, borderRadius: 16, marginHorizontal: 18, padding: 18, borderWidth: 2, borderColor: theme.border, alignItems: 'center' }}>
            <ActivityIndicator color={theme.green} />
            <Text style={{ 
              color: theme.subtext, 
              fontSize: 12,
              fontFamily: 'PressStart2P-Regular',
              marginTop: 8 
            }}>
              LOADING YOUR BETS...
            </Text>
          </View>
        ) : (
          <>
            {activeTab === 'live' ? (
              // Live bets
              userBets.filter(bet => bet.isActive && new Date(bet.endTime) > new Date()).length === 0 ? (
                <View style={{ backgroundColor: theme.card, borderRadius: 16, marginHorizontal: 18, padding: 18, borderWidth: 2, borderColor: theme.border }}>
                  <Text style={{ 
                    color: theme.subtext, 
                    fontSize: 12,
                    fontFamily: 'PressStart2P-Regular',
                  }}>
                    NO LIVE BETS YET.
                  </Text>
                </View>
              ) : (
                userBets
                  .filter(bet => bet.isActive && new Date(bet.endTime) > new Date())
                  .map((bet, index) => (
                    <BetCard 
                      key={bet.id} 
                      bet={bet} 
                      userWallet={account?.address} 
                      theme={theme}
                      onEndPosition={handleEndPosition}
                      endingPosition={endingPosition}
                    />
                  ))
              )
            ) : (
              // Previous bets (ended or inactive)
              userBets.filter(bet => !bet.isActive || new Date(bet.endTime) <= new Date()).length === 0 ? (
                <View style={{ backgroundColor: theme.card, borderRadius: 16, marginHorizontal: 18, padding: 18, borderWidth: 2, borderColor: theme.border }}>
                  <Text style={{ 
                    color: theme.subtext, 
                    fontSize: 12,
                    fontFamily: 'PressStart2P-Regular',
                  }}>
                    NO PREVIOUS BETS YET.
                  </Text>
                </View>
              ) : (
                userBets
                  .filter(bet => !bet.isActive || new Date(bet.endTime) <= new Date())
                  .map((bet, index) => (
                    <BetCard 
                      key={bet.id} 
                      bet={bet} 
                      userWallet={account?.address} 
                      theme={theme}
                      onEndPosition={handleEndPosition}
                      endingPosition={endingPosition}
                    />
                  ))
              )
            )}
          </>
        )}
      </View>

      {/* Add Funds Modal */}
      <Modal
        visible={showAddFundsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddFundsModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShowAddFundsModal(false)}
        />
        <View style={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.modal,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 28,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 20,
        }}>
          {/* Handle */}
          <View style={{
            width: 40,
            height: 4,
            backgroundColor: theme.subtext,
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: 24,
          }} />
          
          <Text style={{ 
            fontSize: 18, 
            fontFamily: 'PressStart2P-Regular',
            color: theme.green, 
            marginBottom: 24, 
            textAlign: 'center',
            textShadowColor: 'rgba(0,0,0,0.7)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 0,
          }}>
            ADD FUNDS / CONNECT WALLET
          </Text>
          
          <Text style={{ 
            color: theme.text, 
            fontSize: 12, 
            fontFamily: 'PressStart2P-Regular',
            marginBottom: 16, 
            textAlign: 'center' 
          }}>
            ENTER AMOUNT (SOL):
          </Text>
          
          <TextInput
            style={{ 
              width: '100%', 
              borderWidth: 3, 
              borderColor: theme.green, 
              borderRadius: 16, 
              padding: 14, 
              marginBottom: 24, 
              fontSize: 16, 
              backgroundColor: theme.input, 
              fontWeight: 'bold', 
              color: theme.text,
              fontFamily: 'PressStart2P-Regular',
            }}
            placeholder="0.1"
            value={addFundsAmount}
            onChangeText={setAddFundsAmount}
            keyboardType="decimal-pad"
            placeholderTextColor={theme.placeholder}
          />
          
          <Text style={{ 
            color: theme.subtext, 
            fontSize: 10, 
            fontFamily: 'PressStart2P-Regular',
            marginBottom: 20, 
            textAlign: 'center' 
          }}>
            CHOOSE WALLET:
          </Text>
          
          {/* Connect Phantom Button with status */}
          <TouchableOpacity
            style={{
              backgroundColor: phantomWalletPublicKey ? '#4CAF50' : '#9945FF',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: theme.border,
              marginBottom: 12,
            }}
            onPress={() => {
              if (phantomWalletPublicKey) {
                // If connected, proceed with transfer
                if (!addFundsAmount || parseFloat(addFundsAmount) <= 0) {
                  Alert.alert('Error', 'Please enter a valid amount');
                  return;
                }
                handlePhantomTransfer(addFundsAmount);
                setShowAddFundsModal(false);
                setAddFundsAmount('');
              } else {
                // If not connected, connect first
                connectToPhantom();
              }
            }}
            disabled={connectingToPhantom}
          >
            {connectingToPhantom ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{
                color: '#fff',
                fontSize: 14,
                fontFamily: 'PressStart2P-Regular',
                fontWeight: 'bold',
              }}>
                {phantomWalletPublicKey ? 
                  `✓ CONNECTED - ADD FUNDS` : 
                  'CONNECT PHANTOM'}
              </Text>
            )}
          </TouchableOpacity>
          
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#9945FF',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: theme.border,
              }}
              onPress={() => {
                if (!addFundsAmount || parseFloat(addFundsAmount) <= 0) {
                  Alert.alert('Error', 'Please enter a valid amount');
                  return;
                }
                handlePhantomTransfer(addFundsAmount);
                setShowAddFundsModal(false);
                setAddFundsAmount('');
              }}
            >
              <Text style={{
                color: '#fff',
                fontSize: 14,
                fontFamily: 'PressStart2P-Regular',
                fontWeight: 'bold',
              }}>
                PHANTOM WALLET
              </Text>
            </TouchableOpacity>
            

          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShowWithdrawModal(false)}
        />
        <View style={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.modal,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 28,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 20,
        }}>
          {/* Handle */}
          <View style={{
            width: 40,
            height: 4,
            backgroundColor: theme.subtext,
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: 24,
          }} />
          
          <Text style={{ 
            fontSize: 18, 
            fontFamily: 'PressStart2P-Regular',
            color: theme.orange, 
            marginBottom: 24, 
            textAlign: 'center',
            textShadowColor: 'rgba(0,0,0,0.7)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 0,
          }}>
            WITHDRAW FUNDS
          </Text>
          
          {/* Token Selection */}
          <Text style={{ 
            color: theme.text, 
            fontSize: 12, 
            fontFamily: 'PressStart2P-Regular',
            marginBottom: 16, 
            textAlign: 'center' 
          }}>
            SELECT TOKEN:
          </Text>
          
          <View style={{ flexDirection: 'row', marginBottom: 24 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: withdrawToken === 'SOL' ? theme.green : theme.input,
                borderRadius: 12,
                padding: 12,
                marginRight: 8,
                borderWidth: 2,
                borderColor: withdrawToken === 'SOL' ? theme.green : theme.border,
                alignItems: 'center',
              }}
              onPress={() => setWithdrawToken('SOL')}
            >
              <Text style={{
                color: withdrawToken === 'SOL' ? '#fff' : theme.text,
                fontSize: 14,
                fontFamily: 'PressStart2P-Regular',
                fontWeight: 'bold',
              }}>
                SOL
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: withdrawToken === 'BONK' ? theme.orange : theme.input,
                borderRadius: 12,
                padding: 12,
                marginLeft: 8,
                borderWidth: 2,
                borderColor: withdrawToken === 'BONK' ? theme.orange : theme.border,
                alignItems: 'center',
              }}
              onPress={() => setWithdrawToken('BONK')}
            >
              <Text style={{
                color: withdrawToken === 'BONK' ? '#fff' : theme.text,
                fontSize: 14,
                fontFamily: 'PressStart2P-Regular',
                fontWeight: 'bold',
              }}>
                BONK
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Recipient Address */}
          <Text style={{ 
            color: theme.text, 
            fontSize: 12, 
            fontFamily: 'PressStart2P-Regular',
            marginBottom: 16, 
            textAlign: 'center' 
          }}>
            RECIPIENT ADDRESS:
          </Text>
          
          <TextInput
            style={{ 
              width: '100%', 
              borderWidth: 3, 
              borderColor: theme.orange, 
              borderRadius: 16, 
              padding: 14, 
              marginBottom: 24, 
              fontSize: 16, 
              backgroundColor: theme.input, 
              fontWeight: 'bold', 
              color: theme.text,
              fontFamily: 'PressStart2P-Regular',
            }}
            placeholder="Enter Solana wallet address"
            value={withdrawAddress}
            onChangeText={setWithdrawAddress}
            autoCapitalize="none"
            placeholderTextColor={theme.placeholder}
          />
          
          {/* Amount */}
          <Text style={{ 
            color: theme.text, 
            fontSize: 12, 
            fontFamily: 'PressStart2P-Regular',
            marginBottom: 16, 
            textAlign: 'center' 
          }}>
            AMOUNT ({withdrawToken}):
          </Text>
          
          <TextInput
            style={{ 
              width: '100%', 
              borderWidth: 3, 
              borderColor: theme.orange, 
              borderRadius: 16, 
              padding: 14, 
              marginBottom: 24, 
              fontSize: 16, 
              backgroundColor: theme.input, 
              fontWeight: 'bold', 
              color: theme.text,
              fontFamily: 'PressStart2P-Regular',
            }}
            placeholder={withdrawToken === 'SOL' ? "0.1" : "1000"}
            value={withdrawAmount}
            onChangeText={setWithdrawAmount}
            keyboardType="decimal-pad"
            placeholderTextColor={theme.placeholder}
          />
          
          {/* Available Balance */}
          <Text style={{ 
            color: theme.subtext, 
            fontSize: 10, 
            fontFamily: 'PressStart2P-Regular',
            marginBottom: 20, 
            textAlign: 'center' 
          }}>
            Available: {withdrawToken === 'SOL' ? 
              (solBalance ? `${solBalance} SOL` : '0 SOL') : 
              (bonkBalance ? `${bonkBalance} BONK` : '0 BONK')}
          </Text>
          
          {/* Debug Info */}
          <Text style={{ 
            color: theme.subtext, 
            fontSize: 8, 
            fontFamily: 'PressStart2P-Regular',
            marginBottom: 10, 
            textAlign: 'center' 
          }}>
            Debug: SOL={solBalance}, BONK={bonkBalance}
          </Text>
          
          {/* Action Buttons */}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
          <RetroButton
            title="REFRESH"
            backgroundColor={theme.green}
            textColor="#000000"
            fontSize={12}
            letterSpacing={0}
            fontWeight="normal"
            minHeight={48}
            minWidth={80}
            textStyle={{ fontFamily: 'PressStart2P-Regular' }}
            onPress={() => {
              console.log('Manual refresh triggered');
              fetchBalance();
            }}
          />
          <RetroButton
            title="WITHDRAW"
            backgroundColor={theme.orange}
            textColor="#000000"
            fontSize={12}
            letterSpacing={0}
            fontWeight="normal"
            minHeight={48}
            minWidth={120}
            textStyle={{ fontFamily: 'PressStart2P-Regular' }}
              onPress={() => {
                if (!withdrawAddress || !withdrawAmount) {
                  Alert.alert('Error', 'Please enter address and amount');
                  return;
                }
                
                // Validate Solana address
                try {
                  new PublicKey(withdrawAddress);
                } catch {
                  Alert.alert('Error', 'Invalid Solana address');
                  return;
                }
                
                // Validate amount
                const amount = parseFloat(withdrawAmount);
                if (isNaN(amount) || amount <= 0) {
                  Alert.alert('Error', 'Invalid amount');
                  return;
                }
                
                // Check if user has enough balance
                const currentBalance = withdrawToken === 'SOL' ? 
                  parseFloat(solBalance || '0') : 
                  parseFloat(bonkBalance || '0');
                
                if (amount > currentBalance) {
                  Alert.alert('Error', `Insufficient ${withdrawToken} balance`);
                  return;
                }
                
                // For now, just show success (demo mode)
                Alert.alert(
                  'Withdrawal Requested',
                  `Withdrawal of ${withdrawAmount} ${withdrawToken} to ${withdrawAddress.slice(0, 8)}... has been submitted.`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        setShowWithdrawModal(false);
                        setWithdrawAddress('');
                        setWithdrawAmount('');
                      }
                    }
                  ]
                );
              }}
            />
            
            <RetroButton
              title="CANCEL"
              backgroundColor="#FFFFFF"
              textColor="#000000"
              fontSize={12}
              letterSpacing={0}
              fontWeight="normal"
              minHeight={48}
              minWidth={120}
              textStyle={{ fontFamily: 'PressStart2P-Regular' }}
              onPress={() => {
                setShowWithdrawModal(false);
                setWithdrawAddress('');
                setWithdrawAmount('');
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Remove tabs and live/previous bets sections */}
      {/* Bottom nav is already present globally */}
      </ScrollView>
    </SafeAreaView>
  );
};
