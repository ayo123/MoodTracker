import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { colors } from '../../constants/colors';
import { medicationService, Medication } from '../../services/medicationService';
import { moodService, MoodEntry } from '../../services/moodService';
import Voice from '../../services/voiceService';
import { isExpoGo } from '../../utils/platformUtils';

// Bipolar mood scale - without emojis
const moodScaleConfig = [
  { score: 0, name: 'Deep Depression', category: 'Deep Depression' },
  { score: 1, name: 'Severe Depression', category: 'Deep Depression' },
  { score: 2, name: 'Depression', category: 'Depression' },
  { score: 3, name: 'Mild Depression', category: 'Depression' },
  { score: 4, name: 'Slightly Low', category: 'Euthymic' },
  { score: 5, name: 'Neutral', category: 'Euthymic' },
  { score: 6, name: 'Slightly Elevated', category: 'Euthymic' },
  { score: 7, name: 'Hypomania', category: 'Hypomania' },
  { score: 8, name: 'Strong Hypomania', category: 'Hypomania' },
  { score: 9, name: 'Mania', category: 'Mania' },
  { score: 10, name: 'Severe Mania', category: 'Mania' },
];

// Get mood category color
const getMoodCategoryColor = (score) => {
  if (score <= 1) return '#8B0000'; // Deep Depression - dark red
  if (score <= 3) return '#CD5C5C'; // Depression - light red
  if (score <= 6) return '#4CAF50'; // Euthymic - green
  if (score <= 8) return '#FFD700'; // Hypomania - gold
  return '#FF4500'; // Mania - orange red
};

// Sample emotions that can be selected
const defaultEmotions = [
  { id: 1, name: 'Anxious' },
  { id: 2, name: 'Irritable' },
  { id: 3, name: 'Sad' },
  { id: 4, name: 'Excited' },
  { id: 5, name: 'Tired' },
  { id: 6, name: 'Hopeful' },
  { id: 7, name: 'Frustrated' },
  { id: 8, name: 'Grateful' },
  { id: 9, name: 'Overwhelmed' },
  { id: 10, name: 'Calm' },
];

// Sample medications
const userMedications = [
  { id: 1, name: 'Lithium', dosage: '300mg', frequency: 'Twice daily' },
  { id: 2, name: 'Lamotrigine', dosage: '200mg', frequency: 'Once daily' },
  { id: 3, name: 'Quetiapine', dosage: '50mg', frequency: 'At bedtime' },
];

