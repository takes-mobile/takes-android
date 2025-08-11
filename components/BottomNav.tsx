import { View, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useContext } from 'react';
import { ThemeContext } from '../app/_layout';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme: themeName } = useContext(ThemeContext);
  
  const lightTheme = {
    background: '#fff',
    border: '#000',
    shadow: '#000',
    active: '#ffff',
    inactive: '#bbb',
  };
  
  const darkTheme = {
    background: '#ffff', // Medium-dark purple background
    border: '#4a3f66', // Medium purple border
    shadow: '#130f1c', // Very dark purple shadow
    active: '#8b5cf6', // Bright purple active
    inactive: '#8778b3', // Medium-light purple inactive
  };
  
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
        backgroundColor: themeName === 'dark' ? 'rgba(200, 182, 232, 0.8)' : 'rgba(255, 255, 255, 0.95)', // Light purple for dark, white with purple tint for light
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
      
      {/* Live bets button */}
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
      
      {/* Profile button */}
      <TouchableOpacity 
        style={{ 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: pathname === '/' ? 'rgba(92, 246, 125, 0.3)' : 'transparent',
          borderWidth: 0,
          borderColor: 'transparent',
          shadowColor: pathname === '/' ? '#8b5cf6' : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: pathname === '/' ? 1.0 : 0,
          shadowRadius: pathname === '/' ? 25 : 0,
          elevation: pathname === '/' ? 15 : 0,
        }} 
        onPress={() => router.push('/')}
      >
        <MaterialIcons 
          name="person-outline" 
          size={pathname === '/' ? 30 : 26} 
          color="#000" 
        />
        {pathname === '/' && (
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