import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { moodService, MoodEntry } from '../../services/moodService';

// Get mood category
const getMoodCategory = (score: number) => {
  if (score <= 1) return { name: 'Deep Depression', color: '#8B0000' };
  if (score <= 3) return { name: 'Depression', color: '#CD5C5C' };
  if (score <= 6) return { name: 'Euthymic', color: '#4CAF50' };
  if (score <= 8) return { name: 'Hypomania', color: '#FFD700' };
  return { name: 'Mania', color: '#FF4500' };
};

export const MoodViewScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const { moodId, date } = route.params;
  const [mood, setMood] = useState<MoodEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMood = async () => {
      try {
        setLoading(true);
        let moodData;
        
        // Load by ID if provided, otherwise by date
        if (moodId) {
          moodData = await moodService.getMoodById(moodId);
        } else if (date) {
          moodData = await moodService.getMoodByDate(date);
        }
        
        setMood(moodData);
      } catch (error) {
        console.error('Error loading mood:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMood();
  }, [moodId, date]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!mood) {
    return (
      <View style={styles.container}>
        <Text style={styles.noMoodText}>No mood data found</Text>
      </View>
    );
  }

  const moodCategory = getMoodCategory(mood.mood.score);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.header}>
        <Text style={styles.date}>
          {new Date(mood.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>
      
      <View style={styles.moodCard}>
        <Text style={styles.moodTitle}>Mood</Text>
        <Text style={styles.moodName}>{mood.mood.name}</Text>
        
        <View style={[styles.categoryBadge, { backgroundColor: moodCategory.color }]}>
          <Text style={styles.categoryText}>{moodCategory.name}</Text>
        </View>
        
        {mood.emotions && mood.emotions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emotions</Text>
            <View style={styles.emotionsContainer}>
              {mood.emotions.map((emotion, index) => (
                <View key={index} style={styles.emotionChip}>
                  <Text style={styles.emotionText}>{emotion.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {mood.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notes}>{mood.notes}</Text>
            </View>
          </View>
        )}
        
        {mood.medicationsTaken && mood.medicationsTaken.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medications</Text>
            <View style={styles.medicationsContainer}>
              {mood.medicationsTaken.map((med, index) => (
                <View key={index} style={styles.medicationItem}>
                  <Text style={styles.medicationName}>{med.name}</Text>
                  <Text style={styles.medicationDetails}>{med.dosage}</Text>
                  <View style={[
                    styles.medicationStatus, 
                    {backgroundColor: med.taken ? colors.success : colors.error}
                  ]}>
                    <Text style={styles.medicationStatusText}>
                      {med.taken ? 'Taken' : 'Missed'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('AddMood', { existingMood: mood })}
        >
          <Text style={styles.editButtonText}>Edit Mood</Text>
          <Ionicons name="pencil" size={20} color={colors.white} />
        </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    marginBottom: 20,
  },
  date: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textLight,
  },
  moodCard: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  moodTitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 5,
  },
  moodName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  categoryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  emotionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontSize: 13,
  },
  notesContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  notes: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  medicationsContainer: {
    marginTop: 10,
  },
  medicationItem: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medicationName: {
    flex: 2,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  medicationDetails: {
    flex: 1,
    fontSize: 13,
    color: colors.textLight,
  },
  medicationStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  medicationStatusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 25,
  },
  editButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  noMoodText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 50,
  },
}); 