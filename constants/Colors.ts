/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#E1E5E9',
    cardBackground: '#F8F9FA',
    success: '#28A745',
    error: '#DC3545',
    warning: '#FFC107',
    primary: '#007AFF',
    secondary: '#6C757D',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#2C2C2E',
    cardBackground: '#1C1C1E',
    success: '#30D158',
    error: '#FF453A',
    warning: '#FFD60A',
    primary: '#0A84FF',
    secondary: '#8E8E93',
  },
};
