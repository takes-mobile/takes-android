import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { RetroButton } from './RetroButton';

interface RetroPopupProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  onConfirm?: (() => void) | null;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  data?: any; // For displaying transaction data, balances, etc.
}

export const RetroPopup: React.FC<RetroPopupProps> = ({
  visible,
  title,
  message,
  type = 'info',
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
  data
}) => {
  const getTypeColors = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#1a1a1a',
          borderColor: '#22c55e',
          textColor: '#ffffff',
          accentColor: '#22c55e',
          icon: '✅'
        };
      case 'error':
        return {
          backgroundColor: '#1a1a1a',
          borderColor: '#ef4444',
          textColor: '#ffffff',
          accentColor: '#ef4444',
          icon: '❌'
        };
      case 'warning':
        return {
          backgroundColor: '#1a1a1a',
          borderColor: '#f59e0b',
          textColor: '#ffffff',
          accentColor: '#f59e0b',
          icon: '⚠️'
        };
      default:
        return {
          backgroundColor: '#1a1a1a',
          borderColor: '#3b82f6',
          textColor: '#ffffff',
          accentColor: '#3b82f6',
          icon: 'ℹ️'
        };
    }
  };

  const colors = getTypeColors();

  // Helper function to slice long text
  const sliceText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Helper function to format wallet addresses
  const formatAddress = (address: string) => {
    if (!address) return '';
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  // Helper function to format transaction signatures
  const formatSignature = (signature: string) => {
    if (!signature) return '';
    if (signature.length <= 12) return signature;
    return `${signature.slice(0, 6)}...${signature.slice(-6)}`;
  };

  const renderData = () => {
    if (!data) return null;

    if (data.signature) {
      return (
        <View style={styles.dataContainer}>
          <Text style={[styles.dataLabel, { color: colors.accentColor }]}>Tx:</Text>
          <Text style={[styles.dataValue, { color: colors.textColor }]}>{formatSignature(data.signature)}</Text>
        </View>
      );
    }

    if (data.publicKey) {
      return (
        <View style={styles.dataContainer}>
          <Text style={[styles.dataLabel, { color: colors.accentColor }]}>Wallet:</Text>
          <Text style={[styles.dataValue, { color: colors.textColor }]}>{formatAddress(data.publicKey)}</Text>
        </View>
      );
    }

    if (data.amount) {
      return (
        <View style={styles.dataContainer}>
          <Text style={[styles.dataLabel, { color: colors.accentColor }]}>Amount:</Text>
          <Text style={[styles.dataValue, { color: colors.textColor }]}>{sliceText(data.amount, 20)}</Text>
        </View>
      );
    }

    if (data.balance) {
      return (
        <View style={styles.dataContainer}>
          <Text style={[styles.dataLabel, { color: colors.accentColor }]}>Balance:</Text>
          <Text style={[styles.dataValue, { color: colors.textColor }]}>{sliceText(data.balance, 20)}</Text>
        </View>
      );
    }

    if (data.option) {
      return (
        <View style={styles.dataContainer}>
          <Text style={[styles.dataLabel, { color: colors.accentColor }]}>Option:</Text>
          <Text style={[styles.dataValue, { color: colors.textColor }]}>{sliceText(data.option, 25)}</Text>
        </View>
      );
    }

    if (data.winningOption) {
      return (
        <View style={styles.dataContainer}>
          <Text style={[styles.dataLabel, { color: colors.accentColor }]}>Winner:</Text>
          <Text style={[styles.dataValue, { color: colors.textColor }]}>{sliceText(data.winningOption, 25)}</Text>
        </View>
      );
    }

    if (data.tokenNames) {
      return (
        <View style={styles.dataContainer}>
          <Text style={[styles.dataLabel, { color: colors.accentColor }]}>Tokens:</Text>
          <Text style={[styles.dataValue, { color: colors.textColor }]}>{sliceText(data.tokenNames, 30)}</Text>
        </View>
      );
    }

    if (data.signatures) {
      return (
        <View style={styles.dataContainer}>
          <Text style={[styles.dataLabel, { color: colors.accentColor }]}>Txs:</Text>
          <Text style={[styles.dataValue, { color: colors.textColor }]}>{data.signatures.length} processed</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.popupContainer, { backgroundColor: colors.backgroundColor }]}>
          {/* Shadow layer */}
          <View style={styles.shadowLayer} />
          
          {/* Main popup content */}
          <View style={[styles.popupContent, { borderColor: colors.borderColor }]}>
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

            {/* Inner highlight and shadow */}
            <View style={styles.innerHighlightTop} />
            <View style={styles.innerHighlightLeft} />
            <View style={styles.innerShadowBottom} />
            <View style={styles.innerShadowRight} />

            {/* Content */}
            <View style={styles.content}>
              <Text style={[styles.icon, { color: colors.accentColor }]}>{colors.icon}</Text>
              <Text style={[styles.title, { color: colors.textColor }]}>{sliceText(title, 30)}</Text>
              <Text style={[styles.message, { color: colors.textColor }]}>{sliceText(message, 80)}</Text>
              
              {renderData()}

              <View style={styles.buttonContainer}>
                {showCancel && (
                  <View style={styles.buttonWrapper}>
                    <RetroButton
                      title={cancelText}
                      onPress={onClose}
                      backgroundColor="#333333"
                      textColor="#ffffff"
                      minWidth={80}
                      minHeight={36}
                      fontSize={12}
                    />
                  </View>
                )}
                <View style={styles.buttonWrapper}>
                  <RetroButton
                    title={confirmText}
                    onPress={() => {
                      if (onConfirm) {
                        onConfirm();
                      }
                      onClose();
                    }}
                    backgroundColor={colors.accentColor}
                    textColor="#ffffff"
                    minWidth={80}
                    minHeight={36}
                    fontSize={12}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    position: 'relative',
    margin: 20,
    maxWidth: Dimensions.get('window').width - 40,
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
  popupContent: {
    position: 'relative',
    padding: 16,
    borderWidth: 2,
    zIndex: 2,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  message: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
    fontFamily: 'monospace',
  },
  dataContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
    width: '100%',
  },
  dataLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  dataValue: {
    fontSize: 9,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonWrapper: {
    marginHorizontal: 4,
  },
  // Pixel corners
  pixelTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2,
    height: 2,
    backgroundColor: '#000000',
  },
  pixelTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 2,
    height: 2,
    backgroundColor: '#000000',
  },
  pixelBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 2,
    height: 2,
    backgroundColor: '#000000',
  },
  pixelBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 2,
    height: 2,
    backgroundColor: '#000000',
  },
  // Border lines
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 2,
    right: 2,
    height: 2,
    backgroundColor: '#000000',
  },
  borderRight: {
    position: 'absolute',
    top: 2,
    right: 0,
    bottom: 2,
    width: 2,
    backgroundColor: '#000000',
  },
  borderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 2,
    right: 2,
    height: 2,
    backgroundColor: '#000000',
  },
  borderLeft: {
    position: 'absolute',
    top: 2,
    left: 0,
    bottom: 2,
    width: 2,
    backgroundColor: '#000000',
  },
  // Inner effects
  innerHighlightTop: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  innerHighlightLeft: {
    position: 'absolute',
    top: 4,
    left: 2,
    bottom: 4,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  innerShadowBottom: {
    position: 'absolute',
    bottom: 2,
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  innerShadowRight: {
    position: 'absolute',
    top: 4,
    right: 2,
    bottom: 4,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});

export default RetroPopup; 