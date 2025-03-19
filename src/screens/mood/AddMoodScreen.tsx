import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Switch,
  Animated,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { medicationService } from '../../services/medicationService';
import { moodService } from '../../services/moodService';
import { defaultEmotions } from '../../constants/emotions';

export const AddMoodScreen = ({ navigation, route }) => {
  const existingMood = route.params?.existingMood;
  const [activeSection, setActiveSection] = useState(0);
  const [moodScore, setMoodScore] = useState(existingMood?.mood?.score || 5);
  const [selectedEmotions, setSelectedEmotions] = useState(existingMood?.emotions || []);
  const [notes, setNotes] = useState(existingMood?.notes || '');
  const [medicationsTaken, setMedicationsTaken] = useState([]);
  const [newEmotion, setNewEmotion] = useState('');
  const [emotions, setEmotions] = useState(defaultEmotions);
  const [loading, setLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [results, setResults] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Animation value for transitions
  const [slideAnim] = useState(new Animated.Value(0));
  
  // Load medications when component mounts
  useEffect(() => {
    const loadMedications = async () => {
      try {
        setLoading(true);
        const meds = await medicationService.getMedications();
        console.log('Loaded medications for mood tracking:', meds.length);
        
        // Initialize with all medications set to not taken,
        // or preserve taken status from existingMood if available
        const medsWithTakenStatus = meds.map(med => {
          const existingMed = existingMood?.medicationsTaken?.find(m => m.id === med.id);
          return {
            ...med,
            taken: existingMed ? existingMed.taken : false
          };
        });
        
        setMedicationsTaken(medsWithTakenStatus);
      } catch (error) {
        console.error('Error loading medications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMedications();
  }, [existingMood]);
  
  const getCurrentMood = (moodScore) => {
    if (moodScore <= 1) return { name: 'Deep Depression', color: '#8B0000' };
    if (moodScore <= 3) return { name: 'Depression', color: '#CD5C5C' };
    if (moodScore <= 6) return { name: 'Euthymic', color: '#4CAF50' };
    if (moodScore <= 8) return { name: 'Hypomania', color: '#FFD700' };
    return { name: 'Mania', color: '#FF4500' };
  };
  
  const currentMood = getCurrentMood(moodScore);

  // Toggle selected emotion
  const toggleEmotion = (emotion) => {
    if (selectedEmotions.some(e => e.id === emotion.id)) {
      setSelectedEmotions(selectedEmotions.filter(e => e.id !== emotion.id));
    } else {
      setSelectedEmotions([...selectedEmotions, emotion]);
    }
  };

  // Add custom emotion
  const addEmotion = () => {
    if (newEmotion.trim()) {
      const newId = Math.max(...emotions.map(e => e.id), 0) + 1;
      const emotion = { id: newId, name: newEmotion.trim() };
      setEmotions([...emotions, emotion]);
      setSelectedEmotions([...selectedEmotions, emotion]);
      setNewEmotion('');
    }
  };

  // Toggle medication taken status
  const toggleMedication = (medicationId) => {
    setMedicationsTaken(
      medicationsTaken.map(med => 
        med.id === medicationId ? { ...med, taken: !med.taken } : med
      )
    );
  };

  // Save mood entry
  const saveMoodEntry = async () => {
    try {
      setIsSaving(true);
      
      // Format data for API
      const moodData = {
        id: existingMood?.id, // Include ID if editing existing mood
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        mood: {
          score: moodScore,
          name: currentMood.name
        },
        emotions: selectedEmotions,
        notes: notes.trim(),
        medicationsTaken: medicationsTaken.filter(med => med.taken).map(med => ({
          id: med.id,
          name: med.name,
          dosage: med.dosage,
          taken: med.taken
        }))
      };
      
      console.log('====== SAVING MOOD DATA ======');
      console.log(JSON.stringify(moodData, null, 2));
      
      // Call API to save/update mood entry
      const savedMood = await moodService.saveMoodEntry(moodData);
      console.log('====== RECEIVED SAVED MOOD ======');
      console.log(JSON.stringify(savedMood, null, 2));
      
      // Show success message
      Alert.alert('Success', 'Your mood has been saved.');
      
      // Wait a moment before navigating back to ensure data is processed
      setTimeout(() => {
        // Important: Navigate back to refresh the home screen
        navigation.goBack();
      }, 300);
    } catch (error) {
      console.error('Failed to save mood:', error);
      Alert.alert('Error', 'Failed to save your mood. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Go to next section with animation
  const goToNextSection = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setActiveSection(prev => prev + 1);
      slideAnim.setValue(100);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };
  
  // Go to previous section with animation
  const goToPrevSection = () => {
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setActiveSection(prev => prev - 1);
      slideAnim.setValue(-100);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };
  
  // Render mood selection section
  const renderMoodSection = () => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>How's your mood today?</Text>
        <View style={styles.moodEmojiContainer}>
          <View 
            style={[
              styles.moodScoreIndicator, 
              { backgroundColor: currentMood.color }
            ]}
          >
            <Text style={styles.moodScoreText}>{moodScore}</Text>
          </View>
          <Text style={[styles.moodName, { color: currentMood.color }]}>
            {currentMood.name}
          </Text>
        </View>
        <MoodSlider />
        <Text style={[styles.sectionSubtitle, {marginTop: 20}]}>What emotions are you experiencing?</Text>
        <View style={styles.emotionsContainer}>
          {emotions.map(emotion => (
            <TouchableOpacity
              key={emotion.id}
              style={[
                styles.emotionChip,
                selectedEmotions.some(e => e.id === emotion.id) && styles.selectedEmotion
              ]}
              onPress={() => toggleEmotion(emotion)}
            >
              <Text 
                style={[
                  styles.emotionText,
                  selectedEmotions.some(e => e.id === emotion.id) && styles.selectedEmotionText
                ]}
              >
                {emotion.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.addEmotionContainer}>
          <TextInput
            style={styles.addEmotionInput}
            value={newEmotion}
            onChangeText={setNewEmotion}
            placeholder="Add custom emotion..."
            placeholderTextColor="#999"
          />
          <TouchableOpacity 
            style={styles.addEmotionButton}
            onPress={addEmotion}
            disabled={!newEmotion.trim()}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Render notes and medications section
  const renderNotesAndMedicationsSection = () => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Additional Details</Text>
        
        <Text style={styles.sectionSubtitle}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="How was your day? Any events that affected your mood?"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
        
        <Text style={[styles.sectionSubtitle, {marginTop: 20}]}>Medications Taken</Text>
        {loading ? (
          <ActivityIndicator style={styles.loading} />
        ) : (
          <>
            {medicationsTaken.length === 0 ? (
              <View style={styles.noMedicationsContainer}>
                <Text style={styles.noMedicationsText}>No medications added yet</Text>
                <TouchableOpacity
                  style={styles.manageMedsButton}
                  onPress={() => {
                    navigation.navigate('ManageMedications');
                  }}
                >
                  <Text style={styles.manageMedsText}>Add Medications</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {medicationsTaken.map((medication) => (
                  <View key={medication.id} style={styles.medicationItem}>
                    <View>
                      <Text style={styles.medicationName}>{medication.name}</Text>
                      <Text style={styles.medicationDetails}>
                        {medication.dosage} - {medication.frequency}
                        {medication.time ? ` at ${medication.time}` : ''}
                      </Text>
                    </View>
                    <Switch
                      value={medication.taken}
                      onValueChange={() => toggleMedication(medication.id)}
                      trackColor={{ false: "#767577", true: colors.primary }}
                      thumbColor="#f4f3f4"
                    />
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </View>
    );
  };
  
  // Replace slider with draggable component
  const MoodSlider = () => {
    // Create array of touchable spots for the slider
    const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    return (
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Depression</Text>
        <View style={styles.customSlider}>
          {values.map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.sliderButton,
                value === moodScore && { 
                  backgroundColor: currentMood.color,
                  width: 30,
                  height: 30,
                  borderRadius: 15
                }
              ]}
              onPress={() => setMoodScore(value)}
            >
              {value === moodScore && (
                <Text style={styles.sliderButtonText}>{value}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sliderLabel}>Mania</Text>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.progress}>
        {[0, 1].map(step => (
          <View
            key={step}
            style={[
              styles.progressStep,
              activeSection >= step && styles.progressStepActive
            ]}
          />
        ))}
      </View>
      
      <Animated.ScrollView
        style={[styles.scrollContainer, { transform: [{ translateX: slideAnim }] }]}
      >
        {activeSection === 0 && renderMoodSection()}
        {activeSection === 1 && renderNotesAndMedicationsSection()}
      </Animated.ScrollView>
      
      <View style={styles.navigationButtons}>
        {activeSection > 0 && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={goToPrevSection}
          >
            <Ionicons name="arrow-back" size={16} color={colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {activeSection < 1 ? (
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={goToNextSection}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveMoodEntry}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Save</Text>
                <Ionicons name="checkmark" size={16} color="white" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginVertical: 20,
  },
  progressStep: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
  },
  progressStepActive: {
    backgroundColor: colors.primary,
  },
  sectionContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  moodEmojiContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  moodScoreIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  moodName: {
    fontSize: 24,
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  sliderLabel: {
    fontSize: 16,
    color: '#666',
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emotionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emotionChip: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    margin: 5,
  },
  selectedEmotion: {
    backgroundColor: colors.primary,
  },
  emotionText: {
    color: '#333',
  },
  selectedEmotionText: {
    color: 'white',
  },
  addEmotionContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 10,
  },
  addEmotionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  addEmotionButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    height: 200,
    fontSize: 16,
  },
  medicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  medicationDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  noMedicationsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  noMedicationsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  manageMedsButton: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  manageMedsText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  loading: {
    marginVertical: 30,
  },
  scrollContainer: {
    flex: 1,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 5,
  },
  backButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  backButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  saveButton: {
    backgroundColor: colors.success,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 5,
  },
  customSlider: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    height: 40,
  },
  sliderButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#d3d3d3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
}); 