import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, Animated, Alert, StatusBar } from 'react-native';
import RetroButton from '../components/RetroButton';
import { useContext, useEffect, useRef, useState } from 'react';
import { ThemeContext } from './_layout';
import { LinearGradient } from 'expo-linear-gradient';
import { Connection, Transaction , Keypair} from '@solana/web3.js';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { RetroPopup } from '../components/RetroPopup';
import { useWalletConnection } from '../hooks/useWalletConnection';
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
        backgroundColor: 'rgb(255, 255, 255)',
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
const { 
  connected: mwaConnected, 
  address: mwaAddress, 
  publicKey: mwaPublicKey, // Add this
  executeTransaction 
} = useWalletConnection();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [isPublishing, setIsPublishing] = useState(false);
  
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
  
      // Debug wallet states
      console.log('Privy wallets:', wallets?.length || 0);
      console.log('MWA connected:', mwaConnected);
      console.log('MWA address:', mwaAddress);
      console.log('MWA publicKey:', mwaPublicKey?.toBase58());
  
      // Check wallet availability - Privy first, then MWA
      let userWallet: string | null = null;
      let walletProvider: any = null;
      let walletType: 'privy' | 'mwa' | null = null;
  
      // First check if Privy wallet is connected
      if (wallets && wallets.length > 0) {
        const privyWallet = wallets[0];
        if (privyWallet.address) {
          userWallet = privyWallet.address;
          walletProvider = await privyWallet.getProvider();
          walletType = 'privy';
          console.log('Using Privy wallet:', userWallet);
        }
      }
  
      // If no Privy wallet, check MWA wallet
      if (!userWallet && mwaConnected && mwaAddress) {
        userWallet = mwaAddress;
        walletType = 'mwa';
        console.log('Using MWA wallet:', userWallet);
      }
  
      console.log('Final wallet selection:', { userWallet, walletType });
  
      if (!userWallet) {
        showPopup(
          'Error',
          `Please connect a wallet to create a bet.\n` +
          `Privy connected: ${wallets && wallets.length > 0 ? 'Yes' : 'No'}\n` +
          `MWA connected: ${mwaConnected ? 'Yes' : 'No'}`,
          'error'
        );
        return;
      }
  
      // Create tokens for both options
      const tokens = [];
      const processedSignatures = []; // Track successful transactions
      
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
  
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        console.log(`Processing transaction for ${token.tokenName}...`);
  
        try {
          // Decode and prepare the transaction
          const transaction = Transaction.from(Buffer.from(token.poolTx, 'base64'));
  
          // Get a fresh blockhash and update the transaction
          console.log('Getting fresh blockhash...');
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
          transaction.recentBlockhash = blockhash;
          transaction.lastValidBlockHeight = lastValidBlockHeight;
  
          console.log('Signing transaction...');
  
          // First, sign with the keypair (mint authority)
          const keyPair = Keypair.fromSecretKey(new Uint8Array(token.keypair.secretKey));
          transaction.sign(keyPair);
  
          console.log(`Transaction signed with keypair for ${token.tokenName}`);
  
          let signature: string;
  
          if (walletType === 'privy' && walletProvider) {
            // Use Privy wallet flow
            const { signedTransaction } = await walletProvider.request({
              method: 'signTransaction',
              params: {
                transaction: transaction
              },
            });
  
            console.log(`Transaction signed for ${token.tokenName}`);
  
            // Send the signed transaction
            signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
              skipPreflight: false,
              preflightCommitment: 'confirmed'
            });
  
          } else if (walletType === 'mwa') {
            // Use MWA wallet flow
            console.log(`Using MWA wallet to sign transaction for ${token.tokenName}`);
            
            // The executeTransaction method will handle signing and sending
            signature = await executeTransaction(transaction);
  
          } else {
            throw new Error('No valid wallet provider available');
          }
  
          // Wait for confirmation with error handling
          console.log('Waiting for transaction confirmation...');
          try {
            await connection.confirmTransaction({
              signature,
              blockhash,
              lastValidBlockHeight
            }, 'confirmed');
            
            console.log(`Transaction confirmed for ${token.tokenName}:`, signature);
            processedSignatures.push(signature);
          } catch (confirmError) {
            console.warn(`Confirmation failed for ${token.tokenName}, but transaction may have succeeded:`, confirmError);
            // Still add to processed signatures since transaction was sent
            processedSignatures.push(signature);
          }
  
        } catch (tokenError) {
          console.error(`Error processing token ${token.tokenName}:`, tokenError);
          
          // Check if the error happened after the transaction was sent
          if (
            typeof tokenError === 'object' &&
            tokenError !== null &&
            'message' in tokenError &&
            typeof (tokenError as any).message === 'string' &&
            (tokenError as any).message.includes('Transaction sent')
          ) {
            console.log(`Transaction was sent for ${token.tokenName}, continuing...`);
            // Extract signature from error message if possible
            const signatureMatch = (tokenError as any).message.match(/signature: ([A-Za-z0-9]+)/);
            if (signatureMatch) {
              processedSignatures.push(signatureMatch[1]);
            }
          } else {
            // If it's a critical error before sending, re-throw
            throw tokenError;
          }
        }
      }
  
      // Success! Now add the bet to the database regardless of confirmation issues
      const tokenNames = tokens.map(t => t.tokenName).join(' & ');
      
      // Prepare bet data for database
      const betData = {
        question: Array.isArray(description) ? description[0] : description,
        options: answersArr.map(answer => answer.content),
        tokenAddresses: tokens.map(token => token.mint),
        solAmount: parseFloat(Array.isArray(amount) ? amount[0] : amount || '1'),
        duration: currentBetType === 'timeless' ? null : parseInt(Array.isArray(duration) ? duration[0] : duration || '24'),
        userWallet: userWallet,
        creatorName: "Anonymous",
        category: "General",
        generatedImage: Array.isArray(generatedImage) ? generatedImage[0] : generatedImage,
        betType: currentBetType
      };
  
      console.log('Adding bet to database:', betData);
  
      try {
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
          
          // Show partial success popup
          showPopup(
            'Partial Success ⚠️',
            `Tokens created successfully with ${walletType?.toUpperCase()} wallet!\nTransactions: ${processedSignatures.length}\nDatabase update failed - please contact support.`,
            'warning',
            { tokenNames, signatures: processedSignatures },
            () => router.back()
          );
          return;
        }
  
        const addData = await addResponse.json();
        console.log('Bet added to database:', addData);
  
        // Full success
        showPopup(
          'Success! 🎉',
          `Your bet has been published successfully using ${walletType?.toUpperCase()} wallet!`,
          'success',
          { tokenNames, signatures: processedSignatures },
          () => router.back()
        );
  
      } catch (dbError) {
        console.error('Database error:', dbError);
        
        // Show partial success popup
        showPopup(
          'Partial Success ⚠️',
          `Tokens created successfully with ${walletType?.toUpperCase()} wallet!\nTransactions: ${processedSignatures.length}\nDatabase update failed - please contact support.`,
          'warning',
          { tokenNames, signatures: processedSignatures },
          () => router.back()
        );
      }
  
    } catch (error) {
      console.error('Publish error:', error);
      showPopup(
        'Error',
        `Failed to publish bet: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar backgroundColor="transparent" translucent barStyle={themeName === 'light' ? 'dark-content' : 'light-content'} />
      
      <Animated.View style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
        {/* Preview Card - Same as Live Bet */}
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
            marginBottom: 40,
            shadowColor: '#000',
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
              style={{
                width: '100%',
                padding: 16,
                marginBottom: 10,
                alignItems: 'center',
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
                {answersArr[0]?.content || 'Option 1'}
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
              style={{
                width: '100%',
                padding: 16,
                alignItems: 'center',
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
                {answersArr[1]?.content || 'Option 2'}
              </Text>
            </TouchableOpacity>
          </View>


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
        </View>
      </View>
      
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
    </Animated.View>
  </View>
  );
}