import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { notificationService } from '../../services/notificationService';

export const SettingsScreen = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [moodRemindersEnabled, setMoodRemindersEnabled] = useState(false);
  const [medicationRemindersEnabled, setMedicationRemindersEnabled] = useState(false);
  const [moodReminderTime, setMoodReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Check if notifications are enabled
      const notificationsOn = await notificationService.areNotificationsEnabled();
      setNotificationsEnabled(notificationsOn);
      
      // Load mood reminder settings
      const moodReminderTimeStr = await AsyncStorage.getItem('mood_reminder_time');
      if (moodReminderTimeStr) {
        setMoodRemindersEnabled(true);
        setMoodReminderTime(new Date(moodReminderTimeStr));
      } else {
        // Default to 8:00 PM if not set
        const defaultTime = new Date();
        defaultTime.setHours(20, 0, 0);
        setMoodReminderTime(defaultTime);
      }
      
      // Load medication reminder setting
      const medRemindersEnabled = await AsyncStorage.getItem('medication_reminders_enabled');
      setMedicationRemindersEnabled(medRemindersEnabled === 'true');
      
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleNotifications = async (value) => {
    if (value) {
      // Request permissions when enabling notifications
      const granted = await notificationService.requestPermissions();
      setNotificationsEnabled(granted);
      
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'To receive notifications, please enable them in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } else {
      // Disable all notifications
      await notificationService.cancelAllNotifications();
      setNotificationsEnabled(false);
      setMoodRemindersEnabled(false);
      setMedicationRemindersEnabled(false);
      await AsyncStorage.removeItem('mood_reminder_time');
      await AsyncStorage.setItem('medication_reminders_enabled', 'false');
    }
  };
  
  const toggleMoodReminders = async (value) => {
    setMoodRemindersEnabled(value);
    
    if (value) {
      // Schedule the mood reminder
      const hours = moodReminderTime.getHours();
      const minutes = moodReminderTime.getMinutes();
      await notificationService.scheduleMoodReminder(hours, minutes);
      await AsyncStorage.setItem('mood_reminder_time', moodReminderTime.toISOString());
    } else {
      // Cancel the mood reminder
      await notificationService.cancelMoodReminder();
      await AsyncStorage.removeItem('mood_reminder_time');
    }
  };
  
  const toggleMedicationReminders = async (value) => {
    setMedicationRemindersEnabled(value);
    await AsyncStorage.setItem('medication_reminders_enabled', value.toString());
    
    if (!value) {
      // Show a warning about medication reminders being essential
      Alert.alert(
        'Disable Medication Reminders?',
        'Medication reminders help ensure you stay on your treatment plan. Are you sure you want to disable them?',
        [
          { 
            text: 'Keep Enabled', 
            onPress: () => {
              setMedicationRemindersEnabled(true);
              AsyncStorage.setItem('medication_reminders_enabled', 'true');
            },
            style: 'cancel'
          },
          { 
            text: 'Disable', 
            style: 'destructive'
          }
        ]
      );
    }
  };
  
  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedTime) {
      setMoodReminderTime(selectedTime);
      
      if (moodRemindersEnabled) {
        // Update the scheduled reminder with the new time
        const hours = selectedTime.getHours();
        const minutes = selectedTime.getMinutes();
        notificationService.scheduleMoodReminder(hours, minutes);
        AsyncStorage.setItem('mood_reminder_time', selectedTime.toISOString());
      }
    }
  };
  
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>
        
        {/* Notification Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
              <Text style={styles.settingLabel}>Enable Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: "#767577", true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          {notificationsEnabled && (
            <>
              {/* Mood Reminder Settings */}
              <View style={styles.settingItem}>
                <View style={styles.settingLabelContainer}>
                  <Ionicons name="heart-outline" size={24} color={colors.text} />
                  <Text style={styles.settingLabel}>Daily Mood Reminders</Text>
                </View>
                <Switch
                  value={moodRemindersEnabled}
                  onValueChange={toggleMoodReminders}
                  trackColor={{ false: "#767577", true: colors.primary }}
                  thumbColor="#f4f3f4"
                />
              </View>
              
              {moodRemindersEnabled && (
                <View style={styles.subSettingItem}>
                  <TouchableOpacity 
                    style={styles.timePickerButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={styles.timePickerLabel}>Reminder Time:</Text>
                    <Text style={styles.timePickerValue}>{formatTime(moodReminderTime)}</Text>
                  </TouchableOpacity>
                  
                  {showTimePicker && (
                    <DateTimePicker
                      value={moodReminderTime}
                      mode="time"
                      is24Hour={false}
                      display="default"
                      onChange={handleTimeChange}
                    />
                  )}
                </View>
              )}
              
              {/* Medication Reminder Settings */}
              <View style={styles.settingItem}>
                <View style={styles.settingLabelContainer}>
                  <Ionicons name="medkit-outline" size={24} color={colors.text} />
                  <Text style={styles.settingLabel}>Medication Reminders</Text>
                </View>
                <Switch
                  value={medicationRemindersEnabled}
                  onValueChange={toggleMedicationReminders}
                  trackColor={{ false: "#767577", true: colors.primary }}
                  thumbColor="#f4f3f4"
                />
              </View>
              
              {medicationRemindersEnabled && (
                <View style={styles.subSettingItem}>
                  <Text style={styles.subSettingText}>
                    Medication times are set individually when adding or editing medications
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
        
        {/* Add other settings sections as needed */}
        
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border + '40',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  subSettingItem: {
    paddingVertical: 12,
    paddingLeft: 36,
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border + '40',
  },
  subSettingText: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 14,
    color: colors.text,
    marginRight: 10,
  },
  timePickerValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});
