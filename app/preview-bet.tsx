import { useLocalSearchParams } from 'expo-router';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useContext, useEffect, useRef, useState } from 'react';
import { ThemeContext } from './_layout';
import { LinearGradient } from 'expo-linear-gradient';

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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
            {description}
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
                {amount || '1'} SOL
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
                  {duration || '24'}h {Math.floor(Math.random() * 60)}m
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
            onPress={() => {/* TODO: Edit logic */}}
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
            }}
            onPress={() => {/* TODO: Share logic */}}
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
          }}
          onPress={() => {/* TODO: Publish logic */}}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
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
            Publish Bet ✅
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
} 