import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Storage keys
const NOTIFICATION_PERMISSION_KEY = 'notification_permission';
const MOOD_NOTIFICATION_ID_KEY = 'mood_notification_id';
const MEDICATION_NOTIFICATION_IDS_KEY = 'medication_notification_ids';

// Check if we're in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Configure how notifications appear when the app is in the foreground
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Mock notification service for Expo Go
export const notificationService = {
  // Request permission for notifications
  requestPermissions: async (): Promise<boolean> => {
    console.log('Mock: Requesting notifications permission');
    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'mock-granted');
    return true;
  },

  // Check if notifications are enabled
  areNotificationsEnabled: async (): Promise<boolean> => {
    const permission = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY);
    return permission === 'mock-granted';
  },

  // Schedule a daily mood reminder
  scheduleMoodReminder: async (hour: number, minute: number): Promise<string> => {
    console.log(`Mock: Scheduling mood reminder for ${hour}:${minute}`);
    const mockId = `mood-reminder-${Date.now()}`;
    await AsyncStorage.setItem(MOOD_NOTIFICATION_ID_KEY, mockId);
    return mockId;
  },

  // Cancel the daily mood reminder
  cancelMoodReminder: async (): Promise<void> => {
    console.log('Mock: Canceling mood reminder');
    await AsyncStorage.removeItem(MOOD_NOTIFICATION_ID_KEY);
  },

  // Schedule a medication reminder
  scheduleMedicationReminder: async (
    medicationId: number,
    medicationName: string,
    hour: number,
    minute: number,
    suffix: string = '1'
  ): Promise<string> => {
    console.log(`Mock: Scheduling medication reminder for ${medicationName} at ${hour}:${minute}`);
    const mockId = `medication-reminder-${medicationId}-${Date.now()}`;
    await notificationService.saveMedicationNotificationId(
      medicationId, 
      mockId,
      suffix
    );
    return mockId;
  },
  
  // Save medication notification IDs
  saveMedicationNotificationId: async (
    medicationId: number, 
    notificationId: string,
    suffix: string = '1'
  ): Promise<void> => {
    const idKey = `${medicationId}_${suffix}`;
    const existingIdsString = await AsyncStorage.getItem(MEDICATION_NOTIFICATION_IDS_KEY);
    const existingIds = existingIdsString ? JSON.parse(existingIdsString) : {};
    
    existingIds[idKey] = notificationId;
    await AsyncStorage.setItem(MEDICATION_NOTIFICATION_IDS_KEY, JSON.stringify(existingIds));
  },
  
  // Cancel a medication reminder
  cancelMedicationReminder: async (medicationId: number): Promise<void> => {
    console.log(`Mock: Canceling medication reminder for medication ID ${medicationId}`);
    const existingIdsString = await AsyncStorage.getItem(MEDICATION_NOTIFICATION_IDS_KEY);
    if (!existingIdsString) return;
    
    const existingIds = JSON.parse(existingIdsString);
    const idsToRemove = [];
    
    for (const key in existingIds) {
      if (key.startsWith(`${medicationId}_`)) {
        idsToRemove.push(key);
      }
    }
    
    idsToRemove.forEach(key => delete existingIds[key]);
    await AsyncStorage.setItem(MEDICATION_NOTIFICATION_IDS_KEY, JSON.stringify(existingIds));
  },
  
  // Cancel all notifications
  cancelAllNotifications: async (): Promise<void> => {
    console.log('Mock: Canceling all notifications');
    await AsyncStorage.removeItem(MOOD_NOTIFICATION_ID_KEY);
    await AsyncStorage.removeItem(MEDICATION_NOTIFICATION_IDS_KEY);
  },
  
  // Handle notification response (when user taps a notification)
  handleNotificationResponse: (response) => {
    console.log('Mock: Handling notification response', response);
  },
}; 