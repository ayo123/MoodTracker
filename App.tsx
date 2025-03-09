import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { MainStack } from './src/navigation/MainStack';
import { notificationService } from './src/services/notificationService';

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    // Check if notifications are enabled when app starts
    const checkNotifications = async () => {
      try {
        const notificationsEnabled = await notificationService.areNotificationsEnabled();
        console.log('Notifications enabled:', notificationsEnabled);
      } catch (error) {
        console.log('Error checking notifications:', error);
      }
    };
    
    checkNotifications();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <MainStack />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
} 