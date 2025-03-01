import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const API_URL = 'http://10.0.2.2:8000/api';  // Android emulator localhost

export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login/', {
        email,
        password,
      });
      await AsyncStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error: any) {
      if (error.message.includes('timeout') || error.message.includes('Network')) {
        throw new Error('Connection failed - please check your internet connection and try again');
      }
      throw error;
    }
  },

  register: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/register/', {
        email,
        password,
      });
      await AsyncStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error: any) {
      if (error.message.includes('timeout') || error.message.includes('Network')) {
        throw new Error('Connection failed - please check your internet connection and try again');
      }
      throw error;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
    } catch (error) {
      throw error;
    }
  },

  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  },
};