// Replace real voice integration with a mock in Expo Go
const isSpeechRecognitionAvailable = !isExpoGo;

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
  
  // Check for microphone permission on component mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        setHasMicPermission(status === 'granted');
      } catch (error) {
        console.log('Error getting microphone permission:', error);
      }
    })();
  }, []);
  
  // Set up Voice recognition handlers
  useEffect(() => {
    // Voice recognition event handlers
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    
    return () => {
      // Clean up listeners when component unmounts
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);
  
  const onSpeechStart = () => {
    console.log('Speech recognition started');
  };
  
  const onSpeechEnd = () => {
    setIsListening(false);
    console.log('Speech recognition ended');
  };
  
  const onSpeechResults = (e) => {
    if (e.value && e.value.length > 0) {
      const recognizedText = e.value[0];
      console.log('Speech recognition results:', recognizedText);
      
      // Append to notes or replace
      if (notes.trim().length > 0) {
        setNotes(notes + ' ' + recognizedText);
      } else {
        setNotes(recognizedText);
      }
    }
    setResults(e.value || []);
  };
  
  const onSpeechError = (e) => {
    console.error('Speech recognition error:', e);
    setIsListening(false);
  };
  
  const startListening = async () => {
    try {
      if (isListening) {
        await Voice.stop();
        setIsListening(false);
      } else {
        setResults([]);
        await Voice.start('en-US');
        setIsListening(true);
      }
    } catch (error) {
      console.error('Error toggling speech recognition:', error);
    }
  };
  
  // Get mood based on score
  const getCurrentMood = (score) => {
    const roundedScore = Math.round(score);
    return moodScaleConfig.find(mood => mood.score === roundedScore);
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

  const handleSave = async () => {
    try {
      // Create mood data object
      const moodData: MoodEntry = {
        date: new Date().toISOString().split('T')[0],
        mood: {
          name: currentMood.name,
          score: currentMood.score,
          category: currentMood.category
        },
        emotions: selectedEmotions,
        notes,
        medicationsTaken,
      };

      console.log('Saving mood:', moodData);
      
      // Save to moodService
      await moodService.saveMood(moodData);
      
      // Return to home screen
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save mood:', error);
      // You could show an alert here
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
  
  // Get section progress indicator
  const getSectionProgress = () => {
    return [
      { label: 'Mood', active: activeSection >= 0 },
      { label: 'Emotions', active: activeSection >= 1 },
      { label: 'Medications', active: activeSection >= 2 },
      { label: 'Notes', active: activeSection >= 3 },
    ];
  };
  
  // Render the active section
  const renderSection = () => {
    switch (activeSection) {
      case 0:
        return renderMoodSection();
      case 1:
        return renderEmotionsSection();
      case 2:
        return renderMedicationsSection();
      case 3:
        return renderNotesSection();
      default:
        return null;
    }
  };

  // Render the mood section
  const renderMoodSection = () => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>How are you feeling?</Text>
        <View style={styles.moodScaleContainer}>
          <Text style={styles.currentMoodName}>{currentMood.name}</Text>
          
          <View 
            style={[
              styles.moodCategoryIndicator, 
              { backgroundColor: getMoodCategoryColor(moodScore) }
            ]}
          >
            <Text style={styles.moodCategoryText}>{currentMood.category}</Text>
          </View>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Depression</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={moodScore}
              onValueChange={setMoodScore}
              minimumTrackTintColor={getMoodCategoryColor(moodScore)}
              maximumTrackTintColor="#DDDDDD"
              thumbTintColor={getMoodCategoryColor(moodScore)}
            />
            <Text style={styles.sliderLabel}>Mania</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.nextButton} onPress={goToNextSection}>
          <Text style={styles.nextButtonText}>Next: Emotions</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
  };

  // Render the emotions section
  const renderEmotionsSection = () => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>What emotions are you experiencing?</Text>
        
        <View style={styles.emotionsContainer}>
          {emotions.map((emotion) => (
            <TouchableOpacity
              key={emotion.id}
              style={[
                styles.emotionChip,
                selectedEmotions.some(e => e.id === emotion.id) && styles.selectedEmotionChip
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
            placeholder="Add custom emotion..."
            value={newEmotion}
            onChangeText={setNewEmotion}
            onSubmitEditing={addEmotion}
          />
          <TouchableOpacity style={styles.addEmotionButton} onPress={addEmotion}>
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.navigationButtons}>
          <TouchableOpacity style={styles.backButton} onPress={goToPrevSection}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.nextButton} onPress={goToNextSection}>
            <Text style={styles.nextButtonText}>Next: Medications</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render the medications section with proper navigation buttons
  const renderMedicationsSection = () => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Medications Taken</Text>
        <Text style={styles.sectionDescription}>
          Mark which medications you've taken today.
        </Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loading} />
        ) : medicationsTaken.length > 0 ? (
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
        ) : (
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
        )}
        
        <View style={styles.navigationButtons}>
          <TouchableOpacity style={styles.backButton} onPress={goToPrevSection}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.nextButton} onPress={goToNextSection}>
            <Text style={styles.nextButtonText}>Next: Notes</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render the notes section with speech-to-text button
  const renderNotesSection = () => {
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Add notes about your day</Text>
        
        <View style={styles.notesInputContainer}>
          <TextInput
            style={styles.notesInput}
            multiline
            placeholder="Add notes about your day..."
            value={notes}
            onChangeText={setNotes}
          />
          
          {isSpeechRecognitionAvailable && (
            <TouchableOpacity 
              style={[
                styles.micButton,
                isListening && styles.micButtonActive
              ]}
              onPress={startListening}
            >
              <Ionicons 
                name={isListening ? "mic" : "mic-outline"} 
                size={24} 
                color={isListening ? colors.white : colors.primary} 
              />
            </TouchableOpacity>
          )}
        </View>
        
        {isListening && (
          <Text style={styles.listeningText}>
            Listening... Speak now
          </Text>
        )}
        
        <View style={styles.navigationButtons}>
          <TouchableOpacity style={styles.backButton} onPress={goToPrevSection}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Mood Entry</Text>
            <Ionicons name="checkmark" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={100}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>{existingMood ? 'Update Mood' : 'Add Mood'}</Text>
              <Text style={styles.date}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
            
            <View style={styles.progressContainer}>
              {getSectionProgress().map((section, index) => (
                <View key={index} style={styles.progressStep}>
                  <View 
                    style={[
                      styles.progressDot,
                      section.active ? styles.activeProgressDot : styles.inactiveProgressDot
                    ]}
                  />
                  <Text 
                    style={[
                      styles.progressLabel,
                      section.active ? styles.activeProgressLabel : styles.inactiveProgressLabel
                    ]}
                  >
                    {section.label}
                  </Text>
                </View>
              ))}
            </View>
            
            <Animated.View 
              style={[
                styles.sectionWrapper,
                { transform: [{ translateX: slideAnim }] }
              ]}
            >
              {renderSection()}
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  date: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 5,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  progressStep: {
    alignItems: 'center',
    width: 80,
  },
  progressDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginBottom: 8,
  },
  activeProgressDot: {
    backgroundColor: colors.primary,
  },
  inactiveProgressDot: {
    backgroundColor: colors.card.border,
  },
  progressLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  activeProgressLabel: {
    color: colors.text,
    fontWeight: '600',
  },
  inactiveProgressLabel: {
    color: colors.textLight,
  },
  sectionWrapper: {
    flex: 1,
  },
  sectionContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
  },
  moodScaleContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currentMoodName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  moodCategoryIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    marginVertical: 10,
  },
  moodCategoryText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 15,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  sliderLabel: {
    fontSize: 14,
    color: colors.textLight,
    width: 80,
    textAlign: 'center',
  },
  emotionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  emotionChip: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  selectedEmotionChip: {
    backgroundColor: colors.primary,
  },
  emotionText: {
    color: colors.text,
  },
  selectedEmotionText: {
    color: colors.white,
  },
  addEmotionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  addEmotionInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  addEmotionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  medicationDetails: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  noMedicationsText: {
    fontSize: 15,
    color: colors.textLight,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  manageMedsButton: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: 5,
    marginBottom: 30,
  },
  manageMedsText: {
    color: colors.primary,
    fontWeight: '500',
  },
  notesInputContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  notesInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 15,
    paddingRight: 50, // Make room for the mic button
    minHeight: 150,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  micButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: colors.white,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  micButtonActive: {
    backgroundColor: colors.primary,
  },
  listeningText: {
    color: colors.primary,
    fontStyle: 'italic',
    marginTop: -25,
    marginBottom: 25,
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  nextButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
  },
  nextButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
    marginRight: 10,
  },
  backButton: {
    backgroundColor: colors.background,
    borderColor: colors.card.border,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  backButtonText: {
    color: colors.text,
    fontWeight: '500',
    fontSize: 16,
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
    marginRight: 10,
  },
  loading: {
    marginVertical: 30,
  },
  noMedicationsContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
}); 