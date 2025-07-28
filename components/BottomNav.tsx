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
    background: '#232323',
    border: '#333',
    shadow: '#000',
    active: '#22c55e',
    inactive: '#666',
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
        paddingVertical: 14,
        backgroundColor: theme.background,
        borderRadius: 32,
        marginHorizontal: 18,
        borderWidth: 3,
        borderColor: theme.border,
        shadowColor: theme.shadow,
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
        elevation: 12,
        zIndex: 100,
      }}
    >
      {/* Plus button */}
      <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center' }} onPress={() => router.push('/create-bet')}>
        <MaterialIcons name="add-circle" size={34} color={pathname === '/create-bet' ? theme.active : theme.inactive} style={{ borderWidth: 2, borderColor: theme.border, borderRadius: 17, backgroundColor: theme.background }} />
      </TouchableOpacity>
      {/* Middle scroll/list button */}
      <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center' }} onPress={() => router.push('/live-bets')}>
        <MaterialCommunityIcons name="view-list" size={32} color={pathname === '/live-bets' ? theme.active : theme.inactive} style={{ borderWidth: 2, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.background }} />
      </TouchableOpacity>
      {/* Profile button (active if on user screen) */}
      <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center' }} onPress={() => router.push('/') }>
        <MaterialIcons name="person" size={32} color={pathname === '/' ? theme.active : theme.inactive} style={{ borderWidth: 2, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.background }} />
      </TouchableOpacity>
    </View>
  );
} 