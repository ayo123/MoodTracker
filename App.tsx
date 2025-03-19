import React, { useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { setupMockApiForDev } from './src/services/mockApiMiddleware';

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const isAuthenticated = useAuthStore(state => !!state.token);
  
  // Set up mock API interceptors for dev mode
  useEffect(() => {
    if (__DEV__) {
      setupMockApiForDev();
    }
  }, []);
  
  // Force a refresh when auth state changes
  useEffect(() => {
    console.log("Authentication state in App.tsx:", isAuthenticated);
  }, [isAuthenticated]);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator isAuthenticated={isAuthenticated} />
    </SafeAreaProvider>
  );
} 