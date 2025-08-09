import { View, TouchableOpacity } from 'react-native';
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
    active: '#22c55e',
    inactive: '#bbb',
  };
  
  const darkTheme = {
    background: '#2d2640', // Medium-dark purple background
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
        backgroundColor: themeName === 'dark' ? 'rgba(45, 38, 64, 0.95)' : theme.background, // Semi-transparent for dark mode
        borderRadius: 30,
        marginHorizontal: 18,
        borderWidth: 2,
        borderColor: theme.border,
        shadowColor: theme.shadow,
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 15,
        zIndex: 100,
        // Added subtle glow effect for dark mode
        ...(themeName === 'dark' ? {
          shadowColor: '#8b5cf6',
          shadowOpacity: 0.15,
          shadowRadius: 12,
        } : {})
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
          backgroundColor: pathname === '/create-bet' ? 
            themeName === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' : 
            'transparent'
        }} 
        onPress={() => router.push('/create-bet')}
      >
        <MaterialIcons 
          name="add-circle" 
          size={30} 
          color={pathname === '/create-bet' ? theme.active : theme.inactive} 
        />
      </TouchableOpacity>
      
      {/* Live bets button */}
      <TouchableOpacity 
        style={{ 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: pathname === '/live-bets' ? 
            themeName === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' : 
            'transparent'
        }} 
        onPress={() => router.push('/live-bets')}
      >
        <MaterialCommunityIcons 
          name="view-carousel" 
          size={28} 
          color={pathname === '/live-bets' ? theme.active : theme.inactive} 
        />
      </TouchableOpacity>
      
      {/* Profile button */}
      <TouchableOpacity 
        style={{ 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: pathname === '/' ? 
            themeName === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' : 
            'transparent'
        }} 
        onPress={() => router.push('/')}
      >
        <MaterialIcons 
          name="person" 
          size={28} 
          color={pathname === '/' ? theme.active : theme.inactive} 
        />
      </TouchableOpacity>
    </View>
  );
} 