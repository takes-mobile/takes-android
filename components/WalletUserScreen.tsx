import React, { useState, useCallback, useEffect, useContext, useRef } from "react";
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  ActivityIndicator, 
  SafeAreaView, 
  Dimensions, 
  Pressable, 
  Animated,
  StyleSheet,
  Image
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useContext as useContextReact } from 'react';
import { ThemeContext } from '../app/_layout';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import RetroButton from './RetroButton';
import { ThemedAlert } from '../components/ThemedAlert';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const WalletUserScreen = () => {
  const router = useRouter();
  const { theme: themeName, toggleTheme } = useContextReact(ThemeContext);
  const { connected, address, disconnectWallet, formatAddress } = useWalletConnection();
  const [solBalance, setSolBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'previous'>('live');
  const [userBets, setUserBets] = useState<any[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);
  const [endingPosition, setEndingPosition] = useState<string | null>(null);
  const [showDisconnectAlert, setShowDisconnectAlert] = useState(false);
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const modalSlideAnim = useRef(new Animated.Value(screenHeight)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;

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
    background: '#1e1a2c',
    card: '#2d2640',
    text: '#fff',
    subtext: '#c8b6e8',
    border: '#4a3f66',
    green: '#22c55e',
    orange: '#F97316',
    shadow: '#130f1c',
    input: '#352d4d',
    modal: '#2d2640',
    placeholder: '#8778b3',
  };

  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  // Fetch wallet balance
  const fetchBalance = useCallback(async () => {
    if (!address) return;
    
    setLoadingBalance(true);
    try {
      const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=397b5828-cbba-479e-992e-7000c78d482b');
      const balance = await connection.getBalance(new PublicKey(address));
      setSolBalance((balance / LAMPORTS_PER_SOL).toFixed(4));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setSolBalance('0.0000');
    } finally {
      setLoadingBalance(false);
    }
  }, [address]);

  // Fetch SOL price in USD
  const fetchSolPrice = useCallback(async () => {
    try {
      // Use CoinGecko API for SOL price
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const data = await response.json();
      if (data && data.solana && data.solana.usd) {
        setSolPrice(data.solana.usd);
      }
    } catch (error) {
      console.error('Error fetching SOL price:', error);
      setSolPrice(null);
    }
  }, []);

  useEffect(() => {
    if (connected && address) {
      fetchBalance();
      fetchSolPrice();
    }
  }, [connected, address, fetchBalance, fetchSolPrice]);

  // Fetch user bets
  const fetchUserBets = useCallback(async () => {
    if (!address) return;
    
    setLoadingBets(true);
    try {
      // For now, we'll set empty bets since we don't have the API integration
      // This can be expanded later to fetch actual user bets
      setUserBets([]);
    } catch (error) {
      console.error('Error fetching user bets:', error);
      setUserBets([]);
    } finally {
      setLoadingBets(false);
    }
  }, [address]);

  // Handle ending position
  const handleEndPosition = useCallback(async (bet: any, participation: any) => {
    // This function can be implemented later for actual bet ending logic
    console.log('Ending position for bet:', bet.id, 'participation:', participation);
  }, []);

  useEffect(() => {
    if (connected && address) {
      fetchUserBets();
    }
  }, [connected, address, fetchUserBets]);

  const openSettingsModal = () => {
    modalSlideAnim.setValue(screenHeight);
    modalOpacityAnim.setValue(0);
    setShowSettingsModal(true);
    
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

  const handleDisconnect = () => {
    setShowDisconnectAlert(true);
  };

  const confirmDisconnect = async () => {
    setShowDisconnectAlert(false);
    await disconnectWallet();
    router.push('/');
  };

  // Calculate USD balance
  let usdBalance: string | null = null;
  if (solBalance && solPrice !== null) {
    const usd = parseFloat(solBalance) * solPrice;
    usdBalance = usd.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
  }

  if (!connected || !address) {
    return (
     <Text>No Wallet Connected</Text>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
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
           
          </View>
          <View style={{ marginTop: 30, marginLeft: 20, flex: 1, justifyContent: 'center' }}>
         
            <Text style={{
              fontFamily: 'PressStart2P-Regular',
              fontSize: 14,
              color: theme.subtext,
              marginBottom: 0,
              flexShrink: 1,
            }}>
              {formatAddress(6)}
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
        {/* USD Balance as primary */}
        <Text style={{ 
          fontSize: 24, 
          fontFamily: 'PressStart2P-Regular',
          color: '#32CD32', // lime green
          marginTop: 12, 
          textAlign: 'left',
          textShadowColor: 'rgba(0,0,0,0.7)',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 0,
        }}>
          {loadingBalance || solPrice === null
            ? 'Loading...'
            : usdBalance
              ? usdBalance
              : '-'}
        </Text>
        
        {/* SOL Balance as subtext */}
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
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ 
            color: theme.green, 
            fontSize: 12, 
            fontFamily: 'PressStart2P-Regular',
            letterSpacing: 0 
          }}>
            {address ? `${address.slice(0, 4)}...${address.slice(-4)}` : ''}
          </Text>
          <TouchableOpacity
            onPress={async () => {
              if (address) {
                // Copy to clipboard logic here
                setShowCopyAlert(true);
              }
            }}
            style={{ marginLeft: 6 }}
          >
            <MaterialIcons name="content-copy" size={20} color={theme.green} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Add Funds and Withdraw buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 18, marginBottom: 8, paddingHorizontal: 18 }}>
        <RetroButton
          title="ADD"
          onPress={() => router.push('/wallet-status')}
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
          onPress={() => router.push('/wallet-status')}
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
      <View style={{ marginTop: 18 }}>
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
                    <View key={bet.id} style={{ backgroundColor: theme.card, borderRadius: 16, marginHorizontal: 18, marginBottom: 12, padding: 18, borderWidth: 2, borderColor: theme.border }}>
                      <Text style={{ 
                        color: theme.text, 
                        fontSize: 14,
                        fontFamily: 'PressStart2P-Regular',
                        marginBottom: 8
                      }}>
                        {bet.title}
                      </Text>
                      <Text style={{ 
                        color: theme.subtext, 
                        fontSize: 12,
                        fontFamily: 'PressStart2P-Regular',
                      }}>
                        {bet.description}
                      </Text>
                    </View>
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
                    <View key={bet.id} style={{ backgroundColor: theme.card, borderRadius: 16, marginHorizontal: 18, marginBottom: 12, padding: 18, borderWidth: 2, borderColor: theme.border }}>
                      <Text style={{ 
                        color: theme.text, 
                        fontSize: 14,
                        fontFamily: 'PressStart2P-Regular',
                        marginBottom: 8
                      }}>
                        {bet.title}
                      </Text>
                      <Text style={{ 
                        color: theme.subtext, 
                        fontSize: 12,
                        fontFamily: 'PressStart2P-Regular',
                      }}>
                        {bet.description}
                      </Text>
                    </View>
                  ))
              )
            )}
          </>
        )}
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="none"
        onRequestClose={closeSettingsModal}
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
            style={{ flex: 1 }}
            onPress={closeSettingsModal}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.modal,
              transform: [{ translateY: modalSlideAnim }],
              opacity: modalOpacityAnim,
            }
          ]}
        >
          <View style={[styles.modalHandle, { backgroundColor: theme.subtext }]} />
          
          <Text style={{ 
            fontSize: 18, 
            fontFamily: 'PressStart2P-Regular',
            color: theme.text, 
            marginBottom: 24, 
            textAlign: 'center',
            textShadowColor: 'rgba(0,0,0,0.7)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 0,
          }}>
            WALLET SETTINGS
          </Text>
          
          <View style={{ gap: 16 }}>
            {/* <RetroButton
              title="VIEW WALLET DETAILS"
              backgroundColor={theme.green}
              textColor="#000000"
              fontSize={14}
              letterSpacing={0}
              fontWeight="normal"
              minHeight={48}
              minWidth={200}
              textStyle={{ fontFamily: 'PressStart2P-Regular' }}
              onPress={() => {
                closeSettingsModal();
                router.push('/wallet-status');
              }}
            /> */}
            
             <RetroButton
               title="TOGGLE THEME"
               backgroundColor={themeName === 'dark' ? '#FFFFFF' : '#000000'}
               textColor={themeName === 'dark' ? '#000000' : '#FFFFFF'}
               fontSize={14}
               letterSpacing={0}
               fontWeight="normal"
               minHeight={48}
               minWidth={200}
               textStyle={{ fontFamily: 'PressStart2P-Regular' }}
               onPress={() => {
                 toggleTheme();
               }}
             />
             
            
            <RetroButton
              title="DISCONNECT WALLET"
              backgroundColor="#EF4444"
              textColor="#000000"
              fontSize={14}
              letterSpacing={0}
              fontWeight="normal"
              minHeight={48}
              minWidth={200}
              textStyle={{ fontFamily: 'PressStart2P-Regular' }}
              onPress={() => {
                closeSettingsModal();
                handleDisconnect();
              }}
            />
            
           
          </View>
        </Animated.View>
      </Modal>

      {/* Themed Alerts */}
      <ThemedAlert
        visible={showDisconnectAlert}
        title="DISCONNECT WALLET"
        message="Are you sure you want to disconnect your wallet?"
        type="warning"
        confirmText="DISCONNECT"
        cancelText="CANCEL"
        showCancel={true}
        onConfirm={confirmDisconnect}
        onCancel={() => setShowDisconnectAlert(false)}
      />

      <ThemedAlert
        visible={showCopyAlert}
        title="COPIED!"
        message="Wallet address copied to clipboard"
        type="success"
        confirmText="OK"
        onConfirm={() => setShowCopyAlert(false)}
      />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
}); 