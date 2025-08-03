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
  const getJupiterQuote = async (inputMint: string, outputMint: string, amount: number) => {
    try {
      const response = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount * 10**9}&slippageBps=50`);
      
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

  // Card with typewriter effect and betting functionality
  const FullScreenBetCard = ({ bet, theme, router, index }: { bet: Bet; theme: any; router: any; index?: number }) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showBetModal, setShowBetModal] = useState(false);
    const [betAmount, setBetAmount] = useState('0.1');
    const [isPlacingBet, setIsPlacingBet] = useState(false);
    const { wallets } = useEmbeddedSolanaWallet();
    const isExpired = new Date(bet.endTime) <= new Date();
    
    // For typewriter effect
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const fullText = bet.question;
    const typingIntervalRef = useRef<number | null>(null);
    const cursorAnim = useRef(new Animated.Value(0)).current;
    
    // Function to place a bet
    const placeBet = async () => {
      if (selectedOption === null || !wallets || wallets.length === 0) {
        Alert.alert('Error', 'Please select an option and ensure your wallet is connected');
        return;
      }

      const wallet = wallets[0];
      const userWallet = wallet.address;

      if (!userWallet) {
        Alert.alert('Error', 'Unable to get wallet address');
        return;
      }

      setIsPlacingBet(true);

      try {
        // SOL mint address (wrapped SOL)
        const SOL_MINT = 'So11111111111111111111111111111111111111112';
        const targetTokenMint = bet.tokenAddresses[selectedOption];
        const amount = parseFloat(betAmount);

        console.log('Getting Jupiter quote...');
        
        // Get quote from Jupiter
        const quote = await getJupiterQuote(SOL_MINT, targetTokenMint, amount);
        
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
        Alert.alert(
          'Error',
          `Failed to place bet: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      } finally {
        setIsPlacingBet(false);
      }
    };

    // Animate blinking cursor
    const animateCursor = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cursorAnim, {
        toValue: 1,
        duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Typewriter effect
    const startTypewriter = () => {
      // Reset state
      setDisplayedText('');
      setIsTyping(true);
      
      // Start cursor animation
      animateCursor();
      
      // Clear any existing interval
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      
      let i = 0;
      let speed = 50; // Initial typing speed
      
      // Start typing
      typingIntervalRef.current = window.setInterval(() => {
        if (i < fullText.length) {
          setDisplayedText((prev) => prev + fullText.charAt(i));
          i++;
          
          // Randomly vary typing speed for more natural effect
          if (Math.random() > 0.7) {
            speed = Math.floor(Math.random() * 80) + 20; // Between 20-100ms
            if (typingIntervalRef.current) {
              clearInterval(typingIntervalRef.current);
              typingIntervalRef.current = window.setInterval(() => {
                if (i < fullText.length) {
                  setDisplayedText((prev) => prev + fullText.charAt(i));
                  i++;
                  
                  // Trigger very light haptic feedback for typing effect on some characters
                  if (Platform.OS !== 'web' && Math.random() > 0.8) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                } else {
                  if (typingIntervalRef.current) {
                    clearInterval(typingIntervalRef.current);
                    typingIntervalRef.current = null;
                  }
                  
                  // Keep cursor blinking for a moment after typing completes
                  setTimeout(() => {
                    setIsTyping(false);
                  }, 1000);
                }
              }, speed);
            }
          }
          
          // Trigger very light haptic feedback for typing effect on some characters
          if (Platform.OS !== 'web' && Math.random() > 0.8) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } else {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
          
          // Keep cursor blinking for a moment after typing completes
          setTimeout(() => {
            setIsTyping(false);
          }, 1000);
        }
      }, speed); // Adjust typing speed here
    };

    useEffect(() => {
      // Start typewriter effect when the card becomes visible
      const timeout = setTimeout(() => {
        startTypewriter();
      }, 300);
      
      return () => {
        clearTimeout(timeout);
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
      };
    }, []);
    
    // Restart typewriter effect when this card becomes visible again
    useEffect(() => {
      if (visibleItemIndices.includes(index as number)) {
        const timeout = setTimeout(() => {
          startTypewriter();
        }, 300);
        return () => clearTimeout(timeout);
      } else {
        // Reset when not visible
        setDisplayedText('');
        setIsTyping(false);
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
      }
    }, [visibleItemIndices]);

    // --- Place player count and pool size in a vertical stack at the right, like Instagram Reels like/comment/share ---
    // --- Move time to left bottom, remove hot icon ---

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
          backgroundColor: theme.card,
          borderRadius: 16,
          margin: 10,
          marginTop: 40,
          marginBottom: 40,
          shadowColor: theme.cardShadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: themeName === 'light' ? 0.1 : 0.3,
          shadowRadius: 8,
          elevation: 10,
          borderWidth: themeName === 'light' ? 1 : 0,
          borderColor: theme.border,
        }}>
          {/* Question with Typewriter Effect */}
         
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
              flexDirection: 'row',
              flexWrap: 'wrap',
              fontFamily: 'PressStart2P-Regular'
            }}>
              {displayedText}
              {isTyping && (
                <Animated.Text 
                  style={{
                    opacity: cursorAnim,
                  }}
                >
                |
                </Animated.Text>
              )}
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
                  Enter amount of SOL to bet
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
                  placeholder="0.1"
                  placeholderTextColor={themeName === 'light' ? '#9ca3af' : '#666'}
                />
                
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginBottom: 24,
                }}>
                  {[0.1, 0.5, 1, 2].map((amount) => (
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
                  ))}
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
                      backgroundColor: theme.primary,
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
                {formatSolAmount(bet.solAmount)}
              </Text>
            </View>
          </View>
                     {/* Time tag positioned bottom left aligned with pool size */}
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
              {formatTimeLeft(bet.endTime)}
            </Text>
          </View>
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