import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useContext } from 'react';
import { ThemeContext } from '../app/_layout';
import RetroButton from './RetroButton';

const { width: screenWidth } = Dimensions.get('window');

interface ThemedAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export const ThemedAlert: React.FC<ThemedAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
}) => {
  const { theme: themeName } = useContext(ThemeContext);

  const lightTheme = {
    background: '#fff',
    card: '#f6f8fa',
    text: '#222',
    subtext: '#444',
    border: '#e5e7eb',
    success: '#22c55e',
    error: '#EF4444',
    warning: '#F97316',
    info: '#3B82F6',
    shadow: '#000',
  };

  const darkTheme = {
    background: '#1e1a2c',
    card: '#2d2640',
    text: '#fff',
    subtext: '#c8b6e8',
    border: '#4a3f66',
    success: '#22c55e',
    error: '#EF4444',
    warning: '#F97316',
    info: '#3B82F6',
    shadow: '#130f1c',
  };

  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return theme.success;
      case 'error':
        return theme.error;
      case 'warning':
        return theme.warning;
      case 'info':
        return theme.info;
      default:
        return theme.info;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.alertContainer, { 
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: theme.shadow,
        }]}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${getTypeColor()}20` }]}>
            <MaterialIcons 
              name={getIcon() as any} 
              size={32} 
              color={getTypeColor()} 
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: theme.subtext }]}>
            {message}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {showCancel && (
              <RetroButton
                title={cancelText}
                backgroundColor={theme.subtext}
                textColor={theme.text}
                fontSize={12}
                letterSpacing={0}
                fontWeight="normal"
                minHeight={40}
                minWidth={100}
                textStyle={{ fontFamily: 'PressStart2P-Regular' }}
                onPress={onCancel || (() => {})}
              />
            )}
            
            <RetroButton
              title={confirmText}
              backgroundColor={getTypeColor()}
              textColor="#000000"
              fontSize={12}
              letterSpacing={0}
              fontWeight="normal"
              minHeight={40}
              minWidth={100}
              textStyle={{ fontFamily: 'PressStart2P-Regular' }}
              onPress={onConfirm || (() => {})}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    width: screenWidth - 40,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'PressStart2P-Regular',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  message: {
    fontSize: 14,
    fontFamily: 'PressStart2P-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
}); 