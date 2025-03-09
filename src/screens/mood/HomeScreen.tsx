import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useFocusEffect } from '@react-navigation/native';
import { medicationService, Medication } from '../../services/medicationService';
import { moodService, MoodEntry } from '../../services/moodService';

// Get mood category
const getMoodCategory = (score: number) => {
  if (score <= 1) return { name: 'Deep Depression', color: '#8B0000' };
  if (score <= 3) return { name: 'Depression', color: '#CD5C5C' };
  if (score <= 6) return { name: 'Euthymic', color: '#4CAF50' };
  if (score <= 8) return { name: 'Hypomania', color: '#FFD700' };
  return { name: 'Mania', color: '#FF4500' };
};

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [hasMedications, setHasMedications] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [latestMood, setLatestMood] = useState<MoodEntry | null>(null);
  const [loadingMoods, setLoadingMoods] = useState(true);
  
  // This will run when the screen comes into focus (including after navigating back)
  useFocusEffect(
    useCallback(() => {
      console.log('HomeScreen focused - loading data');
      loadMedications();
      loadMoodData();
      
      // This function will be called when the screen loses focus
      return () => {
        console.log('HomeScreen unfocused');
      };
    }, [])
  );
  
  const loadMedications = async () => {
    try {
      setLoadingMeds(true);
      const meds = await medicationService.getMedications();
      console.log('Loaded medications:', meds.length);
      setMedications(meds);
      setHasMedications(meds.length > 0);
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setLoadingMeds(false);
    }
  };
  
  const loadMoodData = async () => {
    try {
      setLoadingMoods(true);
      
      // Get today's mood if it exists
      const moodForToday = await moodService.getTodaysMood();
      console.log('Today\'s mood:', moodForToday ? 'Found' : 'Not found');
      setTodayMood(moodForToday);
      
      // Get latest mood entry (might be today's or an earlier one)
      const latest = await moodService.getLatestMood();
      console.log('Latest mood:', latest ? latest.date : 'None');
      setLatestMood(latest);
    } catch (error) {
      console.error('Error loading mood data:', error);
    } finally {
      setLoadingMoods(false);
    }
  };
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>
      
      {/* Mood tracking section with latest mood info */}
      <View style={styles.moodSection}>
        {!todayMood ? (
          <View style={styles.moodRowContainer}>
            <TouchableOpacity 
              style={styles.moodButton}
              onPress={() => navigation.navigate('AddMood')}
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.white} />
              <Text style={styles.moodButtonText}>Add Mood</Text>
            </TouchableOpacity>
            
            {latestMood && (
              <View style={styles.latestMoodContainer}>
                <Text style={styles.latestMoodLabel}>Latest Mood:</Text>
                <View style={styles.latestMoodInfo}>
                  <View 
                    style={[
                      styles.moodDot, 
                      {backgroundColor: getMoodCategory(latestMood.mood.score).color}
                    ]} 
                  />
                  <Text style={styles.latestMoodText}>
                    {latestMood.mood.name} ({latestMood.date})
                  </Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.todayLabel}>Today's Mood</Text>
            <TouchableOpacity 
              style={styles.moodCard}
              onPress={() => navigation.navigate('MoodView', { date: todayMood.date })}
            >
              <Text style={styles.moodText}>{todayMood.mood.name}</Text>
              
              <View style={[styles.moodCategory, { backgroundColor: getMoodCategory(todayMood.mood.score).color }]}>
                <Text style={styles.moodCategoryText}>
                  {getMoodCategory(todayMood.mood.score).name}
                </Text>
              </View>
              
              {todayMood.emotions && todayMood.emotions.length > 0 && (
                <View style={styles.emotionsContainer}>
                  {todayMood.emotions.map((emotion, index) => (
                    <View key={index} style={styles.emotionChip}>
                      <Text style={styles.emotionText}>{emotion.name}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {todayMood.medicationsTaken && (
                <View style={styles.medicationStatus}>
                  <Text style={styles.medicationLabel}>Medications: </Text>
                  <Text style={styles.medicationText}>
                    {todayMood.medicationsTaken.filter(m => m.taken).length} of {todayMood.medicationsTaken.length} taken
                  </Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.updateMoodButton}
                onPress={(e) => {
                  e.stopPropagation(); // Prevent parent onPress from firing
                  navigation.navigate('AddMood', { existingMood: todayMood });
                }}
              >
                <Text style={styles.updateMoodButtonText}>Update Mood</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Medications section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medications</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('ManageMedications')}
            style={styles.manageMedsButton}
          >
            <Text style={styles.manageMedsText}>
              {hasMedications ? 'Update Medications' : 'Add Medications'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Show loading indicator, medications list, or prompt */}
        {loadingMeds ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loading} />
        ) : hasMedications ? (
          <View style={styles.medicationsContainer}>
            {medications.map((med) => (
              <View key={med.id} style={styles.medicationItemCard}>
                <Text style={styles.medicationItemName}>{med.name}</Text>
                <Text style={styles.medicationItemDetails}>{med.dosage} - {med.frequency}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noMedicationsText}>No medications added yet</Text>
        )}
      </View>
      
      {/* Chart section - placeholder for future line chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mood History</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>Mood tracking chart coming soon!</Text>
          <Text style={styles.chartPlaceholderInfo}>Track your mood daily to see patterns</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  date: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 5,
  },
  moodButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  moodButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  moodButtonText: {
    color: colors.white,
    fontWeight: '500',
    marginLeft: 8,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  todayLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  moodCard: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  moodText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  moodCategory: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
  },
  moodCategoryText: {
    color: 'white',
    fontWeight: '600',
  },
  emotionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
  },
  emotionChip: {
    backgroundColor: colors.primaryLight,
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    margin: 3,
  },
  emotionText: {
    color: colors.white,
    fontSize: 12,
  },
  medicationStatus: {
    flexDirection: 'row',
    marginTop: 15,
    alignItems: 'center',
  },
  medicationLabel: {
    color: colors.textLight,
  },
  medicationText: {
    color: colors.text,
    fontWeight: '500',
  },
  updateMoodButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 8,
    marginTop: 15,
    paddingHorizontal: 20,
  },
  updateMoodButtonText: {
    color: colors.white,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  manageMedsButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  manageMedsText: {
    color: colors.white,
    fontWeight: '500',
  },
  medicationsContainer: {
    marginTop: 10,
  },
  medicationItemCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  medicationItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  medicationItemDetails: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  noMoodContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  noMoodText: {
    color: colors.textLight,
    fontSize: 16,
  },
  noMedicationsText: {
    color: colors.textLight,
    fontSize: 16,
    marginTop: 10,
  },
  recentMoodItem: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  moodDate: {
    color: colors.textLight,
    fontSize: 14,
  },
  moodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  moodName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  loading: {
    marginVertical: 20,
  },
  moodSection: {
    marginBottom: 20,
  },
  moodRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginVertical: 15,
  },
  latestMoodContainer: {
    flex: 1,
    marginLeft: 15,
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  latestMoodLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  latestMoodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  latestMoodText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  moodDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  chartPlaceholder: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    marginVertical: 15,
    alignItems: 'center',
    height: 180,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.card.border,
    borderStyle: 'dashed',
  },
  chartPlaceholderText: {
    fontSize: 18,
    color: colors.textLight,
    fontWeight: '500',
  },
  chartPlaceholderInfo: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 10,
  },
  recentMoodsContainer: {
    marginTop: 10,
  },
}); 