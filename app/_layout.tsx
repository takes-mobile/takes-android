import { Stack } from 'expo-router';
import BottomNav from '../components/BottomNav';
import { usePrivy, PrivyProvider } from '@privy-io/expo';
import Constants from 'expo-constants';

export default function Layout() {
  return (
    <PrivyProvider
      appId={Constants.expoConfig?.extra?.privyAppId}
      clientId={Constants.expoConfig?.extra?.privyClientId}
    >
      <LayoutWithNav />
    </PrivyProvider>
  );
}

function LayoutWithNav() {
  const { user } = usePrivy();
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="create-bet" options={{ title: 'Create Bet' }} />
        <Stack.Screen name="live-bets" options={{ title: 'Live Bets' }} />
      </Stack>
      {user && <BottomNav />}
    </>
  );
}
