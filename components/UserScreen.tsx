import React, { useState, useCallback, useEffect, useContext } from "react";
import { Text, TextInput, View, Button, ScrollView, Image, TouchableOpacity, Alert, Modal, ActivityIndicator, ImageBackground, SafeAreaView, Dimensions, Pressable } from "react-native";

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
  const windowWidth = Dimensions.get('window').width;
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { theme: themeName, toggleTheme } = useContext(ThemeContext);
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
    background: '#18181b',
    card: '#232323',
    text: '#fff',
    subtext: '#bbb',
    border: '#333',
    green: '#22c55e',
    shadow: '#000',
    input: '#232323',
    modal: '#232323',
    placeholder: '#888',
  };
  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    const fetchBalance = async () => {
      if (!account?.address) return;
      setLoadingBalance(true);
      try {
        const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=397b5828-cbba-479e-992e-7000c78d482b');
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Top Banner (Twitter-style resolution) */}
      <ImageBackground
        source={{ uri: 'https://abs.twimg.com/sticky/default_profile_banners/4k.png' }} // Twitter default banner
        style={{ width: '100%', height: 150, backgroundColor: theme.card, justifyContent: 'flex-end' }}
        resizeMode="cover"
      >
        {/* Settings button top right */}
        <TouchableOpacity style={{ position: 'absolute', top: 24, right: 24, backgroundColor: theme.card, borderRadius: 20, borderWidth: 2, borderColor: theme.border, padding: 6, zIndex: 10 }}
          onPress={() => setShowSettingsModal(true)}
        >
          <MaterialIcons name="settings" size={24} color={theme.text} />
        </TouchableOpacity>
        {/* Profile row: avatar left, username right, overlapping banner */}
        <View style={{ flexDirection: 'row', alignItems: 'center', position: 'absolute', left: 24, bottom: -24, zIndex: 5 }}>
          {twitterPfp ? (
            <Image source={{ uri: twitterPfp }} style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: theme.card, backgroundColor: theme.card }} />
          ) : (
            <MaterialIcons name="account-circle" size={72} color={theme.green} style={{ backgroundColor: theme.card, borderRadius: 36 }} />
          )}
          <Text style={{ fontWeight: 'bold', fontSize: 20, color: theme.text, marginLeft: 14 }}>
            @{twitterAccount?.username || 'user'}
          </Text>
        </View>
      </ImageBackground>

      {/* Wallet Balance Card */}
      <View style={{ backgroundColor: theme.card, borderRadius: 18, marginHorizontal: 18, marginTop: 16, padding: 18, alignItems: 'flex-start', borderWidth: 3, borderColor: theme.border, shadowColor: theme.shadow, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
        <Text style={{ fontSize: 16, color: theme.text, fontWeight: 'bold', marginBottom: 8, textAlign: 'left' }}>wallet balance</Text>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: theme.green, marginTop: 8, textAlign: 'left' }}>
          {solBalance && solPrice ? `$${(parseFloat(solBalance) * solPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : loadingBalance ? 'Loading...' : '-'}
        </Text>
        <Text style={{ fontSize: 18, color: theme.subtext, marginBottom: 8, textAlign: 'left' }}>
          {solBalance !== null ? `${solBalance} SOL` : ''}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ color: theme.green, fontSize: 18, fontWeight: 'bold', letterSpacing: 1 }}>
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
      {/* Deposit and Withdraw buttons (outside balance card) */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 18, marginBottom: 8 }}>
        <TouchableOpacity
          style={{
            backgroundColor: theme.green,
            borderRadius: 24,
            borderWidth: 3,
            borderColor: theme.border,
            paddingVertical: 12,
            paddingHorizontal: 32,
            shadowColor: theme.shadow,
            shadowOpacity: 0.10,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}
          onPress={() => setShowReceiveModal(true)}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17, letterSpacing: 1 }}>Deposit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: theme.card,
            borderRadius: 24,
            borderWidth: 3,
            borderColor: theme.green,
            paddingVertical: 12,
            paddingHorizontal: 32,
            shadowColor: theme.shadow,
            shadowOpacity: 0.10,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}
          onPress={() => setShowSendModal(true)}
        >
          <Text style={{ color: theme.green, fontWeight: 'bold', fontSize: 17, letterSpacing: 1 }}>Withdraw</Text>
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
          
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.green, marginBottom: 18, letterSpacing: 1, textAlign: 'center' }}>Receive SOL</Text>
          <Text style={{ color: theme.text, fontSize: 15, marginBottom: 12, textAlign: 'center' }}>Your Address:</Text>
          <Text style={{ color: theme.green, fontSize: 13, marginBottom: 12, textAlign: 'center', fontWeight: 'bold' }}>{account?.address}</Text>
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
          <TouchableOpacity
            style={{ backgroundColor: theme.green, borderRadius: 18, borderWidth: 3, borderColor: theme.border, paddingVertical: 14, paddingHorizontal: 32, minWidth: 180, alignItems: 'center', marginBottom: 12, shadowColor: theme.shadow, shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}
            onPress={() => { setShowReceiveModal(false); Alert.alert('Buy Crypto', 'Buy crypto with card functionality coming soon!'); }}
          >
            <MaterialIcons name="credit-card" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17, letterSpacing: 1 }}>Buy Crypto with Card</Text>
          </TouchableOpacity>
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
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.green, marginBottom: 18, letterSpacing: 1 }}>Withdraw SOL</Text>
            <Text style={{ fontSize: 12, color: theme.subtext, marginBottom: 16, textAlign: 'center' }}>Currently in demo mode - transactions are simulated</Text>
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
              <TouchableOpacity
                style={{ backgroundColor: theme.green, borderRadius: 18, borderWidth: 3, borderColor: theme.border, paddingVertical: 12, paddingHorizontal: 32, minWidth: 100, alignItems: 'center', shadowColor: theme.shadow, shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}
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
                {sending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }}>Send</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: theme.card, borderRadius: 18, borderWidth: 3, borderColor: theme.green, paddingVertical: 12, paddingHorizontal: 32, minWidth: 100, alignItems: 'center', shadowColor: theme.shadow, shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}
                onPress={() => {
                  setShowSendModal(false);
                  setSendError('');
                  setSendSuccess('');
                  setSendAddress('');
                  setSendAmount('');
                }}
              >
                <Text style={{ color: theme.green, fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShowSettingsModal(false)}
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

          <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.green, marginBottom: 18, letterSpacing: 1, textAlign: 'center' }}>Settings</Text>
          <TouchableOpacity
            style={{ backgroundColor: theme.green, borderRadius: 18, borderWidth: 3, borderColor: theme.border, paddingVertical: 14, paddingHorizontal: 32, minWidth: 180, alignItems: 'center', marginBottom: 12, shadowColor: theme.shadow, shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}
            onPress={() => { setShowSettingsModal(false); Alert.alert('Delegate Wallet', 'Delegate wallet functionality coming soon!'); }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17, letterSpacing: 1 }}>Delegate Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.input, borderRadius: 18, borderWidth: 3, borderColor: theme.green, paddingVertical: 14, paddingHorizontal: 32, minWidth: 180, marginBottom: 12, shadowColor: theme.shadow, shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}
            onPress={toggleTheme}
          >
            <MaterialCommunityIcons name={themeName === 'dark' ? 'white-balance-sunny' : 'moon-waning-crescent'} size={22} color={theme.green} style={{ marginRight: 10 }} />
            <Text style={{ color: theme.green, fontWeight: 'bold', fontSize: 17, letterSpacing: 1 }}>
              {themeName === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{  borderRadius: 18, borderWidth: 3, borderColor: theme.border, paddingVertical: 14, paddingHorizontal: 32, minWidth: 180, alignItems: 'center', marginBottom: 12, shadowColor: theme.shadow, shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}
            onPress={() => { setShowSettingsModal(false); logout(); }}
          >
            <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 17, letterSpacing: 1 }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Tabs for Live Bets and Previous Bets */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 28, borderBottomWidth: 2, borderColor: theme.border, marginHorizontal: 8 }}>
        {[
          { key: 'live', label: 'Your Live Bets' },
          { key: 'previous', label: 'Previous Bets' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as any)}
            style={{ borderBottomWidth: activeTab === tab.key ? 3 : 0, borderColor: theme.green, paddingBottom: 8, minWidth: 120, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 18, fontWeight: activeTab === tab.key ? 'bold' : 'normal', color: activeTab === tab.key ? theme.text : theme.subtext }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Tab Content */}
      {activeTab === 'live' ? (
        <View style={{ backgroundColor: theme.card, borderRadius: 16, marginHorizontal: 18, marginTop: 18, padding: 18, borderWidth: 2, borderColor: theme.border, shadowColor: theme.shadow, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
          <Text style={{ color: theme.subtext, fontSize: 16 }}>No live bets yet.</Text>
        </View>
      ) : (
        <View style={{ backgroundColor: theme.card, borderRadius: 16, marginHorizontal: 18, marginTop: 18, padding: 18, borderWidth: 2, borderColor: theme.border, shadowColor: theme.shadow, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
          <Text style={{ color: theme.subtext, fontSize: 16 }}>No previous bets yet.</Text>
        </View>
      )}

      {/* Remove tabs and live/previous bets sections */}
      {/* Bottom nav is already present globally */}
    </SafeAreaView>
  );
};
