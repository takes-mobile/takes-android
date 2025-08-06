import { Stack } from 'expo-router';
import BottomNav from '../components/BottomNav';
import { usePrivy, PrivyProvider } from '@privy-io/expo';
import Constants from 'expo-constants';
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useFonts } from 'expo-font';
import { BetsProvider } from '../context/BetsContext';

export const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

export default function Layout() {
  const [fontsLoaded] = useFonts({
    'PressStart2P-Regular': require('../assets/fonts/PressStart2P-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null; // Return null or a loading screen while fonts are loading
  }

  return (
    <PrivyProvider
      appId="cmdfmgl76001qlh0mi0ggzx5l"
      clientId="client-WY6NvgKMnByoyauWRNvgPku7dBs3VtJeYxseJm48kDUtk"
    >
      <ThemeProvider>
        <BetsProvider>
          <LayoutWithNav />
        </BetsProvider>
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
    primary: '#8b5cf6', // Purple accent
    secondary: '#a78bfa', // Lighter purple
    accent: '#f3f4f6', // Light purple tint for backgrounds
  };
  
  const darkTheme = {
    background: '#1e1a2c', // Dark purple background
    text: '#fff',
    border: '#4a3f66', // Medium purple border
    primary: '#8b5cf6', // Purple accent
    secondary: '#a78bfa', // Lighter purple
    accent: '#2d2640', // Dark purple tint for backgrounds
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
        <Stack.Screen name="create-bet" options={{ headerShown: false }} />
        <Stack.Screen name="live-bets" options={{ headerShown: false }} />
      </Stack>
      {user && <BottomNav />}
      <Toast />
    </>
  );
}
