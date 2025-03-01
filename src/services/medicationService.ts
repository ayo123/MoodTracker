import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../config/env';
import { api } from './api';

// Define our medication type
export interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  time?: string;
  notes?: string;
}

// Initial sample medications
const initialMedications: Medication[] = [
  { id: 1, name: 'Lithium', dosage: '300mg', frequency: 'Twice daily', time: '9:00 AM, 9:00 PM', notes: 'Take with food' },
  { id: 2, name: 'Lamotrigine', dosage: '200mg', frequency: 'Once daily', time: '9:00 AM', notes: '' },
  { id: 3, name: 'Quetiapine', dosage: '50mg', frequency: 'At bedtime', time: '10:00 PM', notes: 'May cause drowsiness' },
];

// Storage key
const MEDICATIONS_STORAGE_KEY = 'mood_tracker_medications';

export const medicationService = {
  // Get all medications
  getMedications: async (): Promise<Medication[]> => {
    try {
      // Always check local storage first to avoid unnecessary API calls
      const storedData = await AsyncStorage.getItem(MEDICATIONS_STORAGE_KEY);
      
      // If we have data in storage, use that
      if (storedData) {
        return JSON.parse(storedData);
      }
      
      // If we're in mock mode or the API endpoint doesn't exist yet, use initial data
      if (env.enableMockData || __DEV__) {
        await AsyncStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(initialMedications));
        return initialMedications;
      }
      
      // Only try the API if we're not in mock mode and we don't have local data
      const response = await api.get('/medications/');
      await AsyncStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Error fetching medications:', error);
      // If all else fails, return initial medications
      return initialMedications;
    }
  },
  
  // Save medications (create, update, delete)
  saveMedications: async (medications: Medication[]): Promise<void> => {
    try {
      // Always save to local storage
      await AsyncStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(medications));
      
      // Only try API if we're not in mock mode
      if (!env.enableMockData && !__DEV__) {
        await api.post('/medications/batch/', { medications });
      }
    } catch (error) {
      console.error('Error saving medications:', error);
    }
  },
  
  // Add a single medication
  addMedication: async (medication: Omit<Medication, 'id'>): Promise<Medication> => {
    const medications = await medicationService.getMedications();
    const newId = medications.length > 0 
      ? Math.max(...medications.map(m => m.id)) + 1 
      : 1;
    
    const newMedication = { ...medication, id: newId };
    const updatedList = [...medications, newMedication];
    
    await medicationService.saveMedications(updatedList);
    return newMedication;
  },
  
  // Update a single medication
  updateMedication: async (medication: Medication): Promise<Medication> => {
    const medications = await medicationService.getMedications();
    const updatedList = medications.map(med => 
      med.id === medication.id ? medication : med
    );
    
    await medicationService.saveMedications(updatedList);
    return medication;
  },
  
  // Delete a single medication
  deleteMedication: async (id: number): Promise<void> => {
    const medications = await medicationService.getMedications();
    const updatedList = medications.filter(med => med.id !== id);
    
    await medicationService.saveMedications(updatedList);
  }
}; 