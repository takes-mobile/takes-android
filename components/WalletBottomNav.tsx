import { View, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useContext } from 'react';
import { ThemeContext } from '../app/_layout';

export default function WalletBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme: themeName } = useContext(ThemeContext);
  
  // Theme object is not directly used in styles for this nav; kept for parity
  const lightTheme = { background: '#fff' } as const;
  const darkTheme = { background: '#fff' } as const;
  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 16,
        backgroundColor: themeName === 'dark' ? 'rgba(200, 182, 232, 0.8)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: 30,
        marginHorizontal: 18,
        borderWidth: 4,
        borderColor: '#000',
        shadowColor: themeName === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(139, 92, 246, 0.15)',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 8,
        zIndex: 100,
      }}
    >
      {/* Create bet button */}
      <TouchableOpacity 
        style={{ 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: pathname === '/create-bet' ? 'rgba(92, 246, 138, 0.3)' : 'transparent',
          borderWidth: 0,
          borderColor: 'transparent',
          shadowColor: pathname === '/create-bet' ? '#8b5cf6' : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: pathname === '/create-bet' ? 1.0 : 0,
          shadowRadius: pathname === '/create-bet' ? 25 : 0,
          elevation: pathname === '/create-bet' ? 15 : 0,
        }} 
        onPress={() => router.push('/create-bet')}
      >
        <MaterialIcons 
          name="create" 
          size={pathname === '/create-bet' ? 32 : 28} 
          color="#000" 
        />
        {pathname === '/create-bet' && (
          <View style={{
            position: 'absolute',
            bottom: -5,
            width: 20,
            height: 2,
            backgroundColor: '#000',
            borderRadius: 1,
          }} />
        )}
      </TouchableOpacity>

      {/* Live bets center text button */}
      <TouchableOpacity 
        style={{ 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: pathname === '/live-bets' ? 'rgba(92, 246, 115, 0.3)' : 'transparent',
          borderWidth: 0,
          borderColor: 'transparent',
          shadowColor: pathname === '/live-bets' ? '#8b5cf6' : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: pathname === '/live-bets' ? 1.0 : 0,
          shadowRadius: pathname === '/live-bets' ? 25 : 0,
          elevation: pathname === '/live-bets' ? 15 : 0,
        }} 
        onPress={() => router.push('/live-bets')}
      >
        <Text style={{
          fontSize: pathname === '/live-bets' ? 20 : 18,
          fontWeight: 'bold',
          color: '#000',
          fontFamily: 'PressStart2P-Regular',
          textTransform: 'uppercase',
          textAlign: 'center',
          lineHeight: pathname === '/live-bets' ? 20 : 18
        }}>
          takes
        </Text>
        {pathname === '/live-bets' && (
          <View style={{
            position: 'absolute',
            bottom: -5,
            width: 20,
            height: 2,
            backgroundColor: '#000',
            borderRadius: 1,
          }} />
        )}
      </TouchableOpacity>

      {/* Wallet Profile button */}
      <TouchableOpacity 
        style={{ 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: pathname === '/wallet-user' ? 'rgba(92, 246, 125, 0.3)' : 'transparent',
          borderWidth: 0,
          borderColor: 'transparent',
          shadowColor: pathname === '/wallet-user' ? '#8b5cf6' : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: pathname === '/wallet-user' ? 1.0 : 0,
          shadowRadius: pathname === '/wallet-user' ? 25 : 0,
          elevation: pathname === '/wallet-user' ? 15 : 0,
        }} 
        onPress={() => router.push('/wallet-user')}
      >
        <MaterialIcons 
          name="person-outline" 
          size={pathname === '/wallet-user' ? 30 : 26} 
          color="#000" 
        />
        {pathname === '/wallet-user' && (
          <View style={{
            position: 'absolute',
            bottom: -5,
            width: 20,
            height: 2,
            backgroundColor: '#000',
            borderRadius: 1,
          }} />
        )}
      </TouchableOpacity>
    </View>
  );
} 