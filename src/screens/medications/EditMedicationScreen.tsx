import { notificationService } from '../../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const EditMedicationScreen = ({ navigation, route }) => {
  // ... existing state
  const [enableReminders, setEnableReminders] = useState(true);
  
  useEffect(() => {
    if (medication) {
      // ... existing code to load medication
      
      // Check if reminders are enabled for this medication
      AsyncStorage.getItem(`medication_reminder_${medication.id}_enabled`)
        .then(value => setEnableReminders(value !== 'false'))
        .catch(err => console.error('Error loading reminder setting:', err));
    }
  }, [medication]);
  
  const handleSave = async () => {
    try {
      if (!name.trim()) {
        Alert.alert('Error', 'Medication name is required');
        return;
      }
      
      const medicationData = {
        id: medication ? medication.id : Date.now(),
        name,
        dosage,
        frequency,
        time,
        notes
      };
      
      if (medication) {
        // Update existing medication
        await medicationService.updateMedication(medicationData);
      } else {
        // Add new medication
        await medicationService.addMedication(medicationData);
      }
      
      // Handle notification settings
      if (enableReminders) {
        await notificationService.scheduleMedicationReminder(
          medicationData.id,
          medicationData.name,
          medicationData.time,
          medicationData.frequency
        );
        await AsyncStorage.setItem(`medication_reminder_${medicationData.id}_enabled`, 'true');
      } else {
        await notificationService.cancelMedicationReminder(medicationData.id);
        await AsyncStorage.setItem(`medication_reminder_${medicationData.id}_enabled`, 'false');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving medication:', error);
      Alert.alert('Error', 'Failed to save medication');
    }
  };

  // ... rest of the component
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* ... existing form fields ... */}
        
        {/* Add notification toggle */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Reminder Notifications</Text>
          <View style={styles.reminderContainer}>
            <Switch
              value={enableReminders}
              onValueChange={setEnableReminders}
              trackColor={{ false: "#767577", true: colors.primary }}
              thumbColor="#f4f3f4"
            />
            <Text style={styles.reminderText}>
              {enableReminders ? 'Notifications enabled' : 'No notifications'}
            </Text>
          </View>
        </View>
        
        {/* ... save button ... */}
      </ScrollView>
    </SafeAreaView>
  );
};

// Add to your styles
const styles = StyleSheet.create({
  // ... existing styles
  
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  reminderText: {
    marginLeft: 10,
    fontSize: 16,
    color: colors.text,
  },
}); 