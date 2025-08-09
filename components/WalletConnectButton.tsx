import React from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '../components/ThemedText';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/Colors';
import RetroButton from './RetroButton';

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

// Define purple colors to use instead of blue
const PURPLE_PRIMARY = '#8b5cf6'; // A nice purple
const PURPLE_SECONDARY = '#a78bfa'; // Lighter purple
const PURPLE_OUTLINE = '#8b5cf6';

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

  // Map size prop to RetroButton props
  const retroButtonSizeProps = (() => {
    switch (size) {
      case 'small':
        return { fontSize: 12, minHeight: 36, minWidth: 120 };
      case 'large':
        return { fontSize: 16, minHeight: 56, minWidth: 240 };
      case 'medium':
      default:
        return { fontSize: 14, minHeight: 48, minWidth: 180 };
    }
  })();

  // Map variant to RetroButton background/text color, using purple instead of blue
  const getRetroButtonColors = () => {
    if (variant === 'outline') {
      return {
        backgroundColor: 'transparent',
        textColor: connected ? colors.success : PURPLE_OUTLINE,
        borderColor: connected ? colors.success : PURPLE_OUTLINE,
      };
    }
    if (variant === 'secondary') {
      return {
        backgroundColor: PURPLE_SECONDARY,
        textColor: 'white',
        borderColor: PURPLE_SECONDARY,
      };
    }
    // primary
    return {
      backgroundColor: connected ? colors.success : PURPLE_PRIMARY,
      textColor: 'black',
      borderColor: connected ? colors.success : PURPLE_PRIMARY,
    };
  };

  const getTextColor = () => {
    if (variant === 'outline') {
      return connected ? colors.success : PURPLE_OUTLINE;
    }
    if (variant === 'secondary') {
      return 'white';
    }
    return 'black';
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
      fontFamily: 'PressStart2P-Regular',
      textAlign: 'center' as const,
      flex: 1,
    };
  };

  const renderContent = () => {
    if (connecting) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator
            size="small"
            color={getTextColor()}
            style={{ marginRight: 8 }}
          />
          <ThemedText style={getTextStyle()}>
            Connecting...
          </ThemedText>
        </View>
      );
    }

    if (connected) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
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
                  fontSize: (getTextStyle().fontSize as number) - 2,
                  opacity: 0.8,
                  marginTop: 2,
                }}
              >
                {formatAddress(address)}
              </ThemedText>
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText style={getTextStyle()}>
          Connect Wallet
        </ThemedText>
      </View>
    );
  };

  const { backgroundColor, textColor, borderColor } = getRetroButtonColors();

  return (
    <RetroButton
      onPress={handlePress}
      backgroundColor={backgroundColor}
      textColor={textColor}
      fontSize={retroButtonSizeProps.fontSize}
      minHeight={retroButtonSizeProps.minHeight}
      minWidth={retroButtonSizeProps.minWidth}
      disabled={disabled || connecting}
      textStyle={getTextStyle()}
      style={{
        opacity: disabled ? 0.6 : 1,
        borderWidth: 1,
        borderColor: borderColor,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {renderContent()}
    </RetroButton>
  );
};
