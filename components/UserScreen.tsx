import React, { useState, useCallback, useEffect, useContext, useRef } from "react";
import { Text, TextInput, View, Button, ScrollView, Image, TouchableOpacity, Alert, Modal, ActivityIndicator, ImageBackground, SafeAreaView, Dimensions, Pressable, Animated } from "react-native";
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
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
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

export const UserScreen = () => {
  // Remove signedMessages and signMessage logic
  const { logout, user } = usePrivy();
  const { linkWithPasskey } = useLinkWithPasskey();
  const oauth = useLinkWithOAuth();
  const { wallets, create } = useEmbeddedSolanaWallet();
  const account = getUserEmbeddedSolanaWallet(user);
  const [copied, setCopied] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingWallet, setExportingWallet] = useState(false);
  const [exportedPrivateKey, setExportedPrivateKey] = useState<string | null>(null);
  const [solBalance, setSolBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const router = useRouter();
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'previous'>('live');
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
    shadow: '#130f1c', // Very dark purple shadow
    input: '#352d4d', // Medium-dark purple input
    modal: '#2d2640', // Same as card color
    placeholder: '#8778b3', // Medium-light purple placeholder
  };
  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    const fetchBalance = async () => {
      if (!account?.address) return;
      setLoadingBalance(true);
      try {
        const connection = new Connection('https://api.mainnet-beta.solana.com');
        const balance = await connection.getBalance(new PublicKey(account.address));
        setSolBalance((balance / LAMPORTS_PER_SOL).toFixed(4));
      } catch (e) {
        setSolBalance(null);
      } finally {
        setLoadingBalance(false);
      }
    };
    fetchBalance();
  }, [account?.address]);

  useEffect(() => {
    // Fetch real-time SOL price in USD
    const fetchSolPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await res.json();
        setSolPrice(data.solana.usd);
      } catch {}
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

  // Export wallet using REST API
  const exportWallet = async () => {
    if (!account?.address) {
      Alert.alert('Error', 'No wallet address found');
      return;
    }

    setExportingWallet(true);
    try {
      // Generate a base64-encoded key pair for the recipient
      const keypair = await crypto?.subtle?.generateKey(
        {
          name: "ECDH",
          namedCurve: "P-256"
        },
        true,
        ["deriveKey", "deriveBits"]
      );
      
      const [publicKey, privateKey] = await Promise.all([
        crypto.subtle.exportKey("spki", keypair.publicKey),
        crypto.subtle.exportKey("pkcs8", keypair.privateKey)
      ]);
      
      const [publicKeyBase64, privateKeyBase64] = [
        Buffer.from(publicKey).toString("base64"),
        Buffer.from(privateKey).toString("base64")
      ];

      // Create the signature for the request
      const input = {
        headers: {
          "privy-app-id": "cmdfmgl76001qlh0mi0ggzx5l", // Replace with your actual Privy App ID
        },
        method: "POST",
        url: `https://api.privy.io/v1/wallets/${account.address}/export`,
        version: 1,
        body: {
          encryption_type: "HPKE",
          recipient_public_key: publicKeyBase64,
        },
      };

      // Make the request to export the wallet
      const res = await fetch(
        `https://api.privy.io/v1/wallets/${account.address}/export`,
        {
          method: input.method,
          headers: {
            ...input.headers,
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from('your-privy-app-id:your-privy-app-secret').toString('base64')}`, // Replace with actual credentials
          },
          body: JSON.stringify(input.body),
        }
      );

      if (!res.ok) {
        throw new Error(`Export failed: ${res.status} ${res.statusText}`);
      }

      const exportData = await res.json();
      
      // For now, we'll show the encrypted data
      // In a real implementation, you'd decrypt this using the HPKE library
      setExportedPrivateKey(JSON.stringify(exportData, null, 2));
      
      Alert.alert(
        'Export Successful',
        'Your wallet has been exported. The private key is encrypted and secure.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Failed',
        `Failed to export wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setExportingWallet(false);
    }
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
        <Text style={{ 
          fontSize: 14, 
          fontFamily: 'PressStart2P-Regular',
          color: theme.subtext, 
          marginTop: 12,
          marginBottom: 8, 
          textAlign: 'left' 
        }}>
          {solBalance !== null ? `${solBalance} SOL` : ''}
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
      {/* Deposit button (outside balance card) */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18, marginBottom: 8 }}>
        <RetroButton
          title="RECEIVE"
          onPress={() => setShowReceiveModal(true)}
          backgroundColor="#4ed620" // Match the login button color
          textColor="#000000"
          fontSize={14}
          letterSpacing={0}
          fontWeight="normal"
          minHeight={48}
          minWidth={120}
          textStyle={{ fontFamily: 'PressStart2P-Regular' }}
        />
        <TouchableOpacity
          onPress={() => setShowExportModal(true)}
          style={{
            marginLeft: 12,
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
        >
          <MaterialIcons name="more-vert" size={24} color={theme.text} />
        </TouchableOpacity>
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
      {activeTab === 'live' ? (
        <View style={{ backgroundColor: theme.card, borderRadius: 16, marginHorizontal: 18, marginTop: 18, padding: 18, borderWidth: 2, borderColor: theme.border, shadowColor: theme.shadow, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
          <Text style={{ 
            color: theme.subtext, 
            fontSize: 12,
            fontFamily: 'PressStart2P-Regular',
          }}>
            NO LIVE BETS YET.
          </Text>
        </View>
      ) : (
        <View style={{ backgroundColor: theme.card, borderRadius: 16, marginHorizontal: 18, marginTop: 18, padding: 18, borderWidth: 2, borderColor: theme.border, shadowColor: theme.shadow, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
          <Text style={{ 
            color: theme.subtext, 
            fontSize: 12,
            fontFamily: 'PressStart2P-Regular',
          }}>
            NO PREVIOUS BETS YET.
          </Text>
        </View>
      )}

      {/* Export Wallet Modal */}
      <Modal
        visible={showExportModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowExportModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShowExportModal(false)}
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
            EXPORT WALLET
          </Text>
          <Text style={{ 
            color: theme.text, 
            fontSize: 12, 
            fontFamily: 'PressStart2P-Regular',
            marginBottom: 16, 
            textAlign: 'center' 
          }}>
            EXPORT YOUR PRIVATE KEY TO USE WITH OTHER WALLETS
          </Text>
          <Text style={{ 
            color: theme.subtext, 
            fontSize: 10, 
            fontFamily: 'PressStart2P-Regular',
            marginBottom: 24, 
            textAlign: 'center',
            lineHeight: 16,
          }}>
            WARNING: Keep your private key secure. Anyone with access to your private key can control your wallet.
          </Text>
          
          {exportedPrivateKey ? (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ 
                color: theme.text, 
                fontSize: 10, 
                fontFamily: 'PressStart2P-Regular',
                marginBottom: 8, 
                textAlign: 'center' 
              }}>
                ENCRYPTED PRIVATE KEY:
              </Text>
              <Text style={{ 
                color: theme.subtext, 
                fontSize: 8, 
                fontFamily: 'PressStart2P-Regular',
                textAlign: 'center',
                lineHeight: 12,
                backgroundColor: theme.input,
                padding: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.border,
              }}>
                {exportedPrivateKey}
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  await Clipboard.setStringAsync(exportedPrivateKey);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
                style={{ 
                  marginTop: 8, 
                  alignSelf: 'center',
                  backgroundColor: theme.green,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                }}
              >
                <Text style={{ 
                  color: '#000000', 
                  fontSize: 10, 
                  fontFamily: 'PressStart2P-Regular',
                  fontWeight: 'bold',
                }}>
                  {copied ? 'COPIED!' : 'COPY'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <RetroButton
              title={exportingWallet ? "EXPORTING..." : "EXPORT PRIVATE KEY"}
              backgroundColor="#ff4444"
              textColor="#ffffff"
              fontSize={12}
              letterSpacing={0}
              fontWeight="normal"
              minHeight={48}
              minWidth={240}
              textStyle={{ fontFamily: 'PressStart2P-Regular' }}
              disabled={exportingWallet}
              onPress={exportWallet}
            />
          )}
          
          {exportedPrivateKey && (
            <RetroButton
              title="EXPORT NEW KEY"
              backgroundColor="#4ed620"
              textColor="#000000"
              fontSize={12}
              letterSpacing={0}
              fontWeight="normal"
              minHeight={48}
              minWidth={240}
              textStyle={{ fontFamily: 'PressStart2P-Regular' }}
              onPress={() => {
                setExportedPrivateKey(null);
                exportWallet();
              }}
            />
          )}
        </View>
      </Modal>

      {/* Remove tabs and live/previous bets sections */}
      {/* Bottom nav is already present globally */}
    </SafeAreaView>
  );
};
