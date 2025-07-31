import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { useContext, useEffect, useState } from 'react';
import { ThemeContext } from './_layout';
import { LinearGradient } from 'expo-linear-gradient';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';

interface BetDetails {
  id: string;
  question: string;
  options: string[];
  tokenAddresses: string[];
  solAmount: number;
  duration: number;
  userWallet: string;
  creatorName: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalParticipants: number;
  totalPool: number;
  participants: any[];
  transactions: any[];
  status: string;
  winner: string | null;
  endTime: string;
}

export default function BetDetailsScreen() {
  const { betData } = useLocalSearchParams();
  const router = useRouter();
  const { theme: themeName } = useContext(ThemeContext);
  const { wallets } = useEmbeddedSolanaWallet();
  
  const [bet, setBet] = useState<BetDetails | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState('0.1');
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [showBetModal, setShowBetModal] = useState(false);
  const [isDrawingWinner, setIsDrawingWinner] = useState(false);

  const theme = {
    background: '#0F172A',
    card: 'rgba(255,255,255,0.1)',
    text: '#FFFFFF',
    subtext: '#94A3B8',
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#EF4444',
    orange: '#F97316',
    pink: '#EC4899',
  };

  useEffect(() => {
    if (betData) {
      try {
        const parsedBet = JSON.parse(betData as string);
        setBet(parsedBet);
      } catch (error) {
        console.error('Error parsing bet data:', error);
        router.back();
      }
    }
  }, [betData]);

  const formatTimeLeft = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getJupiterQuote = async (inputMint: string, outputMint: string, amount: number) => {
    try {
      const amountInLamports = Math.floor(amount * 1000000000); // Convert SOL to lamports
      const response = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInLamports}&slippageBps=50`
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

  const placeBet = async () => {
    if (!bet || selectedOption === null || !wallets || wallets.length === 0) {
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
        
        // Update local bet data
        if (updateData.success && updateData.bet) {
          setBet(updateData.bet);
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
              setBetAmount('0.1');
            }
          }
        ]
      );

    } catch (error) {
      console.error('Place bet error:', error);
      Alert.alert(
        'Error',
        `Failed to place bet: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsPlacingBet(false);
    }
  };

  const handleDrawWinner = async () => {
    if (!bet) return;

    const isExpired = new Date(bet.endTime) <= new Date();
    
    if (!isExpired) {
      const timeLeft = formatTimeLeft(bet.endTime);
      Alert.alert(
        'Bet Still Active',
        `${timeLeft} left for deciding who won. Winner can only be drawn after the betting period ends.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if winner is already drawn
    if (bet.winner !== null) {
      Alert.alert(
        'Winner Already Drawn',
        `This bet has already been resolved. Winner: ${typeof bet.winner === 'number' && bet.options[bet.winner] ? bet.options[bet.winner] : 'Unknown'}`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsDrawingWinner(true);

    try {
      // Call the draw winner API with both token addresses
      const response = await fetch('https://apipoolc.vercel.app/api/drawwinner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          betId: bet.id,
          tokenAddresses: bet.tokenAddresses,
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update local bet data
        if (data.bet) {
          setBet(data.bet);
        }

        Alert.alert(
          'Winner Drawn! 🎉',
          `The winner has been determined!\n\nWinning Option: ${data.winningOption || 'Unknown'}\n\nWinners will receive their rewards automatically.`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(data.message || 'Failed to draw winner');
      }

    } catch (error) {
      console.error('Draw winner error:', error);
      Alert.alert(
        'Error',
        `Failed to draw winner: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsDrawingWinner(false);
    }
  };

  if (!bet) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: theme.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.text, marginTop: 16 }}>Loading bet details...</Text>
      </View>
    );
  }

  const isExpired = new Date(bet.endTime) <= new Date();

  return (
    <ScrollView 
      style={{ 
        flex: 1, 
        backgroundColor: theme.background,
      }} 
      contentContainerStyle={{ 
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          alignSelf: 'flex-start',
          marginBottom: 20,
          padding: 8,
        }}
      >
        <Text style={{ color: theme.primary, fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>

      {/* Bet Card */}
      <View style={{
        backgroundColor: theme.card,
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.4,
        shadowRadius: 50,
        elevation: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
      }}>
        {/* Question */}
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: theme.text,
          marginBottom: 20,
          lineHeight: 32,
        }}>
          {bet.question}
        </Text>

        {/* Status and Time */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: bet.isActive && !isExpired ? theme.success : theme.warning,
              marginRight: 8,
            }} />
            <Text style={{
              color: bet.isActive && !isExpired ? theme.success : theme.warning,
              fontWeight: '600',
            }}>
              {bet.isActive && !isExpired ? 'Active' : 'Ended'}
            </Text>
          </View>
          
          <Text style={{ color: theme.warning, fontWeight: '600' }}>
            {formatTimeLeft(bet.endTime)}
          </Text>
        </View>

        {/* Options */}
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: theme.text,
          marginBottom: 16,
        }}>
          Choose your option:
        </Text>

        {bet.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              if (!isExpired && bet.isActive) {
                setSelectedOption(index);
              }
            }}
            disabled={isExpired || !bet.isActive}
            style={{
              backgroundColor: selectedOption === index ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: selectedOption === index ? 2 : 1,
              borderColor: selectedOption === index ? theme.primary : 'rgba(255,255,255,0.1)',
              opacity: isExpired || !bet.isActive ? 0.6 : 1,
            }}
          >
            <Text style={{
              fontSize: 18,
              color: theme.text,
              fontWeight: selectedOption === index ? 'bold' : '500',
              textAlign: 'center',
            }}>
              {option}
            </Text>
            {/* {bet.participants.length > 0 && (
              <Text style={{
                fontSize: 14,
                color: theme.subtext,
                textAlign: 'center',
                marginTop: 4,
              }}>
                {bet.participants.filter(p => p.optionIndex === index).length} participants
              </Text>
            )} */}
          </TouchableOpacity>
        ))}

        {/* Stats */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 20,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.1)',
        }}>
          <View>
            <Text style={{ fontSize: 14, color: theme.subtext, marginBottom: 4 }}>
              Total Pool
            </Text>
            <Text style={{ fontSize: 18, color: theme.text, fontWeight: 'bold' }}>
              {bet.totalPool.toFixed(2)} SOL
            </Text>
          </View>
          
          <View>
            <Text style={{ fontSize: 14, color: theme.subtext, marginBottom: 4 }}>
              Participants
            </Text>
            <Text style={{ fontSize: 18, color: theme.text, fontWeight: 'bold' }}>
              {bet.totalParticipants}
            </Text>
          </View>
          
          <View>
            <Text style={{ fontSize: 14, color: theme.subtext, marginBottom: 4 }}>
              Category
            </Text>
            <Text style={{ fontSize: 16, color: theme.primary, fontWeight: '600' }}>
              {bet.category}
            </Text>
          </View>
        </View>
      </View>

      {/* Place Bet Button */}
      {selectedOption !== null && bet.isActive && !isExpired && (
        <TouchableOpacity
          style={{
            height: 56,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.4,
            shadowRadius: 25,
            elevation: 10,
          }}
          onPress={() => setShowBetModal(true)}
        >
          <LinearGradient
            colors={[theme.primary, theme.secondary]}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              borderRadius: 16,
            }}
          />
          <Text style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
            letterSpacing: 0.5,
          }}>
            Place Bet on "{bet.options[selectedOption]}"
          </Text>
        </TouchableOpacity>
      )}

      {/* Draw Winner Button */}
      <TouchableOpacity
        style={{
          height: 40,
          width: '40%',
          borderRadius: 16,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 26,
          shadowColor: theme.orange,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.4,
          shadowRadius: 25,
          elevation: 10,
        //   marginTop: 10,
          opacity: isDrawingWinner ? 0.7 : 1,
        }}
        onPress={handleDrawWinner}
        disabled={isDrawingWinner}
      >
        <LinearGradient
          colors={isDrawingWinner ? ['#6B7280', '#4B5563'] : [theme.orange, '#DC2626']}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            borderRadius: 16,
          }}
        />
        {isDrawingWinner ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            <Text style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 'bold',
              letterSpacing: 0.5,
            }}>
              Drawing Winner...
            </Text>
          </View>
        ) : (
          <Text style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
            letterSpacing: 0.5,
          }}>
            {isExpired && bet.winner === null ? 'Draw Winner 🎲' : 
             isExpired && bet.winner !== null ? 'Winner Already Drawn ✅' :
             `Draw Winner`}
             {/* (${formatTimeLeft(bet.endTime)} left) ⏰ */}
          </Text>
        )}
      </TouchableOpacity>

      {/* Bet Amount Modal */}
      <Modal
        visible={showBetModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBetModal(false)}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{ 
            backgroundColor: theme.card, 
            borderRadius: 24, 
            padding: 28, 
            width: '100%',
            maxWidth: 400,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}>
            <Text style={{ 
              fontSize: 22, 
              fontWeight: 'bold', 
              color: theme.text, 
              marginBottom: 8,
              textAlign: 'center',
            }}>
              Place Your Bet
            </Text>
            
            <Text style={{ 
              fontSize: 16, 
              color: theme.subtext, 
              marginBottom: 20,
              textAlign: 'center',
            }}>
              Option: {selectedOption !== null ? bet.options[selectedOption] : ''}
            </Text>

            <Text style={{ 
              fontSize: 16, 
              color: theme.text, 
              marginBottom: 8,
              fontWeight: '600',
            }}>
              Bet Amount (SOL):
            </Text>
            
            <TextInput
              style={{ 
                borderWidth: 2, 
                borderColor: theme.primary, 
                borderRadius: 12, 
                padding: 16, 
                fontSize: 18,
                color: theme.text,
                backgroundColor: 'rgba(255,255,255,0.05)',
                marginBottom: 20,
                textAlign: 'center',
                fontWeight: 'bold',
              }}
              placeholder="0.1"
              placeholderTextColor={theme.subtext}
              value={betAmount}
              onChangeText={setBetAmount}
              keyboardType="decimal-pad"
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: theme.primary,
                  backgroundColor: 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => setShowBetModal(false)}
                disabled={isPlacingBet}
              >
                <Text style={{
                  color: theme.primary,
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 2,
                  height: 48,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: isPlacingBet ? 0.7 : 1,
                }}
                onPress={placeBet}
                disabled={isPlacingBet}
              >
                <LinearGradient
                  colors={isPlacingBet ? ['#6B7280', '#4B5563'] : [theme.primary, theme.secondary]}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    borderRadius: 12,
                  }}
                />
                {isPlacingBet ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 'bold',
                  }}>
                    Confirm Bet
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
} 