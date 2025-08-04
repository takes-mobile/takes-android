import { View, Text, TouchableOpacity, Dimensions, RefreshControl, FlatList, Animated, StatusBar, Platform, ActivityIndicator, Modal, TextInput, Alert, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { ThemeContext } from './_layout';
import { useBets, Bet } from '../context/BetsContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Connection, VersionedTransaction } from '@solana/web3.js';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Using Bet interface from BetsContext

export default function LiveBetsScreen() {
  const scrollViewRef = useRef<FlatList>(null);
  const [visibleItemIndices, setVisibleItemIndices] = useState<number[]>([]);
  const { theme: themeName } = useContext(ThemeContext);
  const router = useRouter();
  const { bets, loading, refreshing, fetchBets, setRefreshing } = useBets();
  const flatListRef = useRef<FlatList>(null);

  // Theme configuration based on current theme
  const getTheme = () => {
    if (themeName === 'light') {
      return {
        background: '#ffffff', // White background
        card: '#f8f9fa', // Light gray card background
        text: '#1a1a1a', // Dark text
        subtext: '#6b7280', // Gray subtext
        primary: '#8b5cf6', // Purple primary
        secondary: '#a78bfa', // Lighter purple as secondary
        success: '#10B981', // Green success
        warning: '#EF4444', // Red warning
        orange: '#F97316', // Orange
        pink: '#EC4899', // Pink
        border: '#e5e7eb', // Light border
        cardShadow: 'rgba(0, 0, 0, 0.1)', // Light shadow
      };
    } else {
      return {
        background: '#1e1a2c', // Dark purple background
        card: 'rgba(200,182,232,0.1)', // Translucent light purple
        text: '#FFFFFF', // White text
        subtext: '#c8b6e8', // Light purple subtext
        primary: '#8b5cf6', // Brighter purple as primary
        secondary: '#a78bfa', // Lighter purple as secondary
        success: '#10B981', // Green success
        warning: '#EF4444', // Red warning
        orange: '#F97316', // Orange
        pink: '#EC4899', // Pink
        border: '#4a3f66', // Dark border
        cardShadow: 'rgba(0, 0, 0, 0.3)', // Dark shadow
      };
    }
  };

  const theme = getTheme();

  // Bets are now fetched from the BetsContext

  const onRefresh = () => {
    setRefreshing(true);
    // Trigger light haptic feedback when refresh starts
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    fetchBets();
  };

  const formatTimeLeft = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const formatSolAmount = (amount: number) => {
    return `${amount} SOL`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'General': '#3B82F6',
      'Sports': '#10B981',
      'Politics': '#EF4444',
      'Entertainment': '#8B5CF6',
      'Technology': '#F97316',
    };
    return colors[category as keyof typeof colors] || '#3B82F6';
  };

  
  // For bet placement functionality
  // const getJupiterQuote = async (inputMint: string, outputMint: string, amount: number) => {
  //   try {
  //     const response = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount * 10**9}&slippageBps=50`);
      
  //     if (!response.ok) {
  //       throw new Error('Failed to get Jupiter quote');
  //     }
      
  //     return await response.json();
  //   } catch (error) {
  //     console.error('Jupiter quote error:', error);
  //     throw error;
  //   }
  // };

  // const getJupiterSwapTransaction = async (quoteResponse: any, userPublicKey: string) => {
  //   try {
  //     const response = await fetch('https://quote-api.jup.ag/v6/swap', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         quoteResponse,
  //         userPublicKey,
  //         wrapAndUnwrapSol: true,
  //       }),
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to get Jupiter swap transaction');
  //     }

  //     return await response.json();
  //   } catch (error) {
  //     console.error('Jupiter swap transaction error:', error);
  //     throw error;
  //   }
  // };

  // Card with typewriter effect and betting functionality
  const FullScreenBetCard = ({ bet, theme, router, index }: { bet: Bet; theme: any; router: any; index?: number }) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showBetModal, setShowBetModal] = useState(false);
    const [betAmount, setBetAmount] = useState('0.1');
    const [isPlacingBet, setIsPlacingBet] = useState(false);
    const { wallets } = useEmbeddedSolanaWallet();
    const isExpired = bet.betType !== 'timeless' && new Date(bet.endTime || '') <= new Date();
    const [generatedImage, setGeneratedImage] = useState<string>('');
    
    // Generate image using pollinations.ai API
    const generateImage = async () => {
      if (!bet.question || !bet.options || bet.options.length < 2) {
        return;
      }

      try {
        const prompt = `${bet.question} ${bet.options[0]} vs ${bet.options[1]}`;
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;
        setGeneratedImage(imageUrl);
      } catch (error) {
        console.error('Error generating image:', error);
      }
    };

    // Generate image when bet data changes
    useEffect(() => {
      generateImage();
    }, [bet.question, bet.options]);

    // Get card background color based on bet type
    const getCardBackgroundColor = () => {
      switch (bet.betType) {
        case 'bonk':
          return 'rgba(249, 115, 22, 0.15)'; // Orange background for bonk bets
        case 'timeless':
          return 'rgba(139, 92, 246, 0.15)'; // Purple background for timeless bets
        default:
          return theme.card; // Default background
      }
    };

    // Get border color based on bet type
    const getBorderColor = () => {
      switch (bet.betType) {
        case 'bonk':
          return 'rgba(249, 115, 22, 0.3)'; // Orange border for bonk bets
        case 'timeless':
          return 'rgba(139, 92, 246, 0.3)'; // Purple border for timeless bets
        default:
          return theme.border; // Default border
      }
    };

    // Function to place a bet
  // Fixed placeBet function with proper error handling and amount calculations
