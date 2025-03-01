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

export const notificationService = {
  // Request permission for notifications
  requestPermissions: async (): Promise<boolean> => {
    if (isExpoGo) {
      console.log('Notifications have limited functionality in Expo Go');
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'limited');
      return true; // Return true to allow the app flow to continue
    }
    
    if (!Device.isDevice) {
      console.log('Notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get notification permission');
      return false;
    }

    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
    return true;
  },

  // Check if notifications are enabled
  areNotificationsEnabled: async (): Promise<boolean> => {
    if (isExpoGo) {
      const limited = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY) === 'limited';
      return limited;
    }
    
    const permission = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY);
    return permission === 'granted';
  },

  // Schedule a daily mood reminder
  scheduleMoodReminder: async (hour: number, minute: number): Promise<string> => {
    if (isExpoGo) {
      console.log('Scheduling mood reminder (simulated in Expo Go)');
      const mockId = `mood-reminder-${Date.now()}`;
      await AsyncStorage.setItem(MOOD_NOTIFICATION_ID_KEY, mockId);
      return mockId;
    }
    
    // Cancel any existing mood reminders
    await notificationService.cancelMoodReminder();

    // Schedule the new reminder
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📝 Time to track your mood',
        body: 'How are you feeling today? Take a moment to record your mood.',
        data: { type: 'mood_reminder' },
      },
      trigger: {
        hour: hour,
        minute: minute,
        repeats: true,
      },
    });

    // Save the identifier for later cancellation if needed
    await AsyncStorage.setItem(MOOD_NOTIFICATION_ID_KEY, identifier);
    return identifier;
  },

  // Cancel the daily mood reminder
  cancelMoodReminder: async (): Promise<void> => {
    const id = await AsyncStorage.getItem(MOOD_NOTIFICATION_ID_KEY);
    if (!id) return;
    
    if (!isExpoGo) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
    
    await AsyncStorage.removeItem(MOOD_NOTIFICATION_ID_KEY);
  },

  // Schedule a medication reminder
  scheduleMedicationReminder: async (
    medicationId: number,
    medicationName: string,
    time: string,
    frequency: string
  ): Promise<string> => {
    // Parse the time string (assuming format like "9:00 AM")
    const [timeString, period] = time.split(' ');
    let [hourStr, minuteStr] = timeString.split(':');
    
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    
    // Convert to 24-hour format if needed
    if (period && period.toUpperCase() === 'PM' && hour < 12) {
      hour += 12;
    } else if (period && period.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }
    
    // Create the trigger based on frequency
    let trigger: any = { hour, minute, repeats: true };
    
    if (frequency === 'Once daily') {
      // Daily at specified time
      // trigger is already set correctly
    } else if (frequency === 'Twice daily') {
      // For twice daily, we'll need two separate notifications
      // This is the first one, we'll schedule another one 12 hours later
      const secondHour = (hour + 12) % 24;
      await notificationService.scheduleAdditionalMedicationReminder(
        medicationId,
        medicationName,
        secondHour,
        minute,
        '2'
      );
    } else if (frequency.includes('hours')) {
      // For frequencies like "Every 8 hours"
      // We'll handle this differently - might need multiple notifications
      console.log('Custom hour frequency not fully implemented');
    }
    
    // Schedule the notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Medication Reminder',
        body: `Time to take your ${medicationName}`,
        data: { type: 'medication_reminder', medicationId },
      },
      trigger,
    });
    
    // Save the identifier
    await notificationService.saveMedicationNotificationId(medicationId, identifier);
    return identifier;
  },
  
  // Helper to schedule additional medication reminders for multiple daily doses
  scheduleAdditionalMedicationReminder: async (
    medicationId: number,
    medicationName: string,
    hour: number,
    minute: number,
    suffix: string
  ): Promise<string> => {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Medication Reminder',
        body: `Time to take your ${medicationName}`,
        data: { type: 'medication_reminder', medicationId, suffix },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
    
    // Save with suffix to distinguish between multiple notifications for same medication
    await notificationService.saveMedicationNotificationId(
      medicationId, 
      identifier,
      suffix
    );
    return identifier;
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
    const existingIdsString = await AsyncStorage.getItem(MEDICATION_NOTIFICATION_IDS_KEY);
    if (!existingIdsString) return;
    
    const existingIds = JSON.parse(existingIdsString);
    const idsToRemove = [];
    
    // Find all notification IDs for this medication (could be multiple for twice daily, etc)
    for (const key in existingIds) {
      if (key.startsWith(`${medicationId}_`)) {
        const notificationId = existingIds[key];
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        idsToRemove.push(key);
      }
    }
    
    // Remove the canceled notification IDs from storage
    idsToRemove.forEach(key => delete existingIds[key]);
    await AsyncStorage.setItem(MEDICATION_NOTIFICATION_IDS_KEY, JSON.stringify(existingIds));
  },
  
  // Cancel all notifications
  cancelAllNotifications: async (): Promise<void> => {
    if (!isExpoGo) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    
    await AsyncStorage.removeItem(MOOD_NOTIFICATION_ID_KEY);
    await AsyncStorage.removeItem(MEDICATION_NOTIFICATION_IDS_KEY);
  },
  
  // Handle notification response (when user taps a notification)
  handleNotificationResponse: (response) => {
    const data = response.notification.request.content.data;
    
    if (data.type === 'mood_reminder') {
      console.log('User tapped on mood reminder notification');
    } else if (data.type === 'medication_reminder') {
      console.log('User tapped on medication reminder notification');
    }
  },
}; 