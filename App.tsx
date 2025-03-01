import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { MainStack } from './src/navigation/MainStack';
import { notificationService } from './src/services/notificationService';

// Check if we're in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

export default function App() {
  const navigationRef = useRef(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Skip notification setup in Expo Go
    if (isExpoGo) {
      console.log('Full notification support requires a development build');
      return;
    }
    
    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received!', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Handle the notification tap based on the notification type
      if (data.type === 'mood_reminder') {
        navigationRef.current?.navigate('HomeTab', {
          screen: 'AddMood'
        });
      } else if (data.type === 'medication_reminder') {
        navigationRef.current?.navigate('HomeTab', {
          screen: 'ManageMedications'
        });
      }
    });

    // Clean up the listeners on unmount
    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <MainStack />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
} 