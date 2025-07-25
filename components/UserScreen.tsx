import React, { useState, useCallback, useEffect } from "react";
import { Text, TextInput, View, Button, ScrollView, Image, TouchableOpacity, Alert, Modal, ActivityIndicator, ImageBackground, SafeAreaView, Dimensions } from "react-native";

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f8fa' }}>
      {/* Top Banner (Twitter-style resolution) */}
      <ImageBackground
        source={{ uri: 'https://abs.twimg.com/sticky/default_profile_banners/4k.png' }} // Twitter default banner
        style={{ width: '100%', height: 150, backgroundColor: '#eee', justifyContent: 'flex-end' }}
        resizeMode="cover"
      >
        {/* Settings button top right */}
        <TouchableOpacity style={{ position: 'absolute', top: 24, right: 24, backgroundColor: '#fff', borderRadius: 20, borderWidth: 2, borderColor: '#000', padding: 6, zIndex: 10 }}>
          <MaterialIcons name="settings" size={24} color="#222" />
        </TouchableOpacity>
        {/* Profile row: avatar left, username right, overlapping banner */}
        <View style={{ flexDirection: 'row', alignItems: 'center', position: 'absolute', left: 24, bottom: -24, zIndex: 5 }}>
          {twitterPfp ? (
            <Image source={{ uri: twitterPfp }} style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', backgroundColor: '#eee' }} />
          ) : (
            <MaterialIcons name="account-circle" size={72} color="#6c63ff" style={{ backgroundColor: '#fff', borderRadius: 36 }} />
          )}
          <Text style={{ fontWeight: 'bold', fontSize: 20, color: '#222', marginLeft: 14 }}>
            @{twitterAccount?.username || 'user'}
          </Text>
        </View>
      </ImageBackground>

      {/* Wallet Balance Card */}
      <View style={{ backgroundColor: '#fff', borderRadius: 18, marginHorizontal: 18, marginTop: 16, padding: 18, alignItems: 'flex-start', borderWidth: 3, borderColor: '#000', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
        <Text style={{ fontSize: 16, color: '#222', fontWeight: 'bold', marginBottom: 8, textAlign: 'left' }}>wallet balance</Text>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#6c63ff', marginTop: 8, textAlign: 'left' }}>
          {solBalance && solPrice ? `$${(parseFloat(solBalance) * solPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : loadingBalance ? 'Loading...' : '-'}
        </Text>
        <Text style={{ fontSize: 18, color: '#444', marginBottom: 8, textAlign: 'left' }}>
          {solBalance !== null ? `${solBalance} SOL` : ''}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ color: '#1da1f2', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 }}>
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
            <MaterialIcons name={copied ? 'check' : 'content-copy'} size={20} color={copied ? '#4caf50' : '#1da1f2'} />
          </TouchableOpacity>
        </View>
        {/* Wallet address QR code on profile */}
        {/* QR code removed as requested */}
      </View>
      {/* Deposit and Withdraw buttons (outside balance card) */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 18, marginBottom: 8 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#6c63ff',
            borderRadius: 24,
            borderWidth: 3,
            borderColor: '#000',
            paddingVertical: 12,
            paddingHorizontal: 32,
            shadowColor: '#000',
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
            backgroundColor: '#fff',
            borderRadius: 24,
            borderWidth: 3,
            borderColor: '#6c63ff',
            paddingVertical: 12,
            paddingHorizontal: 32,
            shadowColor: '#000',
            shadowOpacity: 0.10,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}
          onPress={() => setShowSendModal(true)}
        >
          <Text style={{ color: '#6c63ff', fontWeight: 'bold', fontSize: 17, letterSpacing: 1 }}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      {/* Deposit (Receive) Modal */}
      <Modal
        visible={showReceiveModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowReceiveModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 24, width: 320, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#6c63ff', marginBottom: 16 }}>Receive SOL</Text>
            <Text style={{ color: '#444', fontSize: 15, marginBottom: 12 }}>Your Address:</Text>
            <Text style={{ color: '#6c63ff', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{account?.address}</Text>
            <TouchableOpacity
              onPress={async () => {
                if (account?.address) {
                  await Clipboard.setStringAsync(account.address);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }
              }}
              style={{ padding: 6, marginBottom: 18 }}
            >
              <MaterialIcons name={copied ? 'check' : 'content-copy'} size={22} color={copied ? '#4caf50' : '#6c63ff'} />
            </TouchableOpacity>
            {/* QR code removed from deposit modal as requested */}
            <TouchableOpacity
              style={{ backgroundColor: '#eee', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 22, minWidth: 90, alignItems: 'center', marginTop: 8 }}
              onPress={() => setShowReceiveModal(false)}
            >
              <Text style={{ color: '#444', fontWeight: 'bold', fontSize: 15 }}>Close</Text>
            </TouchableOpacity>
          </View>
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
          <View style={{ backgroundColor: '#fff', borderRadius: 24, borderWidth: 3, borderColor: '#000', padding: 28, width: 340, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#6c63ff', marginBottom: 18, letterSpacing: 1 }}>Withdraw SOL</Text>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <TextInput
                style={{ flex: 1, borderWidth: 3, borderColor: '#6c63ff', borderRadius: 16, padding: 14, fontSize: 16, backgroundColor: '#f6f8fa', fontWeight: 'bold', color: '#222' }}
                placeholder="Recipient Address"
                value={sendAddress}
                onChangeText={setSendAddress}
                autoCapitalize="none"
                placeholderTextColor="#bbb"
              />
              <TouchableOpacity
                onPress={async () => {
                  const text = await Clipboard.getStringAsync();
                  setSendAddress(text);
                }}
                style={{ marginLeft: 8, backgroundColor: '#eee', borderRadius: 10, padding: 8, borderWidth: 2, borderColor: '#6c63ff' }}
              >
                <MaterialCommunityIcons name="clipboard-outline" size={22} color="#6c63ff" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={{ width: '100%', borderWidth: 3, borderColor: '#6c63ff', borderRadius: 16, padding: 14, marginBottom: 16, fontSize: 16, backgroundColor: '#f6f8fa', fontWeight: 'bold', color: '#222' }}
              placeholder="Amount (SOL)"
              value={sendAmount}
              onChangeText={setSendAmount}
              keyboardType="decimal-pad"
              placeholderTextColor="#bbb"
            />
            {sendError ? <Text style={{ color: '#ff5252', marginBottom: 10, fontWeight: 'bold' }}>{sendError}</Text> : null}
            {sendSuccess ? <Text style={{ color: '#4caf50', marginBottom: 10, fontWeight: 'bold' }}>{sendSuccess}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#6c63ff', borderRadius: 18, borderWidth: 3, borderColor: '#000', paddingVertical: 12, paddingHorizontal: 32, minWidth: 100, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}
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
                    setSendError('No wallet found');
                    return;
                  }
                  setSending(true);
                  try {
                    const connection = new Connection('https://api.mainnet-beta.solana.com');
                    const fromPubkey = new PublicKey(account.address);
                    const toPubkey = pubkey;
                    const transaction = new Transaction().add(
                      SystemProgram.transfer({
                        fromPubkey,
                        toPubkey,
                        lamports: amountLamports,
                      })
                    );
                    transaction.feePayer = fromPubkey;
                    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                    // Sign with the wallet
                    const signed = await wallets[0].signTransaction(transaction);
                    // Send
                    const signature = await connection.sendRawTransaction(signed.serialize());
                    setSendSuccess('Sent! Signature: ' + signature);
                    setSendAddress('');
                    setSendAmount('');
                  } catch (e) {
                    const err = e as any;
                    setSendError('Failed to send: ' + (err.message || err.toString()));
                  } finally {
                    setSending(false);
                  }
                }}
              >
                {sending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }}>Send</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 3, borderColor: '#6c63ff', paddingVertical: 12, paddingHorizontal: 32, minWidth: 100, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}
                onPress={() => {
                  setShowSendModal(false);
                  setSendError('');
                  setSendSuccess('');
                  setSendAddress('');
                  setSendAmount('');
                }}
              >
                <Text style={{ color: '#6c63ff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tabs for Live Bets and Previous Bets */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 28, borderBottomWidth: 2, borderColor: '#eee', marginHorizontal: 8 }}>
        {[
          { key: 'live', label: 'Your Live Bets' },
          { key: 'previous', label: 'Previous Bets' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as any)}
            style={{ borderBottomWidth: activeTab === tab.key ? 3 : 0, borderColor: '#000', paddingBottom: 8, minWidth: 120, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 18, fontWeight: activeTab === tab.key ? 'bold' : 'normal', color: activeTab === tab.key ? '#000' : '#aaa' }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Tab Content */}
      {activeTab === 'live' ? (
        <View style={{ backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 18, marginTop: 18, padding: 18, borderWidth: 2, borderColor: '#000', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
          <Text style={{ color: '#bbb', fontSize: 16 }}>No live bets yet.</Text>
        </View>
      ) : (
        <View style={{ backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 18, marginTop: 18, padding: 18, borderWidth: 2, borderColor: '#000', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
          <Text style={{ color: '#bbb', fontSize: 16 }}>No previous bets yet.</Text>
        </View>
      )}

      {/* Remove tabs and live/previous bets sections */}
      {/* Bottom nav is already present globally */}
    </SafeAreaView>
  );
};