const placeBet = async () => {
  if (selectedOption === null || !wallets || wallets.length === 0) {
    Alert.alert('Error', 'Please select an option and ensure your wallet is connected');
    return;
  }

  const wallet = wallets[0];
  const userWallet = wallet.address;

  if (!userWallet) {
    Alert.alert('Error', 'Unable to get wallet address.');
    return;
  }

  setIsPlacingBet(true);

  try {
    const amount = parseFloat(betAmount);
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Handle different bet types
    if (bet.betType === 'bonk') {
      // For BONK bets, we need to handle BONK token swaps
      const BONK_MINT = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'; // BONK token mint
      const targetTokenMint = bet.tokenAddresses[selectedOption];
      
      // BONK has 5 decimals, so multiply by 10^5
      const bonkAmountInSmallestUnit = Math.floor(amount * 100000);

      console.log('Getting Jupiter quote for BONK to token...');
      console.log('BONK amount in smallest unit:', bonkAmountInSmallestUnit);
      
      // Get quote from Jupiter (BONK → Token) with higher slippage tolerance
      const quote = await getJupiterQuote(BONK_MINT, targetTokenMint, bonkAmountInSmallestUnit);
      
      console.log('Jupiter quote for BONK:', quote);

      // Check if the quote is reasonable
      if (!quote.outAmount || quote.outAmount === '0') {
        throw new Error('No liquidity available for this swap amount');
      }

      // Get swap transaction with user's public key
      const swapTransaction = await getJupiterSwapTransaction(quote, userWallet);
      
      console.log('Got BONK swap transaction');

      // Deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapTransaction.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(new Uint8Array(swapTransactionBuf));

      console.log('Signing and sending BONK transaction...');

      // Sign and send transaction using Privy
      const provider = await wallet.getProvider();
      const { signature } = await provider.request({
        method: 'signAndSendTransaction',
        params: {
          transaction: transaction,
          connection: new Connection('https://mainnet.helius-rpc.com/?api-key=397b5828-cbba-479e-992e-7000c78d482b'),
        },
      });

      console.log('BONK transaction successful:', signature);

      // Update bet in database
      const updateResponse = await fetch('https://apipoolc.vercel.app/api/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          betId: bet.id,
          action: 'add_participant',
          data: {
            participantWallet: userWallet,
            optionIndex: selectedOption,
            amount: amount,
            transactionSignature: signature,
          },
        }),
      });

      if (!updateResponse.ok) {
        console.warn('Failed to update bet in database, but transaction was successful');
      } else {
        const updateData = await updateResponse.json();
        console.log('Bet updated in database:', updateData);
        
        // Update local bet data and refresh
        if (updateData.success) {
          fetchBets(); // Refresh all bets
        }
      }

      Alert.alert(
        'Success! 🎉',
        `Your BONK bet has been placed successfully!\n\nAmount: ${amount} BONK\nOption: ${bet.options[selectedOption]}\nTransaction: ${signature.slice(0, 8)}...`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowBetModal(false);
              setSelectedOption(null);
            }
          }
        ]
      );
      return;
    }

    // For SOL bets (existing logic with improvements)
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    const targetTokenMint = bet.tokenAddresses[selectedOption];
    
    // SOL has 9 decimals, so multiply by 10^9
    const solAmountInLamports = Math.floor(amount * 1000000000);

    console.log('Getting Jupiter quote...');
    console.log('SOL amount in lamports:', solAmountInLamports);
    
    // Get quote from Jupiter with higher slippage tolerance
    const quote = await getJupiterQuote(SOL_MINT, targetTokenMint, solAmountInLamports);
    
    console.log('Jupiter quote:', quote);

    // Check if the quote is reasonable
    if (!quote.outAmount || quote.outAmount === '0') {
      throw new Error('No liquidity available for this swap amount');
    }

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

    // Update bet in database
    const updateResponse = await fetch('https://apipoolc.vercel.app/api/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        betId: bet.id,
        action: 'add_participant',
        data: {
          participantWallet: userWallet,
          optionIndex: selectedOption,
          amount: amount,
          transactionSignature: signature,
        },
      }),
    });

    if (!updateResponse.ok) {
      console.warn('Failed to update bet in database, but transaction was successful');
    } else {
      const updateData = await updateResponse.json();
      console.log('Bet updated in database:', updateData);
      
      // Update local bet data and refresh
      if (updateData.success) {
        fetchBets(); // Refresh all bets
      }
    }

    Alert.alert(
      'Success! 🎉',
      `Your bet has been placed successfully!\n\nAmount: ${amount} SOL\nOption: ${bet.options[selectedOption]}\nTransaction: ${signature.slice(0, 8)}...`,
      [
        {
          text: 'OK',
          onPress: () => {
            setShowBetModal(false);
            setSelectedOption(null);
          }
        }
      ]
    );

  } catch (error) {
    console.error('Bet placement error:', error);
    
    // More specific error handling
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      if (error.message.includes('Simulation failed')) {
        errorMessage = 'Transaction simulation failed. This might be due to insufficient funds, high slippage, or low liquidity.';
      } else if (error.message.includes('No liquidity')) {
        errorMessage = 'Insufficient liquidity for this swap amount. Try a smaller amount.';
      } else if (error.message.includes('Slippage')) {
        errorMessage = 'Slippage tolerance exceeded. Market conditions may have changed.';
      } else {
        errorMessage = error.message;
      }
    }
    
    Alert.alert(
      'Transaction Failed',
      `Failed to place bet: ${errorMessage}\n\nPlease try again with a smaller amount or check your wallet balance.`
    );
  } finally {
    setIsPlacingBet(false);
  }
};

