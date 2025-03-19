import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useFocusEffect } from '@react-navigation/native';
import { medicationService, Medication } from '../../services/medicationService';
import { moodService, MoodEntry } from '../../services/moodService';
import { useAuthStore } from '../../store/authStore';
import { SimpleAuthManager } from '../../utils/SimpleAuthManager';

// Get mood category
const getMoodCategory = (score: number) => {
  if (score <= 1) return { name: 'Deep Depression', color: '#8B0000', emoji: '😞' };
  if (score <= 3) return { name: 'Depression', color: '#CD5C5C', emoji: '😔' };
  if (score <= 6) return { name: 'Euthymic', color: '#4CAF50', emoji: '😐' };
  if (score <= 8) return { name: 'Hypomania', color: '#FFD700', emoji: '😊' };
  return { name: 'Mania', color: '#FF4500', emoji: '😃' };
};

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [hasMedications, setHasMedications] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [latestMood, setLatestMood] = useState<MoodEntry | null>(null);
  const [loadingMoods, setLoadingMoods] = useState(true);
  const [moodStreak, setMoodStreak] = useState(0);
  
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  
  // Extract first name only for the welcome message
  const firstName = user?.name?.split(' ')[0] || 'there';
  
  // This will run when the screen comes into focus (including after navigating back)
  useFocusEffect(
    useCallback(() => {
      console.log('HomeScreen focused - loading data');
      loadData();
      return () => {
        console.log('HomeScreen unfocused');
      };
    }, [])
  );
  
  const loadData = async () => {
    try {
      // Start loading
      setLoadingMeds(true);
      setLoadingMoods(true);
      
      // Fetch medications
      const medsData = await medicationService.getMedications();
      console.log('Medications data:', JSON.stringify(medsData, null, 2));
      setMedications(medsData);
      setHasMedications(medsData.length > 0);
      console.log('Loaded medications:', medsData.length);
      
      // Finished loading medications
      setLoadingMeds(false);
      
      // Check for today's mood
      const today = await moodService.getTodaysMood();
      console.log('Today mood data:', JSON.stringify(today, null, 2));
      setTodayMood(today);
      console.log('Today\'s mood:', today ? today.date : 'Not found');
      
      // Get the most recent mood
      const latest = await moodService.getLatestMood();
      console.log('Latest mood data:', JSON.stringify(latest, null, 2));
      setLatestMood(latest);
      console.log('Latest mood:', latest ? latest.date : 'None');
      
      // Calculate streak
      // ... streak calculation code ...
      
      // Finished loading moods
      setLoadingMoods(false);
    } catch (error) {
      console.error('Error loading home data:', error);
      // Make sure we exit loading state even on error
      setLoadingMeds(false);
      setLoadingMoods(false);
    }
  };
  
  const handleAddMood = () => {
    navigation.navigate('AddMood');
  };
  
  const handleUpdateMood = () => {
    if (todayMood) {
      navigation.navigate('AddMood', { existingMood: todayMood });
    } else {
      navigation.navigate('AddMood');
    }
  };
  
  const handleManageMedications = () => {
    navigation.navigate('ManageMedications');
  };
  
  const handleViewAnalytics = () => {
    // The navigation between tabs should be handled properly
    // Use the parent navigation (tab navigator) to switch tabs
    if (navigation.getParent()) {
      navigation.getParent().navigate('AnalyticsTab');
    }
  };
  
  const renderMoodSection = () => {
    if (loadingMoods) {
      return (
        <View style={styles.cardContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    
    if (todayMood) {
      const moodCategory = getMoodCategory(todayMood.mood.score);
      return (
        <View style={styles.cardContainer}>
          <Text style={styles.cardTitle}>Today's Mood</Text>
          <View style={styles.moodContainer}>
            <Text style={styles.moodEmoji}>{moodCategory.emoji}</Text>
            <Text style={[styles.moodText, { color: moodCategory.color }]}>{moodCategory.name}</Text>
            <View style={[styles.moodScore, { backgroundColor: moodCategory.color }]}>
              <Text style={styles.moodScoreText}>{todayMood.mood.score}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleUpdateMood}
          >
            <Text style={styles.actionButtonText}>Update Today's Mood</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.cardContainer}>
        <Text style={styles.cardTitle}>Track Your Mood</Text>
        <Text style={styles.cardText}>
          You haven't recorded your mood today. How are you feeling?
        </Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleAddMood}
        >
          <Text style={styles.actionButtonText}>Add Today's Mood</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderMedicationsSection = () => {
    if (loadingMeds) {
      return (
        <View style={styles.cardContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    
    if (hasMedications) {
      return (
        <View style={styles.cardContainer}>
          <Text style={styles.cardTitle}>Your Medications</Text>
          <ScrollView style={styles.medicationList}>
            {medications.slice(0, 3).map(med => (
              <View key={med.id} style={styles.medicationItem}>
                <Ionicons name="medical" size={20} color={colors.primary} />
                <View style={styles.medicationDetails}>
                  <Text style={styles.medicationName}>{med.name}</Text>
                  <Text style={styles.medicationDosage}>{med.dosage}</Text>
                </View>
              </View>
            ))}
            {medications.length > 3 && (
              <Text style={styles.moreItemsText}>
                +{medications.length - 3} more medications
              </Text>
            )}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleManageMedications}
          >
            <Text style={styles.actionButtonText}>Manage Medications</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.cardContainer}>
        <Text style={styles.cardTitle}>Medications</Text>
        <Text style={styles.cardText}>
          You haven't added any medications yet. Track your medications to see how they affect your mood.
        </Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleManageMedications}
        >
          <Text style={styles.actionButtonText}>Add Medications</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderStreakSection = () => {
    return (
      <View style={styles.streakContainer}>
        <Ionicons name="flame" size={24} color="white" />
        <Text style={styles.streakText}>
          {moodStreak === 0 ? 
            "Start your streak by logging your mood today!" : 
            `${moodStreak} day streak! Keep it up!`
          }
        </Text>
      </View>
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome, {firstName}!</Text>
          <Text style={styles.subtitle}>Your Mood Tracker Dashboard</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.profileButtonText}>
            {firstName.charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>
      
      {renderStreakSection()}
      
      {renderMoodSection()}
      
      {renderMedicationsSection()}
      
      <View style={styles.cardContainer}>
        <Text style={styles.cardTitle}>Your Insights</Text>
        <Text style={styles.cardText}>
          Track your mood patterns and see how they change over time.
        </Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleViewAnalytics}
        >
          <Text style={styles.actionButtonText}>View Life Chart</Text>
        </TouchableOpacity>
      </View>
      
      {/* Only show in dev/testing mode */}
      {__DEV__ && (
        <TouchableOpacity
          style={styles.emergencyLogout}
          onPress={() => SimpleAuthManager.logout()}
        >
          <Text style={styles.emergencyLogoutText}>EMERGENCY LOGOUT</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    marginTop: 20,
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 10,
  },
  streakText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  cardContainer: {
    backgroundColor: 'white',
    margin: 20,
    marginBottom: 0,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#495057',
    marginBottom: 15,
  },
  moodContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  moodEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  moodText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
  moodScore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodScoreText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  medicationList: {
    maxHeight: 200,
    marginBottom: 15,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  medicationDetails: {
    marginLeft: 10,
  },
  medicationName: {
    fontWeight: 'bold',
  },
  medicationDosage: {
    fontSize: 12,
    color: '#6c757d',
  },
  moreItemsText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 12,
    marginTop: 10,
  },
  emergencyLogout: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    margin: 20,
    alignItems: 'center',
  },
  emergencyLogoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default HomeScreen; 