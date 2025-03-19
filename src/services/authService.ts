import env from '../config/env';
import { api } from './api';
import { mockLogin, mockRegister } from './mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../utils/apiClient';
import { useAuthStore } from '../store/authStore';

// Token keys for AsyncStorage
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

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
  
  // Login with Google ID token
  async loginWithGoogle(idToken: string) {
    try {
      const response = await apiClient.post('/auth/google/', {
        id_token: idToken,
      });
      
      return {
        success: true,
        token: response.data.token,
        user: response.data.user,
      };
    } catch (error) {
      console.error('Google login error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Authentication failed',
      };
    }
  },
  
  // Save authentication token
  async saveAuthToken(token: string) {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving auth token:', error);
      throw error;
    }
  },
  
  // Get authentication token
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },
  
  // Save user data
  async saveUserData(userData: any) {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  },
  
  // Get user data
  async getUserData() {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },
  
  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const token = await this.getAuthToken();
      return !!token;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },
  
  // Add this method if it doesn't exist
  loginWithGoogleAccessToken: async (accessToken: string, email: string) => {
    try {
      const response = await api.post('/auth/google-token/', {
        access_token: accessToken,
        email: email
      });
      return response.data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },
  
  // Add a development bypass for testing
  loginWithGoogleDev: async (userData) => {
    // Only in development, create a fake token and user
    if (__DEV__) {
      console.log('DEV MODE: Using development authentication bypass');
      
      // Create a mock user and token
      const mockUser = {
        id: 1,
        name: userData.name || 'Test User',
        email: userData.email || 'test@example.com',
      };
      
      const mockToken = 'dev-token-' + Math.random().toString(36).substring(2);
      
      // Store in AsyncStorage
      await AsyncStorage.setItem('token', mockToken);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      
      // Update the auth store
      useAuthStore.getState().setAuth(mockToken, mockUser);
      
      return { token: mockToken, user: mockUser };
    }
    
    throw new Error('Backend JWT verification is not properly configured');
  },
}; 