// Updated Jupiter quote function with better error handling and higher slippage
const getJupiterQuote = async (inputMint: string, outputMint: string, amount: number) => {
  try {
    // Use higher slippage tolerance (300 bps = 3%) for better success rate
    const response = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=300`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Jupiter quote: ${response.status} - ${errorText}`);
    }
    
    const quote = await response.json();
    
    // Validate the quote
    if (!quote.outAmount || quote.outAmount === '0') {
      throw new Error('No liquidity available for this token pair');
    }
    
    return quote;
  } catch (error) {
    console.error('Jupiter quote error:', error);
    throw error;
  }
};

// Updated swap transaction function with better error handling
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
        // Add these parameters for better transaction handling
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 1000, // Small priority fee
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Jupiter swap transaction: ${response.status} - ${errorText}`);
    }

    const swapData = await response.json();
    
    // Validate the swap transaction data
    if (!swapData.swapTransaction) {
      throw new Error('Invalid swap transaction data received');
    }
    
    return swapData;
  } catch (error) {
    console.error('Jupiter swap transaction error:', error);
    throw error;
  }
};
    return (
      <View style={{
        height: screenHeight,
        width: screenWidth
      }}>
        {/* Background */}
        <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.background
          }}
        />
        
        {/* Card Content */}
        <View style={{
          flex: 1,
          justifyContent: 'flex-start',
          padding: 20,
          backgroundColor: getCardBackgroundColor(),
          borderRadius: 16,
          margin: 10,
          marginTop: 40,
          marginBottom: 40,
          shadowColor: theme.cardShadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: themeName === 'light' ? 0.1 : 0.3,
          shadowRadius: 8,
          elevation: 10,
          borderWidth: themeName === 'light' ? 1 : 2,
          borderColor: getBorderColor(),
        }}>
          {/* Bet Type Badge */}
          <View style={{ 
            position: 'absolute', 
            top: 16, 
            right: 16, 
            zIndex: 10,
            backgroundColor: bet.betType === 'bonk' ? theme.orange : 
                           bet.betType === 'timeless' ? theme.primary : theme.success,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#fff',
          }}>
            <Text style={{ 
              fontSize: 10, 
              fontFamily: 'PressStart2P-Regular',
              color: '#fff',
              textTransform: 'uppercase',
            }}>
              {bet.betType === 'bonk' ? '🪙 BONK' : 
               bet.betType === 'timeless' ? '♾️ TIMELESS' : '🎯 STANDARD'}
            </Text>
          </View>

          {/* Generated Image Display */}
          {generatedImage && (
            <View style={{ marginBottom: 20 }}>
              <Image 
                source={{ uri: generatedImage }} 
                style={{ 
                  width: '100%', 
                  height: 200, 
                  borderRadius: 12,
                }} 
                resizeMode="cover"
              />
            </View>
          )}

          {/* Question Display - Normal text without typewriter effect */}
          <View style={{ 
            paddingTop: 35,
            paddingBottom: 15, 
            borderBottomWidth: 1, 
            borderBottomColor: themeName === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', 
            marginBottom: 20 
          }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: "#1ba614",
              lineHeight: 32,
              fontFamily: 'PressStart2P-Regular'
            }}>
              {bet.question}
            </Text>
          </View>

          {/* Answer Options - VS layout vertical */}
          <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginVertical: 30 }}>
            <TouchableOpacity 
              onPress={() => {
                if (!isExpired && bet.isActive) {
                  setSelectedOption(0);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowBetModal(true);
                } else if (isExpired || !bet.isActive) {
                  Alert.alert('Bet Unavailable', 'This bet has ended or is no longer active.');
                }
              }}
              style={{
                width: '80%',
                padding: 16,
                marginBottom: 10,
                alignItems: 'center',
                opacity: isExpired || !bet.isActive ? 0.6 : 1,
              }}
            >
              <Text style={{
                fontSize: 24,
                color: themeName === 'light' ? '#000000' : '#FFFFFF',
                fontWeight: 'bold',
                textAlign: 'center',
                fontFamily: 'PressStart2P-Regular',
                textDecorationLine: 'underline',
                textShadowColor: themeName === 'light' ? 'rgba(0,0,0)' : 'rgba(255,255,255)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
              }}>
                {bet.options[0] || 'Option 1'}
              </Text>
            </TouchableOpacity>
            
            <Image source={require('../assets/images/vs.png')} style={{ width: 40, height: 40, marginHorizontal: 10 }} />
        
            <TouchableOpacity 
              onPress={() => {
                if (!isExpired && bet.isActive) {
                  setSelectedOption(1);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowBetModal(true);
                } else if (isExpired || !bet.isActive) {
                  Alert.alert('Bet Unavailable', 'This bet has ended or is no longer active.');
                }
              }}
              style={{
                width: '40%',
                padding: 12,
                marginLeft: 5,
                alignItems: 'center',
                opacity: isExpired || !bet.isActive ? 0.6 : 1,
              }}
            >
              <Text style={{
                fontSize: 20,
                color: themeName === 'light' ? '#000000' : '#FFFFFF',
                fontWeight: 'bold',
                textAlign: 'center',
                fontFamily: 'PressStart2P-Regular',
                textDecorationLine: 'underline',
                textShadowColor: themeName === 'light' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
              }}>
                {bet.options[1] || 'Option 2'}
              </Text>
            </TouchableOpacity>
          </View>

          
          
          {/* Bet Amount Modal */}
          <Modal
            visible={showBetModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowBetModal(false)}
          >
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            }}>
              <View style={{
                width: '85%',
                backgroundColor: theme.card,
                borderRadius: 20,
                padding: 20,
                alignItems: 'center',
                shadowColor: theme.cardShadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: themeName === 'light' ? 0.15 : 0.25,
                shadowRadius: 4,
                elevation: 5,
                borderWidth: 1,
                borderColor: theme.primary,
              }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: theme.text,
                  marginBottom: 16,
                  textAlign: 'center',
                  fontFamily: 'PressStart2P-Regular'
                }}>
                  Place Bet on "{selectedOption !== null && bet.options[selectedOption]}"
                </Text>
                
                <Text style={{
                  fontSize: 16,
                  color: theme.subtext,
                  marginBottom: 24,
                  textAlign: 'center',
                  fontFamily: 'PressStart2P-Regular'
                }}>
                  {bet.betType === 'bonk' ? 'Enter amount of BONK to bet' : 'Enter amount of SOL to bet'}
                </Text>
                
                <TextInput
                  style={{
                    backgroundColor: themeName === 'light' ? '#f3f4f6' : '#1a1625',
                    width: '100%',
                    padding: 16,
                    borderRadius: 12,
                    fontSize: 24,
                    color: theme.text,
                    textAlign: 'center',
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: theme.primary,
                  }}
                  value={betAmount}
                  onChangeText={setBetAmount}
                  keyboardType="decimal-pad"
                  placeholder={bet.betType === 'bonk' ? "100" : "0.1"}
                  placeholderTextColor={themeName === 'light' ? '#9ca3af' : '#666'}
                />
                
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginBottom: 24,
                }}>
                  {bet.betType === 'bonk' ? 
                    [100, 500].map((amount) => (
                      <TouchableOpacity
                        key={amount}
                        style={{
                          backgroundColor: betAmount === amount.toString() ? theme.orange : (themeName === 'light' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.2)'),
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.orange,
                        }}
                        onPress={() => setBetAmount(amount.toString())}
                      >
                        <Text style={{
                          color: theme.text,
                          fontWeight: betAmount === amount.toString() ? 'bold' : 'normal',
                          fontFamily: 'PressStart2P-Regular'
                        }}>
                          {amount} BONK
                        </Text>
                      </TouchableOpacity>
                    )) :
                    [0.1, 0.5].map((amount) => (
                      <TouchableOpacity
                        key={amount}
                        style={{
                          backgroundColor: betAmount === amount.toString() ? theme.primary : (themeName === 'light' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.2)'),
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.primary,
                        }}
                        onPress={() => setBetAmount(amount.toString())}
                      >
                        <Text style={{
                          color: theme.text,
                          fontWeight: betAmount === amount.toString() ? 'bold' : 'normal',
                          fontFamily: 'PressStart2P-Regular'
                        }}>
                          {amount} SOL
                        </Text>
                      </TouchableOpacity>
                    ))
                  }
                </View>
                
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: '100%',
                }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: themeName === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.3)',
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 12,
                      width: '48%',
                      alignItems: 'center',
                    }}
                    onPress={() => setShowBetModal(false)}
                  >
                    <Text style={{
                      color: theme.text,
                      fontSize: 16,
                      fontWeight: 'bold',
                      fontFamily: 'PressStart2P-Regular'
                    }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={{
                      backgroundColor: bet.betType === 'bonk' ? theme.orange : theme.primary,
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 12,
                      width: '48%',
                      alignItems: 'center',
                      opacity: isPlacingBet ? 0.7 : 1,
                    }}
                    onPress={placeBet}
                    disabled={isPlacingBet}
                  >
                    {isPlacingBet ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: 'bold',
                        fontFamily: 'PressStart2P-Regular'
                      }}>
                        Confirm Bet
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* --- Instagram Reels-style right vertical stats bar (player count, pool size) --- */}
          <View
            style={{
              position: 'absolute',
              right: 18,
              bottom: 80,
              alignItems: 'center',
              zIndex: 20,
            }}
          >
            {/* Player Count */}
            <View style={{ alignItems: 'center', marginBottom: 28 }}>
              <View style={{
                backgroundColor: themeName === 'light' ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.15)',
                borderRadius: 32,
                padding: 10,
                borderWidth: 1,
                borderColor: themeName === 'light' ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.3)',
                marginBottom: 4,
              
              }}>
                <Ionicons name="person-outline" size={22} color={theme.primary} />
              </View>
                             <Text style={{ fontSize: 13, color: theme.primary, fontWeight: 'bold', marginTop: 2, fontFamily: 'PressStart2P-Regular' }}>
                {bet.totalParticipants}
              </Text>
                             <Text style={{ fontSize: 11, color: theme.subtext, marginTop: -2, fontFamily: 'PressStart2P-Regular' }}>players</Text>
            </View>
            {/* Pool Size */}
            <View style={{ alignItems: 'center', marginBottom: 28 }}>
              <View style={{
                backgroundColor: themeName === 'light' ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.15)',
                borderRadius: 32,
                padding: 10,
                borderWidth: 1,
                borderColor: themeName === 'light' ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.3)',
                
              }}>
                <Ionicons name="wallet-outline" size={22} color={theme.success} />
              </View>
                             <Text style={{ marginBottom: 80,fontSize: 13, color: theme.success, fontWeight: 'bold', marginTop: 2, fontFamily: 'PressStart2P-Regular' }}>
                {bet.betType === 'bonk' ? 
                  `${(bet.solAmount * 1000).toFixed(0)} BONK` : 
                  `${bet.solAmount} SOL`
                }
              </Text>
            </View>
          </View>
                     {/* Time tag positioned bottom left aligned with pool size */}
           {bet.betType !== 'timeless' ? (
             <View style={{
               position: 'absolute',
               bottom: 200,
               left: 18,
              flexDirection: 'row',
              alignItems: 'center',
              zIndex: 10
            }}>
              <Ionicons name="hourglass-outline" size={24} color={theme.warning} />
                           <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.warning, marginLeft: 4, fontFamily: 'PressStart2P-Regular' }}>
                {formatTimeLeft(bet.endTime || '')}
              </Text>
            </View>
           ) : (
             <View style={{
               position: 'absolute',
               bottom: 200,
               left: 18,
              flexDirection: 'row',
              alignItems: 'center',
              zIndex: 10
            }}>
              <Ionicons name="infinite-outline" size={24} color={theme.primary} />
                           <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.primary, marginLeft: 4, fontFamily: 'PressStart2P-Regular' }}>
                TIMELESS
              </Text>
            </View>
           )}
        </View>
      </View>
    );
  };

  // Loading state from useBets hook
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: theme.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator color={theme.primary} size="large" />
        <Text style={{ fontSize: 18, color: theme.text, marginTop: 16, fontFamily: 'PressStart2P-Regular' }}>Loading bets...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: 50 }}>
      <StatusBar backgroundColor="transparent" translucent barStyle={themeName === 'light' ? 'dark-content' : 'light-content'} />
      
      {/* Fixed Header */}

      {/* Instagram-style Vertical Reel */}
      {bets.length === 0 ? (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: 18,
            color: theme.subtext,
            textAlign: 'center',
            marginBottom: 16,
            fontFamily: 'PressStart2P-Regular',
          }}>
            No bets available yet
          </Text>
          <Text style={{
            fontSize: 14,
            color: theme.subtext,
            textAlign: 'center',
            fontFamily: 'PressStart2P-Regular',
          }}>
            Be the first to create a bet!
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={bets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ flexGrow: 1 }}
          renderItem={({ item, index }) => (
            <FullScreenBetCard bet={item} theme={theme} router={router} index={index} />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={screenHeight}
          onViewableItemsChanged={useCallback(({ viewableItems }: { viewableItems: Array<{ index: number | null, item: any }> }) => {
            const indices = viewableItems.map((item: { index: number | null }) => item.index).filter((index): index is number => index !== null);
            setVisibleItemIndices(indices);
          }, [])}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 50
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.text}
            />
          }
          ListFooterComponent={
            <View style={{ height: 80, justifyContent: 'center', alignItems: 'center' }}>
              {refreshing && <ActivityIndicator color={theme.primary} size="large" />}
            </View>
          }
        />
      )}
    </View>
  );
}