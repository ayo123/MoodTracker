import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

export const DataManagementScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const clearAllData = async () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete ALL your mood and medication data. This cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Everything", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await AsyncStorage.clear();
              Alert.alert("Success", "All data has been cleared successfully.");
            } catch (error) {
              console.error("Error clearing data:", error);
              Alert.alert("Error", "Failed to clear data. Please try again.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const clearTestData = async () => {
    Alert.alert(
      "Clear Test Data",
      "This will remove any test or sample data from the app, but keep your real entries. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove Test Data", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              
              // Get moods from storage
              const moodsKey = 'mood_tracker_moods';
              const moodsData = await AsyncStorage.getItem(moodsKey);
              
              if (moodsData) {
                const moods = JSON.parse(moodsData);
                console.log("Total moods before cleanup:", moods.length);
                
                // Only keep entries you manually confirmed are valid
                // This is a more strict filtering approach
                const keepEntries = moods.filter(mood => {
                  // Keep only entries you've explicitly identified as legitimate
                  const validMoodNames = [
                    'Hypomania', 'Neutral', 'Anxious', 'Excited', 
                    'Sad', 'Calm', 'Happy'
                  ];
                  
                  return validMoodNames.includes(mood.mood.name);
                });
                
                console.log("Keeping these entries:", keepEntries.length);
                console.log("Removing these entries:", moods.length - keepEntries.length);
                
                // Save filtered moods back to storage
                await AsyncStorage.setItem(moodsKey, JSON.stringify(keepEntries));
                Alert.alert("Success", `Removed ${moods.length - keepEntries.length} test entries.`);
              }
              
            } catch (error) {
              console.error("Error removing test data:", error);
              Alert.alert("Error", "Failed to remove test data. Please try again.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Data Management</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <>
          <TouchableOpacity 
            style={[styles.button, styles.dangerButton]} 
            onPress={clearTestData}
          >
            <Ionicons name="trash-outline" size={24} color={colors.white} />
            <Text style={styles.buttonText}>Remove Test Data</Text>
          </TouchableOpacity>
          
          <Text style={styles.divider}>- OR -</Text>
          
          <TouchableOpacity 
            style={[styles.button, styles.dangerButtonDark]} 
            onPress={clearAllData}
          >
            <Ionicons name="warning-outline" size={24} color={colors.white} />
            <Text style={styles.buttonText}>Clear ALL Data</Text>
          </TouchableOpacity>
          
          <Text style={styles.warning}>
            Warning: Data deletion cannot be undone. Please be certain before proceeding.
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: colors.text,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  dangerButtonDark: {
    backgroundColor: '#B71C1C',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  divider: {
    textAlign: 'center',
    marginVertical: 20,
    color: colors.textLight,
  },
  warning: {
    color: '#F44336',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
  },
}); 