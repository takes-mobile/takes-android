import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, Animated, Alert } from 'react-native';
import { useContext, useEffect, useRef, useState } from 'react';
import { ThemeContext } from './_layout';
import { LinearGradient } from 'expo-linear-gradient';
import { Connection, Transaction , Keypair} from '@solana/web3.js';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Animated VS Component
const AnimatedVS = () => {
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
        color: '#F97316',
        textShadowColor: 'rgba(249, 115, 22, 0.5)',
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
          backgroundColor: '#3B82F6',
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
          backgroundColor: '#EC4899',
          borderRadius: 3,
        }} />
      </View>
    </View>
  );
};

// Social Proof Component
const SocialProof = ({ theme }: { theme: any }) => {
  const [currentActivity, setCurrentActivity] = useState(0);
  const activities = [
    "John just bet 0.5 SOL on Option A 🔥",
    "Sarah placed 0.3 SOL on Option B ⚡",
    "Mike bet 1.2 SOL on Option A 🚀",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivity((prev) => (prev + 1) % activities.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      padding: 12,
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
    }}>
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3B82F6',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Text style={{ color: '#fff', fontSize: 16 }}>👤</Text>
      </View>
      <Text style={{
        fontSize: 14,
        color: theme.subtext,
        flex: 1,
      }}>
        {activities[currentActivity]}
      </Text>
    </View>
  );
};

export default function PreviewBetScreen() {
  const { description, answers, duration, amount } = useLocalSearchParams();
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

  let answersArr: Array<{type: string, content: string}> = [];
  
  try {
    answersArr = answers ? JSON.parse(answers as string) : [];
  } catch {
    answersArr = [];
  }

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
        duration: parseInt(Array.isArray(duration) ? duration[0] : duration || '24'),
        userWallet: userWallet,
        creatorName: "Anonymous", // You can make this configurable later
        category: "General" // You can make this configurable later
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
        {/* Preview Card */}
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
          {/* Question Display */}
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.text,
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 32,
            textShadowColor: 'rgba(0,0,0,0.3)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4,
          }}>
            {Array.isArray(description) ? description[0] : description}
          </Text>

          {/* Betting Options */}
          {answersArr.length === 2 ? (
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  style={{
                    flex: 1,
                    height: 60,
                    borderRadius: 16,
                    marginRight: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#3B82F6',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.4,
                    shadowRadius: 25,
                    elevation: 10,
                  }}
                >
                  {answersArr[0].type === 'image' ? (
                    <Image 
                      source={{ uri: answersArr[0].content }} 
                      style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 8,
                      }} 
                    />
                  ) : (
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#fff',
                      textAlign: 'center',
                    }}>
                      {answersArr[0].content}
                    </Text>
                  )}
                </LinearGradient>

                <AnimatedVS />

                <LinearGradient
                  colors={['#EC4899', '#BE185D']}
                  style={{
                    flex: 1,
                    height: 60,
                    borderRadius: 16,
                    marginLeft: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#EC4899',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.4,
                    shadowRadius: 25,
                    elevation: 10,
                  }}
                >
                  {answersArr[1].type === 'image' ? (
                    <Image 
                      source={{ uri: answersArr[1].content }} 
                      style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 8,
                      }} 
                    />
                  ) : (
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#fff',
                      textAlign: 'center',
                    }}>
                      {answersArr[1].content}
                    </Text>
                  )}
                </LinearGradient>
              </View>

              <MockStats theme={theme} />
            </View>
          ) : (
            <View style={{ marginBottom: 20 }}>
              {answersArr.map((answer, idx) => (
                <View key={idx} style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}>
                  {answer.type === 'image' ? (
                    <View style={{ alignItems: 'center' }}>
                      <Image 
                        source={{ uri: answer.content }} 
                        style={{ 
                          width: 80, 
                          height: 80, 
                          borderRadius: 12,
                        }} 
                      />
                    </View>
                  ) : (
                    <Text style={{
                      fontSize: 18,
                      color: theme.text,
                      textAlign: 'center',
                      fontWeight: '500',
                    }}>
                      {answer.content || '[No answer]'}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}


          {/* Mock Statistics */}
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, color: theme.subtext, fontWeight: '500' }}>Total Pot</Text>
              <Text style={{ fontSize: 20, color: theme.text, fontWeight: 'bold', fontFamily: 'monospace' }}>
                {Array.isArray(amount) ? amount[0] : amount || '1'} SOL
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, color: theme.subtext, fontWeight: '500' }}>Participants</Text>
              <Text style={{ fontSize: 16, color: theme.text, fontWeight: '600' }}>24 people</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: theme.subtext, fontWeight: '500' }}>Time Left</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: theme.warning, fontWeight: 'bold', marginRight: 4 }}>⏰</Text>
                <Text style={{ fontSize: 16, color: theme.text, fontWeight: '600' }}>
                  {Array.isArray(duration) ? duration[0] : duration || '24'}h {Math.floor(Math.random() * 60)}m
                </Text>
              </View>
            </View>
          </View>

          <SocialProof theme={theme} />
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
              backgroundColor: 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => router.back()}
            disabled={isPublishing}
          >
            <Text style={{
              color: theme.text,
              fontSize: 16,
              fontWeight: '600',
            }}>
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 2,
              height: 44,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: isPublishing ? 0.5 : 1,
            }}
            onPress={() => {/* TODO: Share logic */}}
            disabled={isPublishing}
          >
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6']}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                borderRadius: 12,
              }}
            />
            <Text style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '600',
            }}>
              Share Preview
            </Text>
          </TouchableOpacity>
        </View>

        {/* Publish Button */}
        <TouchableOpacity
          style={{
            height: 56,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#10B981',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.4,
            shadowRadius: 25,
            elevation: 10,
            opacity: isPublishing ? 0.7 : 1,
          }}
          onPress={handlePublishBet}
          disabled={isPublishing}
        >
          <LinearGradient
            colors={isPublishing ? ['#6B7280', '#4B5563'] : ['#10B981', '#059669']}
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
            {isPublishing ? 'Publishing... ⏳' : 'Publish Bet ✅'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}