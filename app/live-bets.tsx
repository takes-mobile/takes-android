import { View, Text as RNText, TouchableOpacity, Dimensions, RefreshControl, FlatList, Animated, StatusBar, Platform, ActivityIndicator, Modal, TextInput, Alert, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { ThemeContext } from './_layout';
import { useBets, Bet } from '../context/BetsContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DonutChart from '../components/DonutChart';
import { RetroPopup } from '../components/RetroPopup';

import { Connection, VersionedTransaction } from '@solana/web3.js';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Local Text wrapper to enforce app font on this screen
const Text = (props: React.ComponentProps<typeof RNText>) => (
  <RNText {...props} style={[{ fontFamily: 'PressStart2P-Regular' }, props.style]} />
);

// Using Bet interface from BetsContext

export default function LiveBetsScreen() {
  const scrollViewRef = useRef<FlatList>(null);
  const [visibleItemIndices, setVisibleItemIndices] = useState<number[]>([]);
  const { theme: themeName } = useContext(ThemeContext);
  const router = useRouter();
  const { bets, loading, refreshing, fetchBets, setRefreshing } = useBets();
  const flatListRef = useRef<FlatList>(null);
  
  // RetroPopup state
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupConfig, setPopupConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    data: null as any,
    onConfirm: null as (() => void) | null
  });

  // Helper function to show popups
  const showPopup = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', data?: any, onConfirm?: (() => void) | null) => {
    setPopupConfig({ title, message, type, data, onConfirm: onConfirm || null });
    setPopupVisible(true);
  };

  // Theme configuration based on current theme
  const getTheme = () => {
    if (themeName === 'light') {
      return {
        background: '#ffffff', // White background
        card: 'rgb(138, 92, 246, 0.2)', // Very light purple card background
        text: '#1a1a1a', // Dark text
        subtext: '#6b7280', // Gray subtext
        primary: '#8b5cf6', // Purple primary
        secondary: '#a78bfa', // Lighter purple as secondary
        success: '#10B981', // Green success
        warning: '#EF4444', // Red warning
        orange: '#F97316', // Orange
        pink: '#EC4899', // Pink
        border: 'rgb(181, 149, 255)', // Light purple border
        cardShadow: 'rgb(201, 178, 255)', // Light purple shadow
      };
    } else {
      return {
        background: 'rgba(35, 0, 100, 0.71)', // White background for dark mode too
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
        cardShadow: 'rgb(255, 255, 255)', // Dark shadow
      };
    }
  };

  const theme = getTheme();

  // Separate active and ended bets
  const activeBets = bets.filter(bet => {
    // Keep timeless bets (they don't expire)
    if (bet.betType === 'timeless') return true;
    
    // For other bet types, check if they're expired
    if (!bet.endTime) return true; // Keep bets without end time
    
    const now = new Date();
    const endTime = new Date(bet.endTime);
    return now < endTime; // Only keep bets that haven't ended yet
  });

  const endedBets = bets.filter(bet => {
    // Skip timeless bets (they don't end)
    if (bet.betType === 'timeless') return false;
    
    // For other bet types, check if they're expired
    if (!bet.endTime) return false; // Skip bets without end time
    
    const now = new Date();
    const endTime = new Date(bet.endTime);
    return now >= endTime; // Only keep bets that have ended
  });

  // Combine active bets first, then ended bets, and sort by creation date (recent first)
  const allBets = [...activeBets, ...endedBets].sort((a, b) => {
    // Sort by creation date (recently published first)
    const aDate = new Date(a.createdAt || 0);
    const bDate = new Date(b.createdAt || 0);
    return bDate.getTime() - aDate.getTime(); // Most recent first
  });

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

  const getTimeProgress = (bet: Bet) => {
    if (!bet.endTime || !bet.createdAt) return 0;
    
    const end = new Date(bet.endTime);
    const start = new Date(bet.createdAt);
    const now = new Date();
    
    // Calculate total duration of the bet
    const totalDuration = end.getTime() - start.getTime();
    
    // Calculate elapsed time
    const elapsedTime = now.getTime() - start.getTime();
    
    // Calculate progress as percentage of time elapsed (red section)
    const elapsedProgress = Math.max(0, Math.min(1, elapsedTime / totalDuration));
    
    // If bet has expired, return 1 (fully red)
    if (now.getTime() >= end.getTime()) {
      return 1;
    }
    
    return elapsedProgress;
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
        // Optimize image URL with smaller dimensions and faster loading
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=400&height=300&quality=80&fast=true`;
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
    showPopup('Error', 'Please select an option and ensure your wallet is connected', 'error');
    return;
  }

  const wallet = wallets[0];
  const userWallet = wallet.address;

  if (!userWallet) {
    showPopup('Error', 'Unable to get wallet address.', 'error');
    return;
  }

  setIsPlacingBet(true);

  try {
    const amount = parseFloat(betAmount);
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      showPopup('Error', 'Please enter a valid amount', 'error');
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

      showPopup(
        'Success! 🎉',
        `Your BONK bet has been placed successfully!`,
        'success',
        { signature, amount: `${amount} BONK`, option: bet.options[selectedOption] },
        () => {
          setShowBetModal(false);
          setSelectedOption(null);
        }
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

    showPopup(
      'Success! 🎉',
      `Your bet has been placed successfully!`,
      'success',
      { signature, amount: `${amount} SOL`, option: bet.options[selectedOption] },
      () => {
        setShowBetModal(false);
        setSelectedOption(null);
      }
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
    
    showPopup(
      'Transaction Failed',
      `Failed to place bet: ${errorMessage}\n\nPlease try again with a smaller amount or check your wallet balance.`,
      'error'
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
        width: screenWidth,
        backgroundColor: theme.background
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
              {bet.betType === 'bonk' ? (
                <Image
                  source={require('../assets/images/bonk.png')}
                  style={{ width: 18, height: 18, marginRight: 4, marginBottom: -2 }}
                  resizeMode="contain"
                />
              ) : 
               bet.betType === 'timeless' ? '♾️ TIMELESS' : ' STANDARD'}
            </Text>
          </View>

          {/* Generated Image Display */}
          {generatedImage && (
            <View style={{ 
              marginBottom: 20,
              borderWidth: 2,
              borderColor: theme.primary,
              borderRadius: 12,
              overflow: 'hidden',
              backgroundColor: theme.card,
            }}>
              <Image 
                source={{ uri: generatedImage }} 
                style={{ 
                  width: '100%', 
                  height: 200, 
                  borderRadius: 10,
                }} 
                resizeMode="cover"
                fadeDuration={0}
              />
            </View>
          )}

          {/* Question Display - Retro gaming style */}
          <View style={{ 
            paddingTop: 35,
            paddingBottom: 15, 
            borderBottomWidth: 1, 
            borderBottomColor: themeName === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', 
            marginBottom: 20 
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: theme.text,
              lineHeight: 22,
              fontFamily: 'PressStart2P-Regular',
              textAlign: 'center',
              textTransform: 'uppercase'
            }}>
              {bet.question}
            </Text>
          </View>

          {/* Answer Options - VS layout vertical like in the image */}
          <View style={{ 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginVertical: 30,
            paddingHorizontal: 20
          }}>
            {/* First Option */}
            <TouchableOpacity 
              onPress={() => {
                if (!isExpired && bet.isActive) {
                  setSelectedOption(0);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowBetModal(true);
                } else if (isExpired || !bet.isActive) {
                  showPopup('Bet Unavailable', 'This bet has ended or is no longer active.', 'warning');
                }
              }}
              style={{
                width: '100%',
                padding: 16,
                marginBottom: 10,
                alignItems: 'center',
                opacity: isExpired || !bet.isActive ? 0.6 : 1,
              }}
            >
              <Text style={{
                fontSize: 22,
                color: theme.text,
                fontWeight: 'bold',
                textAlign: 'center',
                fontFamily: 'PressStart2P-Regular',
                textDecorationLine: 'underline',
                textShadowColor: 'rgba(255, 255, 255, 0.3)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
                textTransform: 'uppercase'
              }}>
                {bet.options[0] || 'Option 1'}
              </Text>
            </TouchableOpacity>
            
            {/* VS Text */}
            <Text style={{
              fontSize: 18,
              color: "#EF4444",
              fontWeight: 'bold',
              textAlign: 'center',
              fontFamily: 'PressStart2P-Regular',
              marginVertical: 8,
              textTransform: 'uppercase'
            }}>
              VS
            </Text>
        
            {/* Second Option */}
            <TouchableOpacity 
              onPress={() => {
                if (!isExpired && bet.isActive) {
                  setSelectedOption(1);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowBetModal(true);
                } else if (isExpired || !bet.isActive) {
                  showPopup('Bet Unavailable', 'This bet has ended or is no longer active.', 'warning');
                }
              }}
              style={{
                width: '100%',
                padding: 16,
                alignItems: 'center',
                opacity: isExpired || !bet.isActive ? 0.6 : 1,
              }}
            >
              <Text style={{
                fontSize: 22,
                color: theme.text,
                fontWeight: 'bold',
                textAlign: 'center',
                fontFamily: 'PressStart2P-Regular',
                textDecorationLine: 'underline',
                textShadowColor: 'rgba(0,0,0,0.3)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
                textTransform: 'uppercase'
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
              backgroundColor: themeName === 'light' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.92)',
            }}>
              <View style={{
                width: '85%',
                backgroundColor: themeName === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(30, 26, 44, 0.95)',
                borderRadius: 20,
                padding: 20,
                alignItems: 'center',
                shadowColor: themeName === 'light' ? '#000000' : theme.cardShadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: themeName === 'light' ? 0.3 : 0.25,
                shadowRadius: 8,
                elevation: 10,
                borderWidth: 2,
                borderColor: themeName === 'light' ? '#8b5cf6' : theme.primary,
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
                  {bet.betType === 'bonk' ? 'Enter amount of BONK to bet' : ''}
                </Text>
                
                <TextInput
                  style={{
                    backgroundColor: themeName === 'light' ? '#f8f9fa' : '#1a1625',
                    width: '100%',
                    padding: 16,
                    borderRadius: 12,
                    fontSize: 24,
                    color: theme.text,
                    textAlign: 'center',
                    marginBottom: 16,
                    borderWidth: 2,
                    borderColor: themeName === 'light' ? '#8b5cf6' : theme.primary,
                  }}
                  value={betAmount}
                  onChangeText={setBetAmount}
                  keyboardType="decimal-pad"
                  placeholder={bet.betType === 'bonk' ? "100" : "0.1"}
                  placeholderTextColor={themeName === 'light' ? '#6b7280' : '#666'}
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
                      backgroundColor: themeName === 'light' ? '#f3f4f6' : 'rgba(0,0,0,0.3)',
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 12,
                      width: '48%',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: themeName === 'light' ? '#d1d5db' : 'transparent',
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
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <View style={{
               padding: 10,
               marginBottom: 8,
              
              }}>
                <Text style={{
                  fontSize: 50,
                  color: theme.primary,
                }}>
                  🔥
                </Text>
              </View>
                             <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 2, marginBottom: 2, fontFamily: 'PressStart2P-Regular', color: theme.text }}>
                {bet.totalParticipants}
              </Text>
                             <Text style={{ fontSize: 16, marginTop: -2, fontFamily: 'PressStart2P-Regular', color: theme.text }}>takes</Text>
            </View>
          </View>
                     {/* Time tag positioned bottom left aligned with pool size */}
           {bet.betType !== 'timeless' ? (
             <View style={{
               position: 'absolute',
               bottom: 120,
               left: 18,
              flexDirection: 'row',
              alignItems: 'center',
              zIndex: 10 
            }}>
              <DonutChart
                progress={getTimeProgress(bet)}
                size={80}
                strokeWidth={10}
                color="#ff0000"
                backgroundColor="#00ff00"
              />
            </View>
           ) : null}
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
      {allBets.length === 0 ? (
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
            textTransform: 'uppercase'
          }}>
            No bets available yet
          </Text>
          <Text style={{
            fontSize: 14,
            color: theme.subtext,
            textAlign: 'center',
            fontFamily: 'PressStart2P-Regular',
            textTransform: 'uppercase'
          }}>
            Be the first to create a bet!
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={allBets}
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
      
      {/* RetroPopup Component */}
      <RetroPopup
        visible={popupVisible}
        title={popupConfig.title}
        message={popupConfig.message}
        type={popupConfig.type}
        data={popupConfig.data}
        onConfirm={popupConfig.onConfirm}
        onClose={() => setPopupVisible(false)}
      />
    </View>
  );
}