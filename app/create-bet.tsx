import { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, Animated, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from './_layout';
import RetroButton from '../components/RetroButton';
import { useBets } from '../context/BetsContext';

const BET_GREEN = '#29d620';

export default function CreateBetScreen() {
  const [description, setDescription] = useState('');
  const [answers, setAnswers] = useState(['', '']);
  const [generatedImage, setGeneratedImage] = useState('');
  const [betDuration, setBetDuration] = useState('24');
  // Remove betAmount state and related logic
  // const [betAmount, setBetAmount] = useState('0.1');
  const [betType, setBetType] = useState<'standard' | 'bonk' | 'timeless'>('standard');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showCreatorRewards, setShowCreatorRewards] = useState(false);
  const [iconScale] = useState(new Animated.Value(1));
  const router = useRouter();
  const { theme: themeName } = useContext(ThemeContext);
  const { fetchBets, lastFetched } = useBets();
  
  // Prefetch bets in the background if needed
  useEffect(() => {
    // Only fetch if we haven't fetched in the last 5 minutes
    if (!lastFetched || (new Date().getTime() - lastFetched.getTime() > 300000)) {
      fetchBets();
    }
  }, []);

  const lightTheme = {
    background: '#f6f8fa',
    card: '#fff',
    text: '#222',
    subtext: '#666',
    border: '#e5e7eb',
    green: BET_GREEN,
    shadow: '#000',
    placeholder: '#9ca3af',
    accent: '#3b82f6',
    warning: '#f59e0b',
    success: '#10b981',
    orange: '#f97316',
  };

  const darkTheme = {
    background: '#1e1a2c', // Dark purple background
    card: '#2d2640', // Medium-dark purple card
    text: '#fff',
    subtext: '#c8b6e8', // Light purple subtext
    border: '#4a3f66', // Medium purple border
    green: BET_GREEN,
    shadow: '#130f1c', // Very dark purple shadow
    placeholder: '#8778b3', // Medium-light purple placeholder
    accent: '#8b5cf6', // Brighter purple accent
    warning: '#f59e0b',
    success: '#10b981',
    orange: '#f97316',
  };

  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  const timeOptions = [
    { label: '1h', hours: 1, color: theme.success, description: 'Quick Bet' },
    { label: '24h', hours: 24, color: theme.green, description: 'Daily Bet' },
    { label: '7d', hours: 168, color: theme.accent, description: 'Weekly Bet' },
    { label: '30d', hours: 720, color: theme.warning, description: 'Monthly Bet' },
  ];

  // Remove amountOptions and all related logic
  // const amountOptions = [
  //   { amount: 0.05, color: theme.success, label: 'Starter' },
  //   { amount: 0.1, color: theme.green, label: 'Popular' },
  //   { amount: 0.5, color: theme.accent, label: 'Premium' },
  // ];

  const betTypeOptions = [
    { 
      type: 'standard' as const, 
      label: 'NORMAL', 
      description: '',
      color: theme.green,
      icon: ''
    },
    { 
      type: 'bonk' as const, 
      label: 'BONK BUY', 
      description: '',
      color: theme.orange,
      icon: require('../assets/images/bonk.png')
    },
    { 
      type: 'timeless' as const, 
      label: 'TIMELESS', 
      description: '',
      color: theme.accent,
      icon: '♾️'
    },
  ];

  // Calculate potential earnings (remove betAmount dependency)
  const calculatePotentialEarnings = () => {
    // const baseAmount = parseFloat(betAmount) || 0.1;
    const estimatedParticipants = 25; // Based on similar questions
    const creatorCut = 0.05; // 5% of total pot
    // return (baseAmount * estimatedParticipants * creatorCut).toFixed(2);
    return (estimatedParticipants * creatorCut).toFixed(2);
  };

  const animateIconPress = () => {
    Animated.sequence([
      Animated.timing(iconScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRewardsPress = () => {
    animateIconPress();
    setShowRewards(true);
  };

  // Generate image using pollinations.ai API
  const generateImage = async () => {
    if (!description.trim() || !answers[0].trim() || !answers[1].trim()) {
      return;
    }

    try {
      let prompt = `${description} ${answers[0]} vs ${answers[1]}`;
      // Use bonk.img for bonk buy type
      if (betType === 'bonk') {
        // Use a bonk image instead of pollinations
        setGeneratedImage('https://bonkimg.com/bonk.png');
        return;
      }
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;
      setGeneratedImage(imageUrl);
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  // Generate image when description or answers or betType change
  useEffect(() => {
    const timer = setTimeout(() => {
      generateImage();
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timer);
  }, [description, answers, betType]);

  const handleShowBet = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a bet description');
      return;
    }

    const validAnswers = answers.every(ans => ans.trim().length > 0);

    if (!validAnswers) {
      Alert.alert('Error', 'Please fill in all answers');
      return;
    }

    const betData = {
      description,
      duration: betType === 'timeless' ? null : parseInt(betDuration),
      // amount: parseFloat(betAmount),
      answers: answers.map(answer => ({
        type: 'text',
        content: answer
      })),
      generatedImage,
      betType
    };

    router.push({
      pathname: '/preview-bet',
      params: { 
        description, 
        duration: betType === 'timeless' ? '0' : betDuration,
        // amount: betAmount,
        answers: JSON.stringify(betData.answers),
        generatedImage,
        betType
      }
    });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>

      {/* Trophy Icon - Top Right */}
      <TouchableOpacity 
        style={{
          position: 'absolute',
          top: 60,
          right: 20,
          zIndex: 10,
        }}
        onPress={() => setShowCreatorRewards(true)}
      >
        <MaterialIcons 
          name="emoji-events" 
          size={32} 
          color={theme.green}
        />
      </TouchableOpacity>

      <View style={{ marginBottom: 24 }}>
        <Text style={{ 
          marginTop: 120,
          fontSize: 26, 
          fontFamily: 'PressStart2P-Regular',
          color: theme.text, 
          marginBottom: 12,
          textTransform: 'uppercase'
        }}>
          Whats your 
        </Text>
        <Text style={{ 
          fontSize: 32,
          marginTop: 12,
          
          fontFamily: 'PressStart2P-Regular',
          color: theme.green, 
          marginBottom: 12,
        }}>
          VIRAL TAKE?
        </Text>
      </View>
      {/* Main Question Input - Retro Style */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ 
          fontSize: 14, 
          fontFamily: 'PressStart2P-Regular',
          color: theme.text, 
          marginBottom: 12,
          textTransform: 'uppercase'
        }}>
          YOUR QUESTION:
        </Text>
        <View style={{
          backgroundColor: theme.card,
          borderWidth: 3,
          borderColor: theme.border,
          padding: 2, // Thin padding for pixel border effect
        }}>
          <TextInput 
            placeholder="e.g., who would win?" 
            value={description} 
            onChangeText={setDescription}
            style={{
              backgroundColor: theme.card,
              padding: 18,
              fontSize: 22,
              fontWeight: '600',
              color: theme.text,
              minHeight: 100,
            }}
            multiline
            numberOfLines={3}
            placeholderTextColor={theme.placeholder}
          />
        </View>
        {answers.map((ans, idx) => (
          <View key={idx} style={{ marginBottom: 16, marginTop: 16 }}>
            <Text style={{ 
              fontSize: 14, 
              fontFamily: 'PressStart2P-Regular',
              color: theme.text, 
              marginBottom: 12,
              textTransform: 'uppercase'
            }}>
              OPTION {idx + 1}
            </Text>
            <View style={{
              backgroundColor: theme.card,
              borderWidth: 3,
              borderColor: theme.green,
              padding: 2,
            }}>
              <TextInput 
                placeholder={`...`} 
                value={ans} 
                onChangeText={text => setAnswers(a => a.map((v, i) => (i === idx ? text : v)))}
                style={{
                  backgroundColor: theme.card,
                  padding: 16,
                  fontSize: 22,
                  color: theme.text,
                  fontWeight: '600',
                }}
                placeholderTextColor={theme.placeholder}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Bet Type Selection */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ 
          fontSize: 14, 
          fontFamily: 'PressStart2P-Regular',
          color: theme.text, 
          marginBottom: 12,
          textTransform: 'uppercase'
        }}>
          BET TYPE:
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {betTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              onPress={() => setBetType(option.type)}
              style={{
                flex: 1,
                backgroundColor: betType === option.type ? option.color : theme.card,
                borderWidth: 3,
                borderColor: betType === option.type ? option.color : theme.border,
                borderRadius: 12,
                padding: 12,
                alignItems: 'center',
              }}
            >
              {/* Show bonk icon as image if bonk type, else as text or nothing */}
              {option.type === 'bonk' ? (
                <Image
                  source={require('../assets/images/bonk.png')}
                  style={{ width: 28, height: 28, marginBottom: 4 }}
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ fontSize: 20, marginBottom: 4 }}>
                  {option.icon}
                </Text>
              )}
              <Text style={{ 
                fontSize: 10, 
                fontFamily: 'PressStart2P-Regular',
                color: betType === option.type ? '#fff' : theme.text,
                textAlign: 'center',
                marginBottom: 2,
              }}>
                {option.label}
              </Text>
              <Text style={{ 
                fontSize: 8, 
                fontFamily: 'PressStart2P-Regular',
                color: betType === option.type ? '#fff' : theme.subtext,
                textAlign: 'center',
                opacity: 0.8,
              }}>
                {option.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Generated Image Preview */}
      {generatedImage && (
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 14, 
            fontFamily: 'PressStart2P-Regular',
            color: theme.text, 
            marginBottom: 12,
            textTransform: 'uppercase'
          }}>
            GENERATED IMAGE:
          </Text>
          <View style={{
            backgroundColor: theme.card,
            borderWidth: 3,
            borderColor: theme.green,
            padding: 2,
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            <Image 
              source={{ uri: generatedImage }} 
              style={{ 
                width: '100%', 
                height: 200, 
                borderRadius: 8,
              }} 
              resizeMode="cover"
            />
          </View>
        </View>
      )}

      {/* Advanced Options Toggle - Retro Style */}
      <TouchableOpacity
        onPress={() => setShowAdvanced(!showAdvanced)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.card,
          borderWidth: 3,
          borderColor: theme.border,
          padding: 14,
          marginBottom: 20,
        }}
      >
        <Image 
          source={require('../assets/images/setting.png')} 
          style={{ width: 20, height: 20 }}
          resizeMode="contain"
        />
        <Text style={{ 
          fontSize: 14, 
          fontFamily: 'PressStart2P-Regular',
          color: theme.text, 
          marginLeft: 12, 
          flex: 1 
        }}>
          CUSTOM OPTIONS
        </Text>
        <MaterialIcons 
          name={showAdvanced ? "expand-less" : "expand-more"} 
          size={24} 
          color={theme.subtext} 
        />
      </TouchableOpacity>

      {/* Advanced Options */}
      {showAdvanced && (
        <View style={{ marginBottom: 24 }}>
          {/* Bet Duration - Only show for non-timeless bets */}
          {betType !== 'timeless' && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ 
                fontSize: 14, 
                fontFamily: 'PressStart2P-Regular',
                color: theme.text, 
                marginBottom: 12,
                textTransform: 'uppercase'
              }}>
                DURATION
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingRight: 20 }}
              >
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {timeOptions.map((option) => (
                    <RetroButton
                      key={option.hours}
                      title={option.label}
                      onPress={() => setBetDuration(option.hours.toString())}
                      backgroundColor={betDuration === option.hours.toString() ? option.color : theme.card}
                      textColor={betDuration === option.hours.toString() ? '#fff' : theme.text}
                      fontSize={12}
                      letterSpacing={0}
                      fontWeight="normal"
                      minHeight={40}
                      minWidth={80}
                      textStyle={{ fontFamily: 'PressStart2P-Regular' }}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Removed Bet Amount/Entry Fee column */}
        </View>
      )}

      {/* Create Button - Retro Style */}
      <RetroButton
        title="SHOW BET"
        onPress={handleShowBet}
        backgroundColor={BET_GREEN}
        textColor="#000000"
        fontSize={16}
        letterSpacing={0}
        fontWeight="normal"
        minHeight={56}
        minWidth={240}
        textStyle={{ fontFamily: 'PressStart2P-Regular' }}
        style={{ alignSelf: 'center' }}
      />

      {/* Creator Rewards Modal Popup */}
      <Modal
        visible={showRewards}
        animationType="fade"
        transparent
        onRequestClose={() => setShowRewards(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShowRewards(false)}
        />
        <View style={{
          position: 'absolute',
          top: '20%',
          left: 20,
          right: 20,
          backgroundColor: themeName === 'dark' ? '#2d2640' : '#fff',
          borderRadius: 20,
          padding: 24,
          shadowColor: theme.shadow,
          shadowOpacity: 0.3,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
          elevation: 15,
        }}>
          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setShowRewards(false)}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: themeName === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.2)',
              borderRadius: 16,
              width: 32,
              height: 32,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <MaterialIcons name="close" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Trophy Icon */}
          <View style={{
            alignSelf: 'center',
            backgroundColor: themeName === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.2)',
            borderRadius: 30,
            width: 60,
            height: 60,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <MaterialIcons name="emoji-events" size={32} color="#fff" />
          </View>

          <Text style={{ 
            fontSize: 18, 
            fontFamily: 'PressStart2P-Regular',
            color: '#fff', 
            textAlign: 'center', 
            marginBottom: 16,
            textShadowColor: 'rgba(0,0,0,0.7)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 0,
          }}>
            🏆 CREATOR REWARDS
          </Text>
          
          <Text style={{ fontSize: 16, color: '#fff', marginBottom: 16, lineHeight: 24, textAlign: 'center', opacity: 0.95 }}>
            Earn <Text style={{ fontWeight: 'bold' }}>5%</Text> of the total pot • 
            Questions with images get <Text style={{ fontWeight: 'bold' }}>3x more engagement</Text>
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <MaterialIcons name="trending-up" size={18} color="#fff" style={{ opacity: 0.9, marginRight: 8 }} />
            <Text style={{ fontSize: 14, color: '#fff', opacity: 0.9, textAlign: 'center' }}>
              Trending questions earn bonus rewards
            </Text>
          </View>

         
        </View>
      </Modal>

      {/* Creator Rewards Modal Popup */}
      <Modal
        visible={showCreatorRewards}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCreatorRewards(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShowCreatorRewards(false)}
        />
        <View style={{
          position: 'absolute',
          top: '20%',
          left: 20,
          right: 20,
          backgroundColor: themeName === 'dark' ? '#2d2640' : '#fff',
          borderRadius: 20,
          padding: 24,
          shadowColor: theme.shadow,
          shadowOpacity: 0.3,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
          elevation: 15,
        }}>
          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setShowCreatorRewards(false)}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: themeName === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.2)',
              borderRadius: 16,
              width: 32,
              height: 32,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <MaterialIcons name="close" size={20} color={theme.text} />
          </TouchableOpacity>

          {/* Trophy Icon */}
          
          <Text style={{ 
            fontSize: 18,
            marginTop: 56,
            fontFamily: 'PressStart2P-Regular',
            color: theme.text, 
            textAlign: 'center', 
            marginBottom: 16,
            fontWeight: 'bold',
          }}>
            CREATOR REWARDS
          </Text>
          
          <Text style={{ 
            fontSize: 16, 
            color: 'red', 
            marginBottom: 16, 
            lineHeight: 24, 
            textAlign: 'center',
            fontFamily: 'PressStart2P-Regular',
          }}>
            Earn total 5 percent of trading fees of your market.
          </Text>

        </View>
      </Modal>
    </ScrollView>
  );
} 