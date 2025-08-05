import React from 'react';
import { TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/Colors';

interface WalletConnectButtonProps {
  connected: boolean;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  address?: string | null;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  showAddress?: boolean;
  disabled?: boolean;
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
  connected,
  connecting,
  onConnect,
  onDisconnect,
  address,
  variant = 'primary',
  size = 'medium',
  showAddress = true,
  disabled = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const formatAddress = (addr: string, length: number = 4): string => {
    if (!addr || addr.length <= length * 2) return addr;
    return `${addr.slice(0, length)}...${addr.slice(-length)}`;
  };

  const handlePress = () => {
    if (disabled) return;
    
    if (connected) {
      Alert.alert(
        'Disconnect Wallet',
        'Are you sure you want to disconnect your wallet?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disconnect', style: 'destructive', onPress: onDisconnect },
        ]
      );
    } else {
      onConnect();
    }
  };

  const getButtonStyle = () => {
    const baseStyle = {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: 8,
      borderWidth: 1,
      opacity: disabled ? 0.6 : 1,
    };

    const sizeStyles = {
      small: { paddingVertical: 8, paddingHorizontal: 12 },
      medium: { paddingVertical: 12, paddingHorizontal: 16 },
      large: { paddingVertical: 16, paddingHorizontal: 20 },
    };

    const variantStyles = {
      primary: {
        backgroundColor: connected ? colors.success : colors.primary,
        borderColor: connected ? colors.success : colors.primary,
      },
      secondary: {
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: connected ? colors.success : colors.primary,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextColor = () => {
    if (variant === 'outline') {
      return connected ? colors.success : colors.primary;
    }
    return 'white';
  };

  const getIconSize = () => {
    const sizes = {
      small: 16,
      medium: 18,
      large: 20,
    };
    return sizes[size];
  };

  const getTextStyle = () => {
    const sizes = {
      small: { fontSize: 12, fontWeight: '600' as const },
      medium: { fontSize: 14, fontWeight: '600' as const },
      large: { fontSize: 16, fontWeight: '600' as const },
    };
    return {
      ...sizes[size],
      color: getTextColor(),
    };
  };

  const renderContent = () => {
    if (connecting) {
      return (
        <>
          <ActivityIndicator 
            size="small" 
            color={getTextColor()} 
            style={{ marginRight: 8 }} 
          />
          <ThemedText style={getTextStyle()}>
            Connecting...
          </ThemedText>
        </>
      );
    }

    if (connected) {
      return (
        <>
          <MaterialIcons 
            name="check-circle" 
            size={getIconSize()} 
            color={getTextColor()}
            style={{ marginRight: 8 }}
          />
          <View style={{ alignItems: 'center' }}>
            <ThemedText style={getTextStyle()}>
              Connected
            </ThemedText>
            {showAddress && address && (
              <ThemedText 
                style={{
                  ...getTextStyle(),
                  fontSize: getTextStyle().fontSize - 2,
                  opacity: 0.8,
                  marginTop: 2,
                }}
              >
                {formatAddress(address)}
              </ThemedText>
            )}
          </View>
        </>
      );
    }

    return (
      <>
        <MaterialIcons 
          name="account-balance-wallet" 
          size={getIconSize()} 
          color={getTextColor()}
          style={{ marginRight: 8 }}
        />
        <ThemedText style={getTextStyle()}>
          Connect Wallet
        </ThemedText>
      </>
    );
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handlePress}
      disabled={disabled || connecting}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};
