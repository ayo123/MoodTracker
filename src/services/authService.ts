import env from '../config/env';
import { api } from './api';
import { mockLogin, mockRegister } from './mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  login: async (email: string, password: string) => {
    try {
      if (env.enableMockData && __DEV__) {
        console.log('DEV MODE: Using mock login');
        const mockResponse = mockLogin(email, password);
        await AsyncStorage.setItem('token', mockResponse.token);
        return mockResponse;
      }
      
      // Try to connect to real API
      const response = await api.post('/auth/login/', { email, password });
      await AsyncStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error: any) {
      console.error('Login error details:', error);
      
      // Handle network errors
      if (!error.response || error.message?.includes('Network Error')) {
        console.warn('Network error detected, trying fallback...');
        
        // Try mock data as fallback in development
        if (env.enableMockData && __DEV__) {
          try {
            console.log('Using mock login fallback');
            const mockResponse = mockLogin(email, password);
            await AsyncStorage.setItem('token', mockResponse.token);
            return mockResponse;
          } catch (mockError) {
            console.error('Mock login failed:', mockError);
            throw new Error('Invalid credentials');
          }
        }
        
        throw new Error('Network error - please check your connection');
      }
      
      // Handle other errors
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      }
      
      throw error;
    }
  },
  
  register: async (email: string, password: string) => {
    try {
      if (env.enableMockData && __DEV__) {
        console.log('DEV MODE: Using mock register');
        const mockResponse = mockRegister(email, password);
        await AsyncStorage.setItem('token', mockResponse.token);
        return mockResponse;
      }
      
      // Try to connect to real API
      const response = await api.post('/auth/register/', { email, password });
      await AsyncStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error: any) {
      // Handle network errors with mock data fallback
      if (!error.response || error.message?.includes('Network Error')) {
        if (env.enableMockData && __DEV__) {
          try {
            console.log('Using mock register fallback');
            const mockResponse = mockRegister(email, password);
            await AsyncStorage.setItem('token', mockResponse.token);
            return mockResponse;
          } catch (mockError) {
            console.error('Mock register failed:', mockError);
            throw mockError;
          }
        }
        
        throw new Error('Network error - please check your connection');
      }
      
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
}; 