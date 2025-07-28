import { Button, Linking, Text, View, TouchableOpacity, Modal, Pressable, Platform, Animated, Dimensions, StyleSheet, Image } from "react-native";
import { LoginWithOAuthInput, useLoginWithOAuth } from "@privy-io/expo";
import { useLogin } from "@privy-io/expo/ui";
import { useLoginWithPasskey } from "@privy-io/expo/passkey";
import Constants from "expo-constants";
import { useState, useContext, useEffect, useRef } from "react";
import * as Application from "expo-application";
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { ThemeContext } from '../app/_layout';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Floating Animation Component
const FloatingElement = ({ delay, duration, startX, startY, endX, endY, children }: any) => {
  const translateX = useRef(new Animated.Value(startX)).current;
  const translateY = useRef(new Animated.Value(startY)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: endX,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: endY,
            duration: duration,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        translateX.setValue(startX);
        translateY.setValue(startY);
        opacity.setValue(0);
        setTimeout(animate, delay);
      });
    };

    setTimeout(animate, delay);
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        transform: [{ translateX }, { translateY }],
        opacity,
      }}
    >
      {children}
    </Animated.View>
  );
};

// Sample Bet Preview Component
const SampleBetPreview = ({ theme }: { theme: any }) => {
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -200,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenWidth,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start(animate);
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 100,
        transform: [{ translateX: slideAnim }],
        opacity: 0.3,
      }}
    >
      <View style={{
        backgroundColor: 'rgba(34,197,94,0.1)',
        borderRadius: 16,
        padding: 16,
        width: 200,
        borderWidth: 1,
        borderColor: 'rgba(34,197,94,0.2)',
      }}>
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
          "Who would win gorilla vs. 100 men?"
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: theme.subtext, fontSize: 12 }}>Yes: 65%</Text>
          <Text style={{ color: theme.subtext, fontSize: 12 }}>No: 35%</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// Top Sample Bet Preview Component
const TopSampleBetPreview = ({ theme }: { theme: any }) => {
  const slideAnim = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: screenWidth,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -200,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start(animate);
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 100,
        transform: [{ translateX: slideAnim }],
        opacity: 0.3,
      }}
    >
      <View style={{
        backgroundColor: 'rgba(139,92,246,0.1)',
        borderRadius: 16,
        padding: 16,
        width: 200,
        borderWidth: 1,
        borderColor: 'rgba(139,92,246,0.2)',
      }}>
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
          "Who will win the Super Bowl?"
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: theme.subtext, fontSize: 12 }}>Team A: 45%</Text>
          <Text style={{ color: theme.subtext, fontSize: 12 }}>Team B: 55%</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// Middle Sample Bet Preview Component
const MiddleSampleBetPreview = ({ theme }: { theme: any }) => {
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -200,
          duration: 10000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenWidth,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start(animate);
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: screenHeight / 2 - 50,
        transform: [{ translateX: slideAnim }],
        opacity: 0.25,
      }}
    >
      <View style={{
        backgroundColor: 'rgba(34,197,94,0.1)',
        borderRadius: 16,
        padding: 16,
        width: 180,
        borderWidth: 1,
        borderColor: 'rgba(34,197,94,0.2)',
      }}>
        <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
          "Will Apple stock go up today?"
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: theme.subtext, fontSize: 11 }}>Yes: 72%</Text>
          <Text style={{ color: theme.subtext, fontSize: 11 }}>No: 28%</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ShinyGlow component for the X button, with yellow glowing border
const ShinyGlow = () => {
  const shineAnim = useRef(new Animated.Value(-1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(borderAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(borderAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // The width and height should match the button's size
  return (
    <View
      pointerEvents="none"
      style={{
        ...StyleSheet.absoluteFillObject,
        borderRadius: 16,
        overflow: 'visible',
        zIndex: 2,
      }}
    >
      {/* Animated yellow glowing border */}
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          borderRadius: 16,
          borderWidth: 3,
          borderColor: borderAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(255, 215, 0, 0.5)', 'rgba(255, 255, 0, 1)'],
          }),
          shadowColor: '#FFD700',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: borderAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 0.9],
          }),
          shadowRadius: borderAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [8, 16],
          }),
          elevation: 12,
        }}
      />
      {/* Shiny sweep */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '100%',
          transform: [
            {
              translateX: shineAnim.interpolate({
                inputRange: [-1, 1],
                outputRange: [-120, 120], // adjust for effect
              }),
            },
            {
              rotate: '20deg',
            },
          ],
          opacity: 0.7,
        }}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,180,0.55)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            width: 80,
            height: '200%',
            borderRadius: 24,
          }}
        />
      </Animated.View>
      {/* Outer subtle glow */}
      <LinearGradient
        colors={['rgba(255,255,180,0.18)', 'rgba(255,255,180,0.05)', 'rgba(255,255,180,0)']}
        style={{
          ...StyleSheet.absoluteFillObject,
          borderRadius: 16,
        }}
      />
    </View>
  );
};

