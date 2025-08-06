import React, { useState, useEffect } from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Audio } from 'expo-av';

interface RetroButtonProps {
  title?: string;
  text?: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  letterSpacing?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  minHeight?: number;
  minWidth?: number;
  children?: React.ReactNode;
  textShadowColor?: string;
  textShadowOffset?: { width: number; height: number };
  textShadowRadius?: number;
}

export const RetroButton: React.FC<RetroButtonProps> = ({
  title,
  text,
  onPress,
  style,
  textStyle,
  disabled = false,
  backgroundColor = '#7BC67B',
  textColor = '#000000',
  fontSize = 16,
  letterSpacing = 0,
  fontWeight = 'bold',
  minHeight = 50,
  minWidth = 200,
  children,
  textShadowColor = '#fff',
  textShadowOffset = { width: 1, height: 1 },
  textShadowRadius = 0,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const buttonText = title || text || '';

  // Load sound on component mount
  useEffect(() => {
    let mounted = true;
    
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/audios/sound.mp4')
        );
        if (mounted) {
          setSound(sound);
        }
      } catch (error) {
        console.log('Error loading sound:', error);
      }
    };

    loadSound();

    // Cleanup sound on unmount
    return () => {
      mounted = false;
      if (sound) {
        sound.unloadAsync().catch(console.error);
      }
    };
  }, []);

  const playSound = async () => {
    try {
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const handlePressIn = () => setIsPressed(true);
  const handlePressOut = () => setIsPressed(false);
  const handlePress = async () => {
    if (!disabled) {
      await playSound();
      onPress();
    }
  };

  return (
    <View style={[styles.buttonContainer, style]}>
      {!isPressed && <View style={styles.shadowLayer} />}

      <Pressable
        style={[
          styles.button,
          {
            backgroundColor: disabled ? '#CCCCCC' : backgroundColor,
            minWidth,
            minHeight,
            transform: isPressed ? [{ translateX: 4 }, { translateY: 4 }] : [],
          }
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        {/* Highlight edge (top and left) */}
        <View style={[styles.highlightEdge]} />

        {/* Shadow edge (bottom and right) */}
        <View style={[styles.shadowEdge]} />

        {/* Pixel corners */}
        <View style={styles.pixelTopLeft} />
        <View style={styles.pixelTopRight} />
        <View style={styles.pixelBottomLeft} />
        <View style={styles.pixelBottomRight} />

        {/* Border lines */}
        <View style={styles.borderTop} />
        <View style={styles.borderRight} />
        <View style={styles.borderBottom} />
        <View style={styles.borderLeft} />

        {/* Inner highlight for 3D effect */}
        <View style={styles.innerHighlightTop} />
        <View style={styles.innerHighlightLeft} />

        {/* Inner shadow for 3D effect */}
        <View style={styles.innerShadowBottom} />
        <View style={styles.innerShadowRight} />

        {/* Button text with pixel-perfect shadow */}
        <Text style={[
          styles.buttonText,
          {
            color: textColor,
            fontSize,
            letterSpacing,
            fontWeight,
            textShadowColor,
            textShadowOffset,
            textShadowRadius,
          },
          textStyle
        ]}>
          {buttonText}
        </Text>

        {children}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'relative',
    margin: 4,
  },
  shadowLayer: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: '#000000',
    zIndex: 1
  },
  button: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    zIndex: 2,
    overflow: 'hidden',
  },
  buttonText: {
    fontFamily: 'monospace',
    textAlign: 'center',
    zIndex: 10,
  },
  pixelTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 3,
    height: 3,
    backgroundColor: '#000000',
  },
  pixelTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 3,
    height: 3,
    backgroundColor: '#000000',
  },
  pixelBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 3,
    height: 3,
    backgroundColor: '#000000',
  },
  pixelBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 3,
    height: 3,
    backgroundColor: '#000000',
  },
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 3,
    right: 3,
    height: 3,
    backgroundColor: '#000000',
  },
  borderRight: {
    position: 'absolute',
    top: 3,
    right: 0,
    bottom: 3,
    width: 3,
    backgroundColor: '#000000',
  },
  borderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 3,
    right: 3,
    height: 3,
    backgroundColor: '#000000',
  },
  borderLeft: {
    position: 'absolute',
    top: 3,
    left: 0,
    bottom: 3,
    width: 3,
    backgroundColor: '#000000',
  },
  highlightEdge: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  shadowEdge: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(0,0,0,0.25)',
  },
  innerHighlightTop: {
    position: 'absolute',
    top: 3,
    left: 5,
    right: 5,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  innerHighlightLeft: {
    position: 'absolute',
    top: 5,
    left: 3,
    bottom: 5,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  innerShadowBottom: {
    position: 'absolute',
    bottom: 3,
    left: 5,
    right: 5,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  innerShadowRight: {
    position: 'absolute',
    top: 5,
    right: 3,
    bottom: 5,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
});

export default RetroButton; 