import { Stack } from 'expo-router';
import BottomNav from '../components/BottomNav';
import { usePrivy, PrivyProvider } from '@privy-io/expo';
import Constants from 'expo-constants';
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

export default function Layout() {
  return (
    <PrivyProvider
      appId={Constants.expoConfig?.extra?.privyAppId}
      clientId={Constants.expoConfig?.extra?.privyClientId}
    >
      <ThemeProvider>
        <LayoutWithNav />
      </ThemeProvider>
    </PrivyProvider>
  );
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load saved theme preference
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('userTheme');
        if (savedTheme) {
          setTheme(savedTheme);
        } else {
          // Use system theme as default
          setTheme(systemColorScheme || 'light');
        }
      } catch (error) {
        console.log('Error loading theme:', error);
        setTheme(systemColorScheme || 'light');
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('userTheme', newTheme);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  if (!isLoaded) {
    // Return a loading state or the default theme
    return (
      <ThemeContext.Provider value={{ theme: systemColorScheme || 'light', toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function LayoutWithNav() {
  const { user } = usePrivy();
  const { theme: themeName } = useContext(ThemeContext);
  
  const lightTheme = {
    background: '#fff',
    text: '#000',
    border: '#e5e7eb',
  };
  
  const darkTheme = {
    background: '#18181b',
    text: '#fff',
    border: '#333',
  };
  
  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            color: theme.text,
          },
          headerShadowVisible: false,
          animation: 'fade',
          animationDuration: 50,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="create-bet" options={{ title: 'Create Bet' }} />
        <Stack.Screen name="live-bets" options={{ title: 'Live Bets' }} />
      </Stack>
      {user && <BottomNav />}
    </>
  );
}
