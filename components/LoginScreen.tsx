import { Text, View, Modal, Pressable, Platform, Animated, Dimensions, StyleSheet, Image, TouchableOpacity } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { LoginWithOAuthInput, useLoginWithOAuth } from "@privy-io/expo";
import { useLogin } from "@privy-io/expo/ui";
import { useLoginWithPasskey } from "@privy-io/expo/passkey";

import { useState, useContext, useEffect, useRef } from "react";

import { ThemeContext } from '../app/_layout';
import { LinearGradient } from 'expo-linear-gradient';
import RetroButton from './RetroButton';

// Simple Glow Button component
const PulsatingGlowButton = ({ 
  title, 
  onPress, 
  backgroundColor = "#4ed620", 
  glowColor = "#4ed620" 
}: { 
  title: string; 
  onPress: () => void;
  backgroundColor?: string;
  glowColor?: string;
}) => {
  return (
    <View style={{ 
      position: 'relative',
      shadowColor: 'black',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    }}>
      <RetroButton
        title={title}
        onPress={onPress}
        backgroundColor={backgroundColor}
        textColor="#000"
        fontSize={14}
        letterSpacing={0}
        fontWeight="normal"
        minHeight={56}
        minWidth={240}
        textShadowColor="#ccc"
        textStyle={{ fontFamily: 'PressStart2P-Regular' }}
      />
    </View>
  );
}; 

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
        borderColor: 'rgba(255,255,255,1)', // changed from black to white
      }}>
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
          "What is the meaning of life?"
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: theme.subtext, fontSize: 12 }}>Love: 42%</Text>
          <Text style={{ color: theme.subtext, fontSize: 12 }}>Purpose: 58%</Text>
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
        <Text style={{ 
          color: theme.text, 
          fontSize: 14, 
          fontWeight: '600', 
          marginBottom: 8,
          fontFamily: 'System',
          letterSpacing: 0.5,
        }}>
          "Is pineapple on pizza acceptable?"
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ 
            color: theme.subtext, 
            fontSize: 12,
            fontFamily: 'System',
            fontWeight: '500',
          }}>Yes: 48%</Text>
          <Text style={{ 
            color: theme.subtext, 
            fontSize: 12,
            fontFamily: 'System',
            fontWeight: '500',
          }}>No: 52%</Text>
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
          "Should cats be allowed to vote?"
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: theme.subtext, fontSize: 11 }}>Yes: 67%</Text>
          <Text style={{ color: theme.subtext, fontSize: 11 }}>No: 33%</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ShinyGlow component for buttons with glowing effect
const ShinyGlow = ({ color = '#FFD700', intensity = 'normal' }) => {
  const shineAnim = useRef(new Animated.Value(-1)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;
  
  // Add pulsating glow effect along with the shine
  useEffect(() => {
    // Shine animation
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
    
    // Pulsating glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // On Android, show a simplified but still animated glow effect
  if (Platform.OS === 'android') {
    return (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          borderRadius: 18,
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        {/* Animated yellow glowing border for Android */}
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            borderRadius: 18,
            borderWidth: 3,
            // No borderColor here, but if you add one, use white
          }}
        />
        {/* Enhanced glow for Android */}
        <LinearGradient
          colors={['rgba(255,255,180,0.25)', 'rgba(255,255,180,0.1)', 'rgba(255,255,180,0)']}
          style={{
            ...StyleSheet.absoluteFillObject,
            borderRadius: 10,
          }}
        />
      </View>
    );
  }

  // iOS: keep animated effect
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: 10,
        overflow: 'hidden',
        zIndex: 2,
      }}
    >
      {/* Animated yellow glowing border */}
      <Animated.View
        style={{
          
          borderRadius: 18,
          borderWidth: 2,
          // No borderColor here, but if you add one, use white
          shadowColor: '#FFD700',
          shadowOffset: { width: 0, height: 0 },
         
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
          opacity: 0.8,
        }}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,180,0.4)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            width: 60,
            height: '150%',
            borderRadius: 20,
          }}
        />
      </Animated.View>
      {/* Outer subtle glow */}
      <LinearGradient
        colors={['rgba(255,255,180,0.12)', 'rgba(255,255,180,0.03)', 'rgba(255,255,180,0)']}
        style={{
          ...StyleSheet.absoluteFillObject,
          borderRadius: 18,
        }}
      />
    </View>
  );
};

