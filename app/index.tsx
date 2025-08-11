import { SafeAreaView, Text, View } from "react-native";
import Constants from "expo-constants";
import LoginScreen from "@/components/LoginScreen";
import { usePrivy } from "@privy-io/expo";
import { UserScreen } from "@/components/UserScreen";
import { useContext } from "react";
import { ThemeContext } from "./_layout";
import { useWalletConnection } from "@/hooks/useWalletConnection";

export default function Index() {
  const { user } = usePrivy();
  const { connected: walletConnected } = useWalletConnection();
  const { theme: themeName } = useContext(ThemeContext);
  
  const lightTheme = {
    background: '#fff',
    text: '#000',
  };
  
  const darkTheme = {
    background: '#18181b',
    text: '#fff',
  };
  
  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  if ((Constants.expoConfig?.extra?.privyAppId as string).length !== 25) {
    return (
      <SafeAreaView style={{ backgroundColor: theme.background }}>
        <View
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.background,
          }}
        >
          <Text style={{ color: theme.text }}>You have not set a valid `privyAppId` in app.json</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (
    !(Constants.expoConfig?.extra?.privyClientId as string).startsWith(
      "client-"
    )
  ) {
    return (
      <SafeAreaView style={{ backgroundColor: theme.background }}>
        <View
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.background,
          }}
        >
          <Text style={{ color: theme.text }}>You have not set a valid `privyClientId` in app.json</Text>
        </View>
      </SafeAreaView>
    );
  }
  // Do not render wallet user screen here; redirect happens from LoginScreen
  return !user ? <LoginScreen /> : <UserScreen />;
}
