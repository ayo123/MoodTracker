import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, Redirect, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useAuthStore } from '../src/store/authStore';
import { ActivityIndicator, View } from 'react-native';
import { NavigationIndependentTree } from '@react-navigation/native';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  // Return null to completely disable Expo Router
  return null;
  
  // Or wrap with NavigationIndependentTree if you want to keep Expo Router active but separate
  // return (
  //   <NavigationIndependentTree>
  //     <Slot />
  //   </NavigationIndependentTree>
  // );
}
