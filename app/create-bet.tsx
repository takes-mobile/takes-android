import { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, Animated, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from './_layout';

export default function CreateBetScreen() {
  const [description, setDescription] = useState('');
  const [answers, setAnswers] = useState(['', '']);
  const [answerTypes, setAnswerTypes] = useState(['text', 'text']);
  const [answerImages, setAnswerImages] = useState(['', '']);
  const [betDuration, setBetDuration] = useState('24');
  const [betAmount, setBetAmount] = useState('0.1');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [iconScale] = useState(new Animated.Value(1));
  const router = useRouter();
  const { theme: themeName } = useContext(ThemeContext);

  const lightTheme = {
    background: '#f6f8fa',
    card: '#fff',
    text: '#222',
    subtext: '#666',
    border: '#e5e7eb',
    green: '#22c55e',
    shadow: '#000',
    placeholder: '#9ca3af',
    accent: '#3b82f6',
    warning: '#f59e0b',
    success: '#10b981',
  };

  const darkTheme = {
    background: '#18181b',
    card: '#232323',
    text: '#fff',
    subtext: '#bbb',
    border: '#333',
    green: '#22c55e',
    shadow: '#000',
    placeholder: '#666',
    accent: '#3b82f6',
    warning: '#f59e0b',
    success: '#10b981',
  };

  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  const timeOptions = [
    { label: '1h', hours: 1, color: theme.success, description: 'Quick Bet' },
    { label: '24h', hours: 24, color: theme.green, description: 'Daily Bet' },
    { label: '7d', hours: 168, color: theme.accent, description: 'Weekly Bet' },
    { label: '30d', hours: 720, color: theme.warning, description: 'Monthly Bet' },
  ];

  const amountOptions = [
    { amount: 0.05, color: theme.success, label: 'Starter' },
    { amount: 0.1, color: theme.green, label: 'Popular' },
    { amount: 0.5, color: theme.accent, label: 'Premium' },
  ];

  // Calculate potential earnings
  const calculatePotentialEarnings = () => {
    const baseAmount = parseFloat(betAmount) || 0.1;
    const estimatedParticipants = 25; // Based on similar questions
    const creatorCut = 0.05; // 5% of total pot
    return (baseAmount * estimatedParticipants * creatorCut).toFixed(2);
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

  const pickImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newImages = [...answerImages];
      newImages[index] = result.assets[0].uri;
      setAnswerImages(newImages);
    }
  };

  const toggleAnswerType = (index: number) => {
    const newTypes = [...answerTypes];
    newTypes[index] = newTypes[index] === 'text' ? 'image' : 'text';
    setAnswerTypes(newTypes);
    
    if (newTypes[index] === 'image') {
      const newAnswers = [...answers];
      newAnswers[index] = '';
      setAnswers(newAnswers);
    } else {
      const newImages = [...answerImages];
      newImages[index] = '';
      setAnswerImages(newImages);
    }
  };

  const handleShowBet = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a bet description');
      return;
    }

    const validAnswers = answers.every((ans, idx) => {
      if (answerTypes[idx] === 'text') {
        return ans.trim().length > 0;
      } else {
        return answerImages[idx].length > 0;
      }
    });

    if (!validAnswers) {
      Alert.alert('Error', 'Please fill in all answers');
      return;
    }

    const betData = {
      description,
      duration: parseInt(betDuration),
      amount: parseFloat(betAmount),
      answers: answerTypes.map((type, idx) => ({
        type,
        content: type === 'text' ? answers[idx] : answerImages[idx]
      }))
    };

    router.push({
      pathname: '/preview-bet',
      params: { 
        description, 
        duration: betDuration,
        amount: betAmount,
        answers: JSON.stringify(betData.answers) 
      }
    });
  };





  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      {/* Header with Creation Incentives */}
      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ 
            fontSize: 36, 
            fontWeight: 'bold', 
            color: theme.green, 
          }}>
            /create-bet
          </Text>
          
          {/* Notification Icon */}
          <TouchableOpacity
            onPress={handleRewardsPress}
            style={{
              backgroundColor: '#FFD600',
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: theme.shadow,
              shadowOpacity: 0.2,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
              borderWidth: 2,
              borderColor: 'black',
              position: 'relative',
            }}
          >
            <Animated.View style={{ transform: [{ scale: iconScale }] }}>
              <MaterialIcons name="emoji-events" size={24} color="#b8860b" />
            </Animated.View>
            
            {/* Red Exclamation Badge */}
            <View style={{
              position: 'absolute',
              top: -2,
              right: -2,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ 
                color: '#FF4444', 
                fontSize: 16, 
                fontWeight: 'bold',
                textAlign: 'center',
                lineHeight: 16,
                textShadowColor: '#000',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}>
                !
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Question Input */}
      <View style={{ marginBottom: 24, marginTop: 24 }}>
        <Text style={{ fontSize: 21, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>
          What's your burning opinion?
        </Text>
        <TextInput 
          placeholder="e.g., Will Apple stock go up today?" 
          value={description} 
          onChangeText={setDescription}
          style={{
            backgroundColor: theme.card,
            borderRadius: 16,
            padding: 16,
            fontSize: 16,
            borderWidth: 2,
            borderColor: theme.border,
            color: theme.text,
            minHeight: 80,
          }}
          multiline
          numberOfLines={3}
          placeholderTextColor={theme.placeholder}
        />
      </View>

      {/* Answer Options */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>
          Answer Options
        </Text>
        {answers.map((ans, idx) => (
          <View key={idx} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, flex: 1 }}>
                Option {idx + 1}
              </Text>
              <TouchableOpacity
                onPress={() => toggleAnswerType(idx)}
                style={{
                  backgroundColor: answerTypes[idx] === 'text' ? theme.green : theme.subtext,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                  {answerTypes[idx] === 'text' ? 'TEXT' : 'IMAGE'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {answerTypes[idx] === 'text' ? (
              <TextInput 
                placeholder={`Option ${idx + 1}`} 
                value={ans} 
                onChangeText={text => setAnswers(a => a.map((v, i) => (i === idx ? text : v)))}
                style={{
                  backgroundColor: theme.card,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  borderWidth: 2,
                  borderColor: theme.border,
                  color: theme.text,
                }}
                placeholderTextColor={theme.placeholder}
              />
            ) : (
              <View style={{ alignItems: 'center' }}>
                {answerImages[idx] ? (
                  <View style={{ position: 'relative' }}>
                    <Image 
                      source={{ uri: answerImages[idx] }} 
                      style={{ 
                        width: 120, 
                        height: 120, 
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: theme.border,
                      }} 
                    />
                    <TouchableOpacity
                      onPress={() => pickImage(idx)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: theme.green,
                        borderRadius: 12,
                        padding: 4,
                      }}
                    >
                      <MaterialIcons name="edit" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => pickImage(idx)}
                    style={{
                      width: 120,
                      height: 120,
                      backgroundColor: theme.card,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: theme.border,
                      borderStyle: 'dashed',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <MaterialIcons name="add-photo-alternate" size={32} color={theme.placeholder} />
                    <Text style={{ color: theme.placeholder, fontSize: 12, marginTop: 4 }}>Add Image</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Advanced Options Toggle */}
      <TouchableOpacity
        onPress={() => setShowAdvanced(!showAdvanced)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.card,
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          borderWidth: 2,
          borderColor: theme.border,
        }}
      >
        <Image 
          source={require('../assets/images/setting.png')} 
          style={{ width: 20, height: 20 }}
          resizeMode="contain"
        />
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginLeft: 12, flex: 1 }}>
          Custom options
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
          {/* Bet Duration */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>
              Duration
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingRight: 20 }}
            >
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {timeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.hours}
                    onPress={() => setBetDuration(option.hours.toString())}
                    style={{
                      backgroundColor: betDuration === option.hours.toString() ? option.color : theme.card,
                      borderRadius: 16,
                      padding: 12,
                      borderWidth: 2,
                      borderColor: betDuration === option.hours.toString() ? option.color : theme.border,
                      alignItems: 'center',
                      minWidth: 80,
                    }}
                  >
               
                    <Text style={{ 
                      fontSize: 14, 
                      fontWeight: 'bold', 
                      color: betDuration === option.hours.toString() ? '#fff' : theme.text,
                    }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Bet Amount */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>
              Entry Fee
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingRight: 20 }}
            >
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {amountOptions.map((option) => (
                  <TouchableOpacity
                    key={option.amount}
                    onPress={() => setBetAmount(option.amount.toString())}
                    style={{
                      backgroundColor: betAmount === option.amount.toString() ? option.color : theme.card,
                      borderRadius: 16,
                      padding: 12,
                      borderWidth: 2,
                      borderColor: betAmount === option.amount.toString() ? option.color : theme.border,
                      alignItems: 'center',
                      minWidth: 80,
                    }}
                  >
                    <Text style={{ 
                      fontSize: 14, 
                      fontWeight: 'bold', 
                      color: betAmount === option.amount.toString() ? '#fff' : theme.text,
                    }}>
                      {option.amount} SOL
                    </Text>
                    <Text style={{ 
                      fontSize: 10, 
                      color: betAmount === option.amount.toString() ? '#fff' : theme.subtext,
                    }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Create Button */}
      <TouchableOpacity
        onPress={handleShowBet}
        style={{
          backgroundColor: theme.green,
          borderRadius: 20,
          paddingVertical: 16,
          paddingHorizontal: 32,
          alignItems: 'center',
          shadowColor: theme.shadow,
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
          borderWidth: 2,
          borderColor: 'black',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 }}>
          Show Bet 
        </Text>
      </TouchableOpacity>

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
          backgroundColor: theme.green,
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
              backgroundColor: 'rgba(255,255,255,0.2)',
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
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 30,
            width: 60,
            height: 60,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <MaterialIcons name="emoji-events" size={32} color="#fff" />
          </View>

          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 16 }}>
            🏆 Creator Rewards
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

          <View style={{ 
            backgroundColor: '#fff', 
            borderRadius: 16, 
            padding: 16,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 12, color: theme.green, fontWeight: '600', marginBottom: 4 }}>
              POTENTIAL EARNINGS
            </Text>
            <Text style={{ fontSize: 24, color: theme.green, fontWeight: 'bold' }}>
              +{calculatePotentialEarnings()} SOL
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
} 