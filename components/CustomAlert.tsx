import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  type = 'info'
}) => {
  console.log('CustomAlert props:', { visible, title, message, type });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const theme = {
    background: '#1e1a2c',
    card: 'rgba(200,182,232,0.1)',
    text: '#FFFFFF',
    subtext: '#c8b6e8',
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    success: '#10B981',
    warning: '#EF4444',
    orange: '#F97316',
    pink: '#EC4899',
    green: '#29d620',
  };

  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return theme.green;
      case 'error':
        return theme.warning;
      case 'warning':
        return theme.orange;
      default:
        return theme.primary;
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent={true}
    >
                      <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: fadeAnim,
          }}
        >
          <Animated.View
          style={{
            backgroundColor: theme.card,
            borderRadius: 16,
            padding: 24,
            margin: 20,
            width: screenWidth - 40,
            maxWidth: 400,
            borderWidth: 2,
            borderColor: getTypeColor(),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 10,
            transform: [{ scale: scaleAnim }],
          }}
        >
          {/* Icon */}
          <View style={{
            alignSelf: 'center',
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: getTypeColor() + '20',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
            borderWidth: 2,
            borderColor: getTypeColor(),
          }}>
            <Text style={{
              fontSize: 24,
              color: getTypeColor(),
              fontWeight: 'bold',
            }}>
              {getTypeIcon()}
            </Text>
          </View>

          {/* Title */}
          <Text style={{
            fontSize: 18,
            fontFamily: 'PressStart2P-Regular',
            color: theme.text,
            textAlign: 'center',
            marginBottom: 12,
            textTransform: 'uppercase',
            fontWeight: 'bold',
          }}>
            {title}
          </Text>

          {/* Message */}
          <Text style={{
            fontSize: 14,
            fontFamily: 'PressStart2P-Regular',
            color: theme.subtext,
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 20,
          }}>
            {message}
          </Text>

          {/* Buttons */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 12,
          }}>
            {onCancel && (
              <TouchableOpacity
                onPress={onCancel}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: theme.subtext,
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontFamily: 'PressStart2P-Regular',
                  color: theme.text,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                }}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={onConfirm}
              style={{
                flex: 1,
                backgroundColor: getTypeColor(),
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: getTypeColor(),
              }}
            >
              <Text style={{
                fontSize: 12,
                fontFamily: 'PressStart2P-Regular',
                color: '#FFFFFF',
                textAlign: 'center',
                textTransform: 'uppercase',
                fontWeight: 'bold',
              }}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        </Animated.View>
      </Modal>
    );
  }; 