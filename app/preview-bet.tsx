import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, Animated, Alert } from 'react-native';
import RetroButton from '../components/RetroButton';
import { useContext, useEffect, useRef, useState } from 'react';
import { ThemeContext } from './_layout';
import { LinearGradient } from 'expo-linear-gradient';
import { Connection, Transaction , Keypair} from '@solana/web3.js';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Animated VS Component
const AnimatedVS = ({ theme }: { theme: any }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        transform: [
          { scale: scaleAnim },
          { rotate },
        ],
      }}
    >
      <Text style={{
        fontSize: 40,
        fontWeight: '800',
        color: theme.orange,
        textShadowColor: `rgba(249, 115, 22, 0.5)`,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
      }}>
        VS
      </Text>
    </Animated.View>
  );
};

// Mock Statistics Component
const MockStats = ({ theme }: { theme: any }) => {
  const [progressA, setProgressA] = useState(0);
  const [progressB, setProgressB] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressA(65);
      setProgressB(35);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 14, color: theme.subtext, fontWeight: '500' }}>Option A</Text>
        <Text style={{ fontSize: 14, color: theme.text, fontWeight: '600' }}>65%</Text>
      </View>
      <View style={{
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 16,
      }}>
        <Animated.View style={{
          height: '100%',
          width: `${progressA}%`,
          backgroundColor: theme.primary,
          borderRadius: 3,
        }} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 14, color: theme.subtext, fontWeight: '500' }}>Option B</Text>
        <Text style={{ fontSize: 14, color: theme.text, fontWeight: '600' }}>35%</Text>
      </View>
      <View style={{
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <Animated.View style={{
          height: '100%',
          width: `${progressB}%`,
          backgroundColor: theme.pink,
          borderRadius: 3,
        }} />
      </View>
    </View>
  );
};

// Social Proof Component REMOVED