export default function LoginScreen() {
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { theme: themeName } = useContext(ThemeContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const modalSlideAnim = useRef(new Animated.Value(screenHeight)).current;
  
  const lightTheme = {
    background: '#f6f8fa',
    card: '#fff',
    text: '#222',
    subtext: '#444',
    border: '#000',
    green: '#22c55e',
    shadow: '#000',
    input: '#f6f8fa',
    modal: '#fff',
    placeholder: '#bbb',
  };
  
  const darkTheme = {
    background: '#18181b',
    card: '#232323',
    text: '#fff',
    subtext: '#bbb',
    border: '#333',
    green: '#22c55e',
    shadow: '#000',
    input: '#232323',
    modal: '#232323',
    placeholder: '#888',
  };
  
  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  const { loginWithPasskey } = useLoginWithPasskey({
    onError: (err) => {
      console.log(err);
      setError(JSON.stringify(err.message));
    },
  });
  const { login } = useLogin();
  const oauth = useLoginWithOAuth({
    onError: (err) => {
      console.log(err);
      setError(JSON.stringify(err.message));
    },
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
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

  const openModal = () => {
    setShowModal(true);
    Animated.spring(modalSlideAnim, {
      toValue: 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Background Gradient */}
      <LinearGradient
        colors={themeName === 'dark' ? ['#18181b', '#232323', '#333'] : ['#f6f8fa', '#fff', '#f1f5f9']}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
      />

      {/* Sample Bet Preview */}
      <SampleBetPreview theme={theme} />

      {/* Top Sample Bet Preview */}
      <TopSampleBetPreview theme={theme} />

      {/* Middle Sample Bet Preview */}
      <MiddleSampleBetPreview theme={theme} />

      {/* Main Content */}
      <Animated.View 
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 32,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Logo and Tagline */}
        <View style={{ alignItems: 'center', marginBottom: 60 }}>
          {themeName === 'dark' ? (
           <>
           <Image 
              source={require('../assets/images/logo.png')}
              style={{
                width: 650,
                height: 255,
                resizeMode: 'contain',
                marginBottom: 2,
              }}
            />
            <Text>
              app
            </Text>
           </>
           
            
          ) : (
            <Text style={{ 
              fontSize: 36, 
              fontWeight: 'bold', 
              color: theme.text, 
              marginBottom: 2,
              letterSpacing: 1,
            }}>
              lets
              <Text
                style={{
                  color: '#22c55e',
                  fontWeight: 'bold',
                }}
              >
                bet
              </Text>
              .fun
            </Text>
            
          )}
        
          <Text style={{ 
            fontSize: 20, 
            color: theme.subtext, 
            textAlign: 'center',
            lineHeight: 24,
            fontWeight: '400',
            letterSpacing: 1.2,
            
            fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-medium',
          }}>

            your opinions are worth something
          </Text>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          style={{
            backgroundColor: theme.green,
            borderRadius: 16,
            paddingVertical: 18,
            paddingHorizontal: 48,
            borderWidth: 2,
            borderColor: '#000000',
            shadowColor: theme.green,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 12,
          }}
          onPress={openModal}
        >
          <Text style={{ 
            color: '#FFFFFF', 
            fontWeight: 'bold', 
            fontSize: 18,
            letterSpacing: 0.5,
          }}>
            Sign In
          </Text>
        </TouchableOpacity>

        {/* Error Message */}
        {error && (
          <Text style={{ 
            color: '#EF4444', 
            marginTop: 20, 
            fontSize: 14, 
            textAlign: 'center',
            paddingHorizontal: 20,
          }}>
            {error}
          </Text>
        )}

        {/* Terms */}
        <Text style={{ 
          color: theme.subtext, 
          fontSize: 12, 
          textAlign: 'center',
          marginTop: 40,
          paddingHorizontal: 20,
          lineHeight: 18,
        }}>
          By continuing, you agree to our{' '}
          <Text style={{ color: theme.green, textDecorationLine: 'underline' }}>
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text style={{ color: theme.green, textDecorationLine: 'underline' }}>
            Privacy Policy
          </Text>
        </Text>
      </Animated.View>

      {/* Bottom Drawer Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
          onPress={closeModal}
        />
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.modal,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 32,
            transform: [{ translateY: modalSlideAnim }],
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 20,
          }}
        >
          {/* Handle */}
          <View style={{
            width: 40,
            height: 4,
            backgroundColor: theme.subtext,
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: 24,
          }} />

          <Text style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: theme.text, 
            textAlign: 'center',
            marginBottom: 32,
          }}>
           sign in to takes
          </Text>

          {/* Login Options */}
          <View style={{ gap: 16 }}>
            {/* X (Twitter) Button with Shiny Glow and Yellow Border */}
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#000000',
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: theme.shadow,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                  overflow: 'visible',
                }}
                onPress={() => {
                  closeModal();
                  oauth.login({ provider: 'twitter' } as LoginWithOAuthInput);
                }}
                activeOpacity={0.85}
              >
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontWeight: '600', 
                  fontSize: 16,
                  letterSpacing: 0.5,
                }}>
                  Continue with X
                </Text>
                {/* The shiny glow and yellow border overlay */}
                <ShinyGlow />
              </TouchableOpacity>
            </View>

            {/* Separator */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginVertical: 4,
            }}>
              <View style={{
                flex: 1,
                height: 1,
                backgroundColor: theme.subtext,
                opacity: 0.2,
              }} />
              <Text style={{
                marginHorizontal: 12,
                color: theme.subtext,
                fontSize: 14,
                opacity: 0.7,
                fontWeight: '500',
                letterSpacing: 0.5,
              }}>
                or
              </Text>
              <View style={{
                flex: 1,
                height: 1,
                backgroundColor: theme.subtext,
                opacity: 0.2,
              }} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 24,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: theme.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={() => {
                closeModal();
                oauth.login({ provider: 'google' } as LoginWithOAuthInput);
              }}
            >
              <FontAwesome5 name="google" size={20} color="#4285F4" style={{ marginRight: 12 }} />
              <Text style={{ 
                color: '#000000', 
                fontWeight: '600', 
                fontSize: 16,
                letterSpacing: 0.5,
              }}>
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}