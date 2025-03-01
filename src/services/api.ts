import axios from 'axios';
import env from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Create axios instance with base URL
export const api = axios.create({
  baseURL: env.apiUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  // Add timeout configuration
  timeout: 10000, // 10 seconds
  timeoutErrorMessage: 'Request timed out - please check your connection'
});

// Add request logging
api.interceptors.request.use(
  async (config) => {
    // Log the request details in development
    if (__DEV__) {
      console.log('=== REQUEST ===');
      console.log('URL:', config.url);
      console.log('Method:', config.method);
      console.log('Headers:', JSON.stringify(config.headers, null, 2));
      console.log('Data:', config.data ? JSON.stringify(config.data, null, 2) : 'No body data');
    }
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error accessing token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
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
    if (__DEV__) {
      console.log('=== ERROR RESPONSE ===');
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Headers:', JSON.stringify(error.response.headers, null, 2));
        console.log('Data:', error.response.data ? JSON.stringify(error.response.data, null, 2) : 'No response data');
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

    console.error('API Error:', error.response?.data);

    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      await AsyncStorage.removeItem('token');
      // We would navigate to login here, but that requires access to navigation
      // This is usually handled at a higher level in the app
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
