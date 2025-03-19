import axios from 'axios';
import env from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Create axios instance with base URL
const api = axios.create({
  baseURL: env.apiUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  // Add timeout configuration without using AbortSignal
  timeout: 10000, // 10 seconds
  timeoutErrorMessage: 'Request timed out - please check your connection'
});

// Update the request interceptor to get token from AsyncStorage directly
api.interceptors.request.use(
  async (config) => {
    try {
      // Get token directly from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      
      // If token exists, add to request headers
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    } catch (error) {
      console.error('Error accessing token in request interceptor:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response logging
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('=== RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Headers:', JSON.stringify(response.headers, null, 2));
      console.log('Data:', response.data ? JSON.stringify(response.data, null, 2) : 'No response data');
    }
    return response;
  },
  async (error) => {
    // Log API errors in development
    if (__DEV__) {
      console.log('=== ERROR RESPONSE ===');
      console.log('Error:', error.message);
      console.log('Status:', error.response?.status);
      console.log('Headers:', JSON.stringify(error.response?.headers, null, 2));
      console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    }
    
    // Handle authentication errors (token expired)
    if (error.response?.status === 401) {
      console.error('Authentication error:', error.response?.data);
      
      try {
        // Get token directly from AsyncStorage
        const token = await AsyncStorage.getItem('token');
        const isDevToken = token && token.startsWith('dev-token-');
        
        // Only auto-logout if not using a dev token
        if (!isDevToken) {
          console.log('Authentication failed with real token - logging out');
          
          // Just clear storage directly instead of using the store
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          
          // We'll rely on App.tsx to notice the token is gone and update UI
        } else {
          console.log('Using DEV token - ignoring auth errors');
        }
      } catch (storageError) {
        console.error('Error checking token:', storageError);
      }
    }
    
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error);
      throw new Error('Connection timed out - please try again');
    }
    
    if (!error.response) {
      console.error('Network error:', error);
      throw new Error('Network error - please check your connection');
    }

    // If network error and mock data is enabled, console log it instead of failing
    if (env.enableMockData && __DEV__ && 
        (error.message?.includes('Network Error') || !error.response)) {
      console.warn('Network error - using mock data instead');
      // Don't actually reject - let the service handle it with mock data
      return Promise.resolve({ 
        data: null, 
        headers: {}, 
        status: 200, 
        statusText: 'OK',
        config: error.config,
        _usedMockData: true 
      });
    }
    return Promise.reject(error);
  }
);

// Get the API URL based on environment
const getBaseURL = () => {
  if (__DEV__) {
    // When using Expo Go on a physical device through tunnel
    if (Constants.appOwnership === 'expo' && Platform.OS === 'android') {
      // You can manually update this when you run the backend
      return 'http://yourngrokurl.ngrok.io/api';
    }
    
    // Use localhost for iOS simulator
    if (Platform.OS === 'ios') {
      return 'http://127.0.0.1:8000/api';
    }
    
    // Use 10.0.2.2 for Android emulator
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000/api';
    }
  }
  
  // Production URL
  return 'https://your-production-api.com/api';
};

// Add a helper function that fixes the AbortSignal issue
export const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
  // Use the AbortController API instead of AbortSignal.timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));
};

export { api };
