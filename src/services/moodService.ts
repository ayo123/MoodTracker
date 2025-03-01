import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../config/env';
import { api } from './api';

// Define interfaces for Mood data
export interface Emotion {
  id: number;
  name: string;
}

export interface MedicationTaken {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  taken: boolean;
  time?: string;
}

export interface MoodEntry {
  id?: number;
  date: string;
  mood: {
    name: string;
    score: number;
    category: string;
  };
  emotions?: Emotion[];
  notes?: string;
  medicationsTaken?: MedicationTaken[];
}

// Sample initial moods
const initialMoods: MoodEntry[] = [
  { date: '2023-10-23', mood: { name: 'Happy', score: 8, category: 'Hypomania' }},
  { date: '2023-10-22', mood: { name: 'Calm', score: 5, category: 'Euthymic' }},
  { date: '2023-10-21', mood: { name: 'Tired', score: 2, category: 'Depression' }},
  { date: '2023-10-20', mood: { name: 'Anxious', score: 1, category: 'Deep Depression' }},
];

// Storage key
const MOODS_STORAGE_KEY = 'mood_tracker_moods';

export const moodService = {
  // Get all mood entries
  getMoods: async (): Promise<MoodEntry[]> => {
    try {
      // Always check local storage first
      const storedData = await AsyncStorage.getItem(MOODS_STORAGE_KEY);
      
      if (storedData) {
        return JSON.parse(storedData);
      }
      
      // If no stored data, initialize with sample data
      if (env.enableMockData || __DEV__) {
        await AsyncStorage.setItem(MOODS_STORAGE_KEY, JSON.stringify(initialMoods));
        return initialMoods;
      }
      
      // Try API if not in mock mode
      const response = await api.get('/moods/');
      await AsyncStorage.setItem(MOODS_STORAGE_KEY, JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Error fetching moods:', error);
      return initialMoods;
    }
  },
  
  // Save a new mood entry
  saveMood: async (moodEntry: MoodEntry): Promise<MoodEntry> => {
    try {
      // Get existing moods
      const moods = await moodService.getMoods();
      
      // Check if we're updating an existing entry for the same date
      const existingIndex = moods.findIndex(m => m.date === moodEntry.date);
      
      let updatedMoods: MoodEntry[];
      
      // If entry exists for this date, update it
      if (existingIndex >= 0) {
        updatedMoods = [
          ...moods.slice(0, existingIndex),
          { ...moodEntry, id: moods[existingIndex].id },
          ...moods.slice(existingIndex + 1)
        ];
      } else {
        // Otherwise add as new entry
        const newId = Math.max(...moods.map(m => m.id || 0), 0) + 1;
        updatedMoods = [{ ...moodEntry, id: newId }, ...moods];
      }
      
      // Save to storage
      await AsyncStorage.setItem(MOODS_STORAGE_KEY, JSON.stringify(updatedMoods));
      
      // Save to API if not in mock mode
      if (!env.enableMockData && !__DEV__) {
        if (existingIndex >= 0) {
          await api.put(`/moods/${moodEntry.id}/`, moodEntry);
        } else {
          const response = await api.post('/moods/', moodEntry);
          return response.data;
        }
      }
      
      return moodEntry;
    } catch (error) {
      console.error('Error saving mood:', error);
      throw error;
    }
  },
  
  // Get today's mood entry if it exists
  getTodaysMood: async (): Promise<MoodEntry | null> => {
    try {
      const moods = await moodService.getMoods();
      const today = new Date().toISOString().split('T')[0];
      return moods.find(mood => mood.date === today) || null;
    } catch (error) {
      console.error('Error getting today\'s mood:', error);
      return null;
    }
  },
  
  // Get the latest mood entry
  getLatestMood: async (): Promise<MoodEntry | null> => {
    try {
      const moods = await moodService.getMoods();
      return moods.length > 0 ? moods[0] : null;
    } catch (error) {
      console.error('Error getting latest mood:', error);
      return null;
    }
  }
}; 