export default function LoginScreen() {
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { theme: themeName, toggleTheme } = useContext(ThemeContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const modalSlideAnim = useRef(new Animated.Value(screenHeight)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  
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
    background: '#1e1a2c', // Dark purple background
    card: '#2d2640', // Medium-dark purple card
    text: '#fff',
    subtext: '#c8b6e8', // Light purple subtext
    border: '#4a3f66', // Medium purple border
    green: '#22c55e',
    shadow: '#130f1c', // Very dark purple shadow
    input: '#352d4d', // Medium-dark purple input
    modal: '#2d2640', // Same as card color
    placeholder: '#8778b3', // Medium-light purple placeholder
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
    // Reset animation values
    modalSlideAnim.setValue(screenHeight);
    modalOpacityAnim.setValue(0);
    setShowModal(true);
    
    // Use a longer delay to ensure modal is fully rendered
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(modalSlideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, 100);
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalSlideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowModal(false);
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Theme toggle button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 40,
          right: 20,
          zIndex: 100,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: themeName === 'dark' ? '#4ed620' : '#333',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: themeName === 'dark' ? '#4ed620' : '#000',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 5,
        }}
        onPress={toggleTheme}
      >
        <MaterialIcons 
          name={themeName === 'dark' ? 'light-mode' : 'dark-mode'} 
          size={24} 
          color={themeName === 'dark' ? '#fff' : '#000'} 
        />
      </TouchableOpacity>
      
      {/* Background Gradient */}
      <LinearGradient
        colors={themeName === 'dark' ? ['#1e1a2c', '#2d2640', '#352d4d'] : ['#f6f8fa', '#fff', '#f1f5f9']}
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
          <View style={{
            shadowColor: themeName === 'dark' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.3)',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: themeName === 'dark' ? 0.6 : 0.4,
            shadowRadius: 20,
            elevation: 15,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
            overflow: 'hidden',
          }}>
            <Image 
              source={require('../assets/images/mainlogo.png')}
              style={{
                width: 400,
                height: 150,
                resizeMode: 'contain',
                marginBottom: 2,
                transform: [{ rotate: '0deg' }],
              }}
            />
          </View>
        
                              <View style={{ alignItems: 'center', marginTop: 10 }}>
            <Text style={{ 
                fontSize: 14, 
                color: 'rgba(255,255,255,0.5)', 
                textAlign: 'center',
                lineHeight: 18,
                fontWeight: 'normal',
                fontFamily: 'PressStart2P-Regular',
              }}>
              YOUR OPINIONS ARE
            </Text>
            <Text style={{ 
                fontSize: 14, 
                color: 'rgba(255,255,255,0.5)', 
                textAlign: 'center',
                lineHeight: 18,
                fontWeight: 'normal',
                fontFamily: 'PressStart2P-Regular',
                marginTop: 10,
              }}>
              WORTH SOMETHING
            </Text>
          </View>
        </View>

        {/* Sign In Button */}
        {/* What's your take button with pulsating background glow effect */}
        <PulsatingGlowButton 
          onPress={openModal}
          title="WHAT'S YOUR TAKE ??"
          backgroundColor="#4ed620"
          glowColor="#4ed620"
        />

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

        {/* Terms moved to modal below */}
      </Animated.View>

      {/* Bottom Drawer Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="none"
        onRequestClose={closeModal}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: modalOpacityAnim,
          }}
        >
          <Pressable
            style={{
              flex: 1,
            }}
            onPress={closeModal}
          />
        </Animated.View>
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
            opacity: modalOpacityAnim,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 20,
            // Ensure the modal is properly positioned from the start
            zIndex: 1000,
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
          
          </Text>

          {/* Login Options */}
          <View style={{ gap: 16 }}>
            {/* X (Twitter) Button with Shiny Glow and Yellow Border */}
           <View style={{  alignItems: 'center' }}>
              {/* Yellow small text above the button */}
              <Text
                style={{
                  color: themeName === 'dark' ? '#FFEB3B' : '#db9d04',
                  fontSize: 14,
                  fontWeight: '600',
                  marginBottom: 4,
                  
                  letterSpacing: 0.2,
                  
                }}
              >
                earn fees with this
              </Text>
            
              <View style={{  }}>
              
                <RetroButton
                  title="Continue with X"
                  backgroundColor="#333"
                  textColor="white"
                  fontSize={12}
                  letterSpacing={0}
                  fontWeight="normal"
                  textShadowColor="white"
                  minHeight={56}
                  minWidth={200}
                  textStyle={{ 
                    fontFamily: 'PressStart2P-Regular',
                    textAlign: 'center',
                    width: '100%'
                  }}
                  onPress={() => {
                    closeModal();
                    oauth.login({ provider: 'twitter' } as LoginWithOAuthInput);
                  }}
                />
                {/* The shiny moving effect remains, static yellow glow removed */}
                <ShinyGlow />
              </View>
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
            <RetroButton
              title="Connect Wallet"
              backgroundColor="#a259f7"
              textColor="#fff"
              textShadowColor="#000"
              fontSize={12}
              letterSpacing={0}
              fontWeight="normal"
              minHeight={56}
              minWidth={200}
              textStyle={{ fontFamily: 'PressStart2P-Regular' }}
              onPress={() => {
                closeModal();
                oauth.login({ provider: 'google' } as LoginWithOAuthInput);
              }}
            >
              
            </RetroButton>
          </View>

          {/* Terms of Service and Privacy Policy moved here */}
          <Text style={{ 
            color: theme.subtext, 
            fontSize: 12, 
            textAlign: 'center',
            marginTop: 32,
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
      </Modal>
    </View>
  );
}