export default function PreviewBetScreen() {
  const { description, answers, duration, amount, generatedImage, betType } = useLocalSearchParams();
  const { theme: themeName } = useContext(ThemeContext);
  const { wallets } = useEmbeddedSolanaWallet();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const theme = {
    background: '#1e1a2c', // Dark purple background
    card: 'rgba(200,182,232,0.1)', // Translucent light purple
    text: '#FFFFFF',
    subtext: '#c8b6e8', // Light purple subtext
    primary: '#8b5cf6', // Brighter purple as primary
    secondary: '#a78bfa', // Lighter purple as secondary
    success: '#10B981',
    warning: '#EF4444',
    orange: '#F97316',
    pink: '#EC4899',
    green: '#29d620',
  };

  let answersArr: Array<{type: string, content: string}> = [];
  
  try {
    answersArr = answers ? JSON.parse(answers as string) : [];
  } catch {
    answersArr = [];
  }

  // Get bet type from params
  const currentBetType = Array.isArray(betType) ? betType[0] : betType || 'standard';

  // Get card background color based on bet type
  const getCardBackgroundColor = () => {
    switch (currentBetType) {
      case 'bonk':
        return 'rgba(249, 115, 22, 0.15)'; // Orange background for bonk bets
      case 'timeless':
        return 'rgba(139, 92, 246, 0.15)'; // Purple background for timeless bets
      default:
        return '#242235'; // Default background
    }
  };

  // Get border color based on bet type
  const getBorderColor = () => {
    switch (currentBetType) {
      case 'bonk':
        return 'rgba(249, 115, 22, 0.3)'; // Orange border for bonk bets
      case 'timeless':
        return 'rgba(139, 92, 246, 0.3)'; // Purple border for timeless bets
      default:
        return 'rgba(255,255,255,0.1)'; // Default border
    }
  };

  const createTokenName = (optionIndex: number) => {
    if (answersArr.length >= 2) {
      const option = answersArr[optionIndex]?.content || `Option${optionIndex + 1}`;
      return `${option} `;
    }
    // Handle case where description might be an array
    const desc = Array.isArray(description) ? description[0] : description;
    return `${desc || 'Betting'} Token ${optionIndex + 1}`;
  };

  const createTokenSymbol = (optionIndex: number) => {
    const tokenName = createTokenName(optionIndex);
    // Take first 5 characters and convert to uppercase
    return tokenName.substring(0, 5).toUpperCase().replace(/\s/g, '');
  };

  const handlePublishBet = async () => {
    try {
      setIsPublishing(true);

      // Check if wallet is available
      if (!wallets || wallets.length === 0) {
        Alert.alert('Error', 'No wallet found. Please connect your wallet first.');
        return;
      }

      const wallet = wallets[0];
      const provider = await wallet.getProvider();

      // Get user wallet address
      const userWallet = wallet.address;

      if (!userWallet) {
        Alert.alert('Error', 'Unable to get wallet address.');
        return;
      }



      // Create tokens for both options
      const tokens = [];
      
      for (let i = 0; i < Math.min(answersArr.length, 2); i++) {
        // Generate keypair for each token
        console.log(`Generating keypair for option ${i + 1}...`);
      const keypairResponse = await fetch('https://apipoolc.vercel.app/api/keypair');
      
      if (!keypairResponse.ok) {
          throw new Error(`Keypair generation failed for option ${i + 1}: ${keypairResponse.status}`);
      }

      const keypairData = await keypairResponse.json();
      
      if (!keypairData.success || !keypairData.publicKey) {
          throw new Error(`Failed to generate keypair for option ${i + 1}`);
      }

        console.log(`Keypair generated for option ${i + 1}:`, keypairData.publicKey);

        // Prepare API parameters for this token
        const tokenName = createTokenName(i);
        const tokenSymbol = createTokenSymbol(i);
      const mint = keypairData.publicKey;

        console.log(`Creating token ${i + 1} with params:`, {
        tokenName,
        tokenSymbol,
        mint,
        userWallet
      });

        // Call the create API for this token
      const createResponse = await fetch(
        `https://apipoolc.vercel.app/api/create?tokenName=${encodeURIComponent(tokenName)}&tokenSymbol=${encodeURIComponent(tokenSymbol)}&mint=${mint}&userWallet=${userWallet}`
      );

      if (!createResponse.ok) {
          throw new Error(`API call failed for token ${i + 1}: ${createResponse.status}`);
      }

      const createData = await createResponse.json();
      
      if (!createData.success || !createData.poolTx) {
          throw new Error(`Failed to create token pool for option ${i + 1}`);
      }

        console.log(`Pool created successfully for option ${i + 1}:`, createData);

        // Store the token data
        tokens.push({
          tokenName,
          tokenSymbol,
          mint,
          poolTx: createData.poolTx,
          keypair: keypairData.keypair
        });
      }



      // Step 3: Process all transactions
      const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=397b5828-cbba-479e-992e-7000c78d482b');
      const signatures = [];

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        console.log(`Processing transaction for ${token.tokenName}...`);

        // Decode and prepare the transaction
        const transaction = Transaction.from(Buffer.from(token.poolTx, 'base64'));

        console.log(`Processing transaction for ${token.tokenName}...`);

        // Get a fresh blockhash and update the transaction
        console.log('Getting fresh blockhash...');
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;

      console.log('Signing transaction...');

        // First, sign with the keypair (mint authority)
        const keyPair = Keypair.fromSecretKey(new Uint8Array(token.keypair.secretKey));
      
      // Sign with keypair first
      transaction.sign(keyPair);

        console.log(`Transaction signed with keypair for ${token.tokenName}`);

        // Then sign with user's wallet using Privy
      const { signedTransaction } = await provider.request({
        method: 'signTransaction',
        params: {
          transaction: transaction
        },
      });

        console.log(`Transaction signed for ${token.tokenName}`);

        // Send the signed transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

        // Wait for confirmation
      console.log('Waiting for transaction confirmation...');
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
      
        console.log(`Transaction confirmed for ${token.tokenName}:`, signature);
        signatures.push(signature);
      }

      // Success! Now add the bet to the database
      const tokenNames = tokens.map(t => t.tokenName).join(' & ');
      
      // Prepare bet data for database
      const betData = {
        question: Array.isArray(description) ? description[0] : description,
        options: answersArr.map(answer => answer.content),
        tokenAddresses: tokens.map(token => token.mint),
        solAmount: parseFloat(Array.isArray(amount) ? amount[0] : amount || '1'),
        duration: currentBetType === 'timeless' ? null : parseInt(Array.isArray(duration) ? duration[0] : duration || '24'),
        userWallet: userWallet,
        creatorName: "Anonymous", // You can make this configurable later
        category: "General", // You can make this configurable later
        generatedImage: Array.isArray(generatedImage) ? generatedImage[0] : generatedImage,
        betType: currentBetType
      };

      console.log('Adding bet to database:', betData);

      // Call the add API to store the bet
      const addResponse = await fetch('https://apipoolc.vercel.app/api/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(betData),
      });

      if (!addResponse.ok) {
        console.warn('Failed to add bet to database, but tokens were created successfully');
      } else {
        const addData = await addResponse.json();
        console.log('Bet added to database:', addData);
      }

      Alert.alert(
        'Success! 🎉',
        `Your bet has been published successfully!\n\nTokens created: ${tokenNames}\n\nTransactions: ${signatures.join(', ')}`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );

    } catch (error) {
      console.error('Publish error:', error);
      Alert.alert(
        'Error',
        `Failed to publish bet: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsPublishing(false);
    }
  };

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
      <Animated.View style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
        {/* Preview Card - Using same layout as live-bets */}
        <View style={{
          backgroundColor: getCardBackgroundColor(),
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
          borderWidth: 2,
          borderColor: getBorderColor(),
        }}>
          {/* Bet Type Badge */}
          <View style={{ 
            position: 'absolute', 
            top: 16, 
            right: 16, 
            zIndex: 10,
            backgroundColor: currentBetType === 'bonk' ? theme.orange : 
                           currentBetType === 'timeless' ? theme.primary : theme.green,
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
              {currentBetType === 'bonk' ? '🪙 BONK' : 
               currentBetType === 'timeless' ? '♾️ TIMELESS' : '🎯 STANDARD'}
            </Text>
          </View>

          {/* Generated Image Display */}
          {generatedImage && (
            <View style={{ marginBottom: 20 }}>
              <Image 
                source={{ uri: Array.isArray(generatedImage) ? generatedImage[0] : generatedImage }} 
                style={{ 
                  width: '100%', 
                  height: 200, 
                  borderRadius: 12,
                }} 
                resizeMode="cover"
              />
            </View>
          )}

          {/* Question Display with bottom border */}
          <View style={{ 
            paddingBottom: 15, 
            borderBottomWidth: 1, 
            borderBottomColor: `${theme.text}15`, 
            marginBottom: 20 
          }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: theme.text,
              lineHeight: 32,
              flexWrap: 'wrap'
            }}>
              {Array.isArray(description) ? description[0] : description}
            </Text>
          </View>

          {/* Answer Options - VS layout exactly as in sketch */}
          {answersArr.length === 2 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 30 }}>
              <View 
                style={{
                  width: '40%',
                  backgroundColor: `${theme.primary}15`,
                  borderRadius: 12,
                  padding: 12,
                  marginRight: 5,
                  borderWidth: 1,
                  borderColor: `${theme.primary}30`,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 16,
                  color: theme.text,
                  fontWeight: '600',
                  textAlign: 'center',
                }}>
                  {answersArr[0].content}
                </Text>
              </View>
              
              <Image source={require('../assets/images/vs.png')} style={{ width: 40, height: 40, marginHorizontal: 10 }} />
              
              <View 
                style={{
                  width: '40%',
                  backgroundColor: `${theme.warning}15`,
                  borderRadius: 12,
                  padding: 12,
                  marginLeft: 5,
                  borderWidth: 1,
                  borderColor: `${theme.warning}30`,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 16,
                  color: theme.text,
                  fontWeight: '600',
                  textAlign: 'center',
                }}>
                  {answersArr[1].content}
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ marginBottom: 20 }}>
              {answersArr.map((answer, idx) => (
                <View key={idx} style={{
                  backgroundColor: theme.card,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: `${theme.text}15`,
                }}>
                  <Text style={{
                    fontSize: 18,
                    color: theme.text,
                    textAlign: 'center',
                    fontWeight: '500',
                  }}>
                    {answer.content || '[No answer]'}
                  </Text>
                </View>
              ))}
            </View>
          )}


          {/* Stats positioned at bottom right as per sketch */}
          <View style={{ position: 'absolute', bottom: 20, right: 20 }}>
            {/* Player count with label */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 14, color: theme.text, fontWeight: 'bold', marginRight: 4 }}>
                Player count:
              </Text>
              <Text style={{ fontSize: 14, color: theme.text, fontWeight: 'bold' }}>
                24
              </Text>
            </View>
            
            {/* Pool size with label */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 14, color: theme.text, fontWeight: 'bold', marginRight: 4 }}>
                Pool size:
              </Text>
              <Text style={{ fontSize: 14, color: theme.text, fontWeight: 'bold' }}>
                {currentBetType === 'bonk' ? 
                  `${(parseFloat(Array.isArray(amount) ? amount[0] : amount || '1') * 1000).toFixed(0)} BONK` :
                  `${(parseFloat(Array.isArray(amount) ? amount[0] : amount || '1')).toFixed(1)} SOL`
                }
              </Text>
            </View>
            
            {/* Hot/Trending icon */}
            <View style={{ 
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: `${theme.orange}20`, 
              padding: 8, 
              borderRadius: 50,
              borderWidth: 1,
              borderColor: `${theme.orange}40`
            }}>
              <FontAwesome name="fire" size={18} color={theme.orange} />
            </View>
          </View>
          
          {/* Time tag positioned bottom left as per sketch */}
          {currentBetType !== 'timeless' && (
            <View style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              flexDirection: 'row',
              alignItems: 'center',
              zIndex: 10
            }}>
              <Ionicons name="hourglass-outline" size={24} color={theme.warning} />
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.warning, marginLeft: 4 }}>
                {parseInt(Array.isArray(duration) ? duration[0] : duration || '24')}h
              </Text>
            </View>
          )}

          {/* Timeless indicator for timeless bets */}
          {currentBetType === 'timeless' && (
            <View style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              flexDirection: 'row',
              alignItems: 'center',
              zIndex: 10
            }}>
              <Ionicons name="infinite-outline" size={24} color={theme.primary} />
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.primary, marginLeft: 4 }}>
                TIMELESS
              </Text>
            </View>
          )}

          {/* SocialProof REMOVED */}
        </View>

        {/* Publish Button */}
        <RetroButton
       
          title={isPublishing ? 'Creating...' : 'Create Bet'}
          onPress={handlePublishBet}
          disabled={isPublishing}
          backgroundColor="#29d620"
          textColor="#FFFFFF"
          fontSize={24}
          letterSpacing={0.5}
          minWidth={screenWidth - 40}
          minHeight={56}
          style={{ marginTop: 10 }}
          textShadowColor='black'
        />
      </Animated.View>
    </ScrollView>
  );
}