import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Clipboard,
  Share,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/Colors';
import * as walletSession from '../utils/walletSession';

export default function WalletStatusPage() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  
  const {
    connected,
    connecting,
    publicKey,
    address,
    error,
    disconnectWallet,
    formatAddress,
  } = useWalletConnection();

  useEffect(() => {
    // Load session info
    loadSessionInfo();
  }, [connected, address]);

  const loadSessionInfo = async () => {
    try {
      const session = await walletSession.getWalletSession();
      setSessionInfo(session);
    } catch (error) {
      console.error('Error loading session info:', error);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(text);
        Alert.alert('Copied!', `${label} copied to clipboard`);
      } catch (error) {
        Alert.alert('Error', 'Failed to copy to clipboard');
      }
    } else {
      Clipboard.setString(text);
      Alert.alert('Copied!', `${label} copied to clipboard`);
    }
  };

  const shareAddress = async () => {
    if (!address) return;
    
    try {
      await Share.share({
        message: `My Solana Wallet Address: ${address}`,
        title: 'Solana Wallet Address',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive', 
          onPress: async () => {
            await disconnectWallet();
            router.push('/');
          }
        },
      ]
    );
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!connected && !connecting) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#1e1a2c', '#2d2640'] : ['#f6f8fa', '#fff']}
          style={styles.gradient}
        />
        
        <View style={styles.centerContent}>
          <MaterialIcons name="account-balance-wallet" size={64} color={colors.icon} />
          <Text style={[styles.title, { color: colors.text }]}>
            No Wallet Connected
          </Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Please connect your wallet to continue
          </Text>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/')}
          >
            <Text style={styles.buttonText}>Go Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (connecting) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#1e1a2c', '#2d2640'] : ['#f6f8fa', '#fff']}
          style={styles.gradient}
        />
        
        <View style={styles.centerContent}>
          <MaterialIcons name="sync" size={64} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Connecting Wallet...
          </Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Please approve the connection in your wallet app
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#1e1a2c', '#2d2640'] : ['#f6f8fa', '#fff']}
          style={styles.gradient}
        />
        
        <View style={styles.centerContent}>
          <MaterialIcons name="error-outline" size={64} color={colors.error} />
          <Text style={[styles.title, { color: colors.text }]}>
            Connection Error
          </Text>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/')}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colorScheme === 'dark' ? ['#1e1a2c', '#2d2640'] : ['#f6f8fa', '#fff']}
        style={styles.gradient}
      />
      
      {/* Header */}
      <View style={[styles.header, { 
        borderBottomColor: colors.border,
        backgroundColor: `${colors.cardBackground}95`,
        backdropFilter: 'blur(10px)',
      }]}>
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: `${colors.background}80` }]}
          onPress={() => router.push('/')}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <MaterialIcons name="check-circle" size={18} color={colors.success} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Wallet Connected
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: `${colors.error}15` }]}
          onPress={handleDisconnect}
        >
          <MaterialIcons name="logout" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Status */}
        <View style={[styles.statusCard, { 
          backgroundColor: colors.cardBackground, 
          borderColor: colors.success,
          shadowColor: colors.success,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.successIconContainer, { backgroundColor: `${colors.success}20` }]}>
              <MaterialIcons name="check-circle" size={28} color={colors.success} />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                Wallet Connected
              </Text>
              <Text style={[styles.statusSubtitle, { color: colors.icon }]}>
                Ready to use Takes App
              </Text>
            </View>
          </View>
        </View>

        {/* Wallet Information */}
        <View style={[styles.infoCard, { 
          backgroundColor: colors.cardBackground, 
          borderColor: colors.border,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="account-balance-wallet" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Wallet Details
            </Text>
          </View>
          
          {/* Public Address */}
          <View style={[styles.addressCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.addressHeader}>
              <Text style={[styles.addressLabel, { color: colors.icon }]}>
                Wallet Address
              </Text>
              <View style={styles.addressActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={() => copyToClipboard(address || '', 'Address')}
                >
                  <MaterialIcons name="content-copy" size={14} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.icon }]}
                  onPress={shareAddress}
                >
                  <MaterialIcons name="share" size={14} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.addressText, { color: colors.text }]}>
              {address}
            </Text>
          </View>

          {/* Formatted Address */}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>
              Short Address:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text, fontFamily: 'monospace' }]}>
              {formatAddress(6)}
            </Text>
          </View>

          {/* Network Badge */}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>
              Network:
            </Text>
            <View style={[styles.networkBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.networkText}>Mainnet</Text>
            </View>
          </View>
        </View>

        {/* Session Information */}
        {sessionInfo && (
          <View style={[styles.infoCard, { 
            backgroundColor: colors.cardBackground, 
            borderColor: colors.border,
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }]}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="schedule" size={20} color={colors.icon} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Session Info
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>
                Connected:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatTimestamp(sessionInfo.timestamp)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>
                Status:
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: `${colors.success}20` }]}>
                <MaterialIcons name="check-circle" size={14} color={colors.success} />
                <Text style={[styles.statusBadgeText, { color: colors.success }]}>
                  Active
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.primaryButton, { 
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }]}
            onPress={() => {
              router.push('/');
              Alert.alert('Ready!', 'Your wallet is connected and ready to use.');
            }}
          >
            <MaterialIcons name="rocket-launch" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Start Using App</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.secondaryButton, { 
              borderColor: colors.error,
              backgroundColor: `${colors.error}10`,
            }]}
            onPress={handleDisconnect}
          >
            <MaterialIcons name="logout" size={18} color={colors.error} />
            <Text style={[styles.secondaryButtonText, { color: colors.error }]}>
              Disconnect
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.securityBadge}>
            <MaterialIcons name="security" size={16} color={colors.success} />
            <Text style={[styles.footerText, { color: colors.icon }]}>
              Your private keys are never stored or shared
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusSubtitle: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.8,
  },
  infoCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addressCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '400',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressText: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
    flex: 1,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    padding: 6,
    borderRadius: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  networkBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  networkText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionSection: {
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 32,
    marginBottom: 24,
    paddingTop: 20,
    alignItems: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.8,
  },
});
