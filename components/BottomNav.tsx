import { View, TouchableOpacity } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
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
        backgroundColor: '#fff',
        borderRadius: 32,
        marginHorizontal: 18,
        borderWidth: 3,
        borderColor: '#000',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
        elevation: 12,
        zIndex: 100,
      }}
    >
      {/* Plus button */}
      <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center' }} onPress={() => router.push('/create-bet')}>
        <MaterialIcons name="add-circle" size={34} color={pathname === '/create-bet' ? '#6c63ff' : '#bbb'} style={{ borderWidth: 2, borderColor: '#000', borderRadius: 17, backgroundColor: '#fff' }} />
      </TouchableOpacity>
      {/* Middle scroll/list button */}
      <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center' }} onPress={() => router.push('/live-bets')}>
        <MaterialCommunityIcons name="view-list" size={32} color={pathname === '/live-bets' ? '#6c63ff' : '#bbb'} style={{ borderWidth: 2, borderColor: '#000', borderRadius: 16, backgroundColor: '#fff' }} />
      </TouchableOpacity>
      {/* Profile button (active if on user screen) */}
      <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center' }} onPress={() => router.push('/') }>
        <MaterialIcons name="person" size={32} color={pathname === '/' ? '#6c63ff' : '#bbb'} style={{ borderWidth: 2, borderColor: '#000', borderRadius: 16, backgroundColor: '#fff' }} />
      </TouchableOpacity>
    </View>
  );
} 