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

export interface MoodScore {
  score: number;
  name: string;
}

export interface MoodEntry {
  id?: string;
  date: string;
  mood: MoodScore;
  emotions: Array<{ id: number; name: string }>;
  notes: string;
  medicationsTaken?: Array<{
    id: string;
    name: string;
    dosage: string;
    taken: boolean;
  }>;
}

// Sample initial moods
const initialMoods: MoodEntry[] = [
  { date: '2023-10-23', mood: { name: 'Happy', score: 8 }},
  { date: '2023-10-22', mood: { name: 'Calm', score: 5 }},
  { date: '2023-10-21', mood: { name: 'Tired', score: 2 }},
  { date: '2023-10-20', mood: { name: 'Anxious', score: 1 }},
];

// Check if you have mock data that needs updating
const mockMoods: MoodEntry[] = [
  {
    id: '1',
    date: "2023-10-15", // YYYY-MM-DD format
    mood: { name: "Happy", score: 7 },
    emotions: [{ id: 1, name: "Excited" }],
    notes: "Had a great day!"
  },
  // More mock entries...
];

// Storage key
const MOODS_STORAGE_KEY = 'mood_tracker_moods';

class MoodService {
  // Get all mood entries
  async getMoods(): Promise<MoodEntry[]> {
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
      const response = await api.get('/moods/moods/');
      await AsyncStorage.setItem(MOODS_STORAGE_KEY, JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Error fetching moods:', error);
      return initialMoods;
    }
  }
  
  // Get today's mood if it exists
  async getTodaysMood(): Promise<MoodEntry | null> {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      console.log('Checking for mood on date:', today);
      
      // Get all moods
      const response = await api.get('/moods/moods/');
      const moods = response.data;
      
      // Find mood with today's date
      const todayMood = moods.find(m => m.date === today);
      console.log('Found today\'s mood:', todayMood ? 'yes' : 'no');
      
      return todayMood || null;
    } catch (error) {
      console.error('Error fetching today\'s mood:', error);
      return null;
    }
  }
  
  // Get the most recent mood entry
  async getLatestMood(): Promise<MoodEntry | null> {
    try {
      const response = await api.get('/moods/moods/?ordering=-date&limit=1');
      
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      return null;
    } catch (error) {
      console.error('Error fetching latest mood:', error);
      return null;
    }
  }
  
  // Get mood by ID
  async getMoodById(id: string): Promise<MoodEntry | null> {
    try {
      const response = await api.get(`/moods/moods/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching mood with ID ${id}:`, error);
      return null;
    }
  }
  
  // Get mood by date
  async getMoodByDate(date: string): Promise<MoodEntry | null> {
    try {
      const response = await api.get(`/moods/moods/?date=${date}`);
      
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      return null;
    } catch (error) {
      console.error(`Error fetching mood for date ${date}:`, error);
      return null;
    }
  }
  
  // Get mood entries within a date range
  async getMoodRange(fromDate: string, toDate: string): Promise<MoodEntry[]> {
    try {
      const response = await api.get(`/moods/moods/?from_date=${fromDate}&to_date=${toDate}`);
      return response.data || [];
    } catch (error) {
      console.error(`Error fetching moods from ${fromDate} to ${toDate}:`, error);
      return [];
    }
  }
  
  // Save a new mood entry or update an existing one
  async saveMoodEntry(moodEntry: MoodEntry): Promise<MoodEntry | null> {
    try {
      let response;
      console.log('Saving mood entry:', moodEntry);
      
      if (moodEntry.id) {
        // Update existing mood - make sure URL is correct format for mock middleware
        console.log(`Updating mood with ID: ${moodEntry.id}`);
        response = await api.put(`/moods/moods/${moodEntry.id}/`, moodEntry);
      } else {
        // Create new mood
        console.log('Creating new mood');
        response = await api.post('/moods/moods/', moodEntry);
      }
      
      console.log('Mood saved successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error saving mood entry:', error);
      throw error;
    }
  }
  
  // Delete a mood entry
  async deleteMood(id: string): Promise<boolean> {
    try {
      await api.delete(`/moods/moods/${id}/`);
      return true;
    } catch (error) {
      console.error(`Error deleting mood with ID ${id}:`, error);
      return false;
    }
  }

  // Add this function to your MoodService class
  async getAllMoods(): Promise<MoodEntry[]> {
    try {
      console.log('Getting all moods');
      const response = await api.get('/moods/moods/');
      console.log(`Retrieved ${response.data.length} moods`);
      return response.data || [];
    } catch (error) {
      console.error('Error in getAllMoods:', error);
      return [];
    }
  }
}

export const moodService = new MoodService(); 