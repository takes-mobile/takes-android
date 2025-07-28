import { View, Text } from 'react-native';
import { useContext } from 'react';
import { ThemeContext } from './_layout';

export default function LiveBetsScreen() {
  const { theme: themeName } = useContext(ThemeContext);
  
  const lightTheme = {
    background: '#f6f8fa',
    text: '#6c63ff',
  };
  
  const darkTheme = {
    background: '#18181b',
    text: '#6c63ff',
  };
  
  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, paddingBottom: 90 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.text }}>Live Bets</Text>
    </View>
  );